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

  const [payAllDialogOpen, setPayAllDialogOpen] = useState(false);

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

  const handlePayAllDues = (e: React.FormEvent) => {
    e.preventDefault();
    const unpaidDues = dues.filter(d => !d.is_paid);
    if (unpaidDues.length === 0) return;

    let newPaid = { ...paidLabs };
    unpaidDues.forEach(d => {
       newPaid[d.id] = d.total_price;
    });

    setPaidLabs(newPaid);
    localStorage.setItem('diag_paid_labs', JSON.stringify(newPaid));

    setDues(dues.map(d => {
       return { ...d, paid_amount: d.total_price, remaining_due: 0, is_paid: true };
    }));

    setPayAllDialogOpen(false);
    alert("All dues paid successfully!");
  };

  return (
    <>
    <div className="print:hidden flex flex-col gap-6 w-full max-w-6xl mx-auto">
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
                 <div className="text-right flex flex-col items-end gap-2">
                    <div className="text-sm text-muted-foreground">Total Dues</div>
                    <div className="text-2xl font-bold text-red-600">
                      ${dues.filter(d => !d.is_paid).reduce((acc, curr) => acc + curr.remaining_due, 0)}
                    </div>
                    {dues.filter(d => !d.is_paid).length > 0 && (
                      <Button onClick={() => setPayAllDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                        Pay All Dues
                      </Button>
                    )}
                    <Button onClick={() => window.print()} variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
                      <Receipt className="h-4 w-4 mr-2" />
                      Print Invoice
                    </Button>
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
      
      {/* Pay All Dialog */}
      <Dialog open={payAllDialogOpen} onOpenChange={setPayAllDialogOpen}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Pay All Dues</DialogTitle>
               <DialogDescription>
                  You are about to pay all remaining dues for {patient?.full_name}.
               </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePayAllDues} className="grid gap-4 py-4">
               <div className="flex justify-between pb-4 border-b">
                  <span className="text-muted-foreground font-semibold">Total Remaining Dues:</span>
                  <span className="font-bold text-red-600">
                     ${dues.filter(d => !d.is_paid).reduce((acc, curr) => acc + curr.remaining_due, 0)}
                  </span>
               </div>
               <div className="flex justify-end pt-4 gap-2">
                  <Button type="button" variant="outline" onClick={() => setPayAllDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">Confirm Payment</Button>
               </div>
            </form>
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

    {/* Printable Unified Invoice */}
    {patient && (
      <div className="hidden print:block w-full bg-white text-black bg-white p-10 font-sans fixed inset-0 z-[100] h-screen overflow-visible">
        <div className="max-w-4xl mx-auto border border-gray-200 p-10 rounded-xl shadow-sm">
          <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">INVOICE</h1>
              <p className="text-sm text-gray-500 mt-2 font-mono">#{Math.floor(Date.now() / 1000).toString()}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-900">Hospital Management Sys</h2>
              <p className="text-sm text-gray-500 mt-1">123 Health Ave, Medical City</p>
              <p className="text-sm text-gray-500">contact@hms-hospital.com</p>
              <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
            </div>
          </div>

          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</p>
              <h3 className="text-lg font-bold text-gray-900">{patient.full_name}</h3>
              <p className="text-sm text-gray-600 mt-1">Patient ID: <span className="font-mono">{patient.patient_id}</span></p>
              <p className="text-sm text-gray-600">Phone: {patient.phone}</p>
              <p className="text-sm text-gray-600">Age/Gender: {patient.age} / {patient.gender}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Invoice Info</p>
              <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">Time: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-900 border-b border-gray-200">
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Test/Service Name</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-right">Price</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-right">Paid</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-right">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dues.map((d, index) => (
                  <tr key={index} className="text-sm text-gray-700 bg-white">
                    <td className="py-4 px-4 font-medium text-gray-900">{d.test_name}</td>
                    <td className="py-4 px-4 text-gray-500">{new Date(d.test_date || d.created_at).toLocaleDateString()}</td>
                    <td className="py-4 px-4 text-right">${d.total_price.toFixed(2)}</td>
                    <td className="py-4 px-4 text-right text-gray-600">${Number(d.paid_amount || 0).toFixed(2)}</td>
                    <td className="py-4 px-4 text-right font-medium text-gray-900">${d.remaining_due.toFixed(2)}</td>
                  </tr>
                ))}
                {dues.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500 italic">No tests or services found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-12">
            <div className="w-1/2 p-6 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-3 text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">${dues.reduce((acc, d) => acc + d.total_price, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-3 text-sm">
                <span className="text-gray-600">Total Paid:</span>
                <span className="font-medium text-green-600">${dues.reduce((acc, d) => acc + (d.paid_amount || 0), 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <span className="text-base font-bold text-gray-900">Total Due:</span>
                <span className="text-xl font-bold text-red-600">
                  ${dues.reduce((acc, d) => acc + d.remaining_due, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 text-center">
             <p className="text-sm font-medium text-gray-900 mb-1">Thank you for your trust in our hospital.</p>
             <p className="text-xs text-gray-500">If you have any questions concerning this invoice, please contact our billing department.</p>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
