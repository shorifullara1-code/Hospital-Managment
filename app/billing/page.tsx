"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, CreditCard, Receipt, ScanBarcode } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function BillingView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [dues, setDues] = useState<any[]>([]);
  const [payAmount, setPayAmount] = useState<Record<string, string>>({});

  const [paidLabs, setPaidLabs] = useState<Record<string, number | boolean>>({});
  
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState<any>(null);
  const [currentPayAmount, setCurrentPayAmount] = useState("");

  useEffect(() => {
    // Load local storage payments (stored as object { labId: numberPaid })
    const paidStorage = localStorage.getItem('diag_paid_labs');
    if (paidStorage) {
      setPaidLabs(JSON.parse(paidStorage));
    }
  }, []);

  const performSearch = async (query: string) => {
    if (!query) return;
    
    setLoading(true);
    setPatient(null);
    setDues([]);
    
    // Find patient by ID
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('patient_id', query)
      .single();
      
    if (patientData) {
       setPatient(patientData);
       // Fetch unpaid tests (assuming using localstorage testCatalog for prices if not in DB)
       const { data: labsData } = await supabase
         .from('diagnostics_labs')
         .select('*, doctors(*)')
         .eq('patient_id', patientData.id)
         .order('created_at', { ascending: false });

       if (labsData) {
         const storedCatalog = localStorage.getItem('diag_catalog');
         const catalog = storedCatalog ? JSON.parse(storedCatalog) : [];
         
         const labsWithPrices = labsData.map(lab => {
            const test = catalog.find((t: any) => t.name === lab.test_name);
            const price = test ? test.price : 50; // Default price
            
            // Check paid amount from localstorage (simple tracker)
            let paidAmount = 0;
            if (paidLabs[lab.id] === true) {
               paidAmount = price; // Old format (boolean) mapping to full price
            } else {
               paidAmount = Number(paidLabs[lab.id]) || 0;
            }
            const remainingDue = price - paidAmount;
            const isFullyPaid = remainingDue <= 0;
            
            return {
               ...lab,
               total_price: price,
               paid_amount: paidAmount,
               remaining_due: remainingDue,
               is_paid: isFullyPaid
            };
         });
         
         setDues(labsWithPrices);
       }
    } else {
       alert("Patient not found. Check Patient ID.");
    }
    
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const code = detectedCodes[0].rawValue;
      setSearchQuery(code);
      setScannerOpen(false);
      performSearch(code);
    }
  };

  const processPayment = (e: React.FormEvent) => {
     e.preventDefault();
     if (!selectedLab || !currentPayAmount) return;
     
     const amountToAdd = parseFloat(currentPayAmount) || 0;
     if (amountToAdd <= 0) return;
     
     const currentVal = paidLabs[selectedLab.id];
     const currentPaid = currentVal === true ? selectedLab.total_price : (Number(currentVal) || 0);
     const newTotalPaid = currentPaid + amountToAdd;
     
     const newPaid = { ...paidLabs, [selectedLab.id]: newTotalPaid };
     setPaidLabs(newPaid);
     localStorage.setItem('diag_paid_labs', JSON.stringify(newPaid));
     
     // Update current local state
     setDues(dues.map(d => {
        if (d.id === selectedLab.id) {
           const remDue = Math.max(0, d.total_price - newTotalPaid);
           return { ...d, paid_amount: newTotalPaid, remaining_due: remDue, is_paid: remDue <= 0 };
        }
        return d;
     }));
     
     setPaymentDialogOpen(false);
     setSelectedLab(null);
     setCurrentPayAmount("");
     alert("Payment successful!");
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Dues</h1>
        <p className="text-muted-foreground">
          Manage patient test bills and collect due payments.
        </p>
      </div>

      <Card>
        <CardHeader>
           <CardTitle>Find Patient Bills</CardTitle>
           <CardDescription>Enter Patient ID (e.g., PT-1234) or scan their ID Card barcode.</CardDescription>
        </CardHeader>
        <CardContent>
           <form onSubmit={handleSearch} className="flex gap-4 items-end max-w-lg">
              <div className="flex gap-2 w-full items-end">
                <div className="grid gap-2 flex-1">
                   <Label>Patient ID</Label>
                   <Input 
                     value={searchQuery} 
                     onChange={e => setSearchQuery(e.target.value)} 
                     placeholder="e.g. PT-1234" 
                     required
                   />
                </div>
                <Button type="button" variant="outline" size="icon" onClick={() => setScannerOpen(true)}>
                  <ScanBarcode className="h-5 w-5" />
                </Button>
              </div>
              <Button type="submit" disabled={loading}>
                 {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                 Search
              </Button>
           </form>
        </CardContent>
      </Card>

      {patient && (
         <Card>
            <CardHeader className="border-b bg-muted/20 pb-4 mb-4">
               <div className="flex justify-between items-start">
                 <div>
                    <CardTitle className="text-xl">{patient.full_name}</CardTitle>
                    <CardDescription>ID: {patient.patient_id} | Phone: {patient.phone}</CardDescription>
                 </div>
                 <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total Dues</div>
                    <div className="text-2xl font-bold text-red-600">
                      ${dues.filter(d => !d.is_paid).reduce((acc, curr) => acc + curr.remaining_due, 0)}
                    </div>
                 </div>
               </div>
            </CardHeader>
            <CardContent>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Test Date</TableHead>
                     <TableHead>Test Name</TableHead>
                     <TableHead>Total Cost</TableHead>
                     <TableHead>Paid</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead className="text-right">Action</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {dues.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No diagnostics found for this patient.</TableCell>
                     </TableRow>
                   ) : (
                     dues.map(d => (
                       <TableRow key={d.id}>
                         <TableCell>{d.test_date}</TableCell>
                         <TableCell className="font-medium">{d.test_name}</TableCell>
                         <TableCell className="font-bold">${d.total_price}</TableCell>
                         <TableCell className="text-green-600 font-medium">${d.paid_amount || 0}</TableCell>
                         <TableCell>
                            {d.is_paid ? (
                               <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Paid full</Badge>
                            ) : (
                               <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Due: ${d.remaining_due}</Badge>
                            )}
                         </TableCell>
                         <TableCell className="text-right">
                            {!d.is_paid ? (
                               <Button size="sm" onClick={() => { setSelectedLab(d); setCurrentPayAmount(d.remaining_due.toString()); setPaymentDialogOpen(true); }} className="bg-green-600 hover:bg-green-700">
                                 <CreditCard className="h-4 w-4 mr-2" />
                                 Pay
                               </Button>
                            ) : (
                               <Button variant="ghost" size="sm" onClick={() => window.open(`/diagnostics/receipt/${d.id}`, '_blank')}>
                                 <Receipt className="h-4 w-4 mr-2 text-green-600" />
                                 Receipt
                               </Button>
                            )}
                         </TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
               </Table>
            </CardContent>
         </Card>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Make a Payment</DialogTitle>
               <DialogDescription>
                  Enter the amount the patient is paying for {selectedLab?.test_name}.
               </DialogDescription>
            </DialogHeader>
            {selectedLab && (
               <form onSubmit={processPayment} className="grid gap-4 py-4">
                  <div className="flex justify-between pb-4 border-b">
                     <span className="text-muted-foreground">Total Cost:</span>
                     <span className="font-medium">${selectedLab.total_price}</span>
                  </div>
                  <div className="flex justify-between pb-4 border-b">
                     <span className="text-muted-foreground">Already Paid:</span>
                     <span className="font-medium text-green-600">${selectedLab.paid_amount || 0}</span>
                  </div>
                  <div className="flex justify-between pb-4 border-b">
                     <span className="text-muted-foreground font-semibold">Remaining Due:</span>
                     <span className="font-bold text-red-600">${selectedLab.remaining_due}</span>
                  </div>
                  <div className="grid gap-2 pt-4">
                     <Label>Payment Amount ($)</Label>
                     <Input 
                        type="number" 
                        min="1" 
                        max={selectedLab.remaining_due} 
                        step="0.01"
                        value={currentPayAmount}
                        onChange={(e) => setCurrentPayAmount(e.target.value)}
                        required
                     />
                  </div>
                  <div className="flex justify-end pt-4 gap-2">
                     <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                     <Button type="submit">Confirm Payment</Button>
                  </div>
               </form>
            )}
         </DialogContent>
      </Dialog>
      
      {/* Scanner Dialog */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Scan Patient ID</DialogTitle>
            <DialogDescription>
              Point your camera at the barcode on the patient ID card.
            </DialogDescription>
          </DialogHeader>
          <div className="w-full flex justify-center items-center overflow-hidden rounded-md bg-black">
             {scannerOpen && (
               <Scanner
                  onScan={handleScan}
                  formats={['code_128', 'qr_code']}
               />
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
