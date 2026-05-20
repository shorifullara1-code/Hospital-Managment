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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
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
  const [selectedDues, setSelectedDues] = useState<string[]>([]);
  const [bulkPaymentDialogOpen, setBulkPaymentDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [hospitalSettings, setHospitalSettings] = useState<any>({});

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
    const settings = localStorage.getItem('hospital_settings');
    if (settings) {
       setHospitalSettings(JSON.parse(settings));
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

  const toggleSelectDue = (id: string) => {
     setSelectedDues(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
     if (selectedDues.length === dues.length) {
        setSelectedDues([]);
     } else {
        setSelectedDues(dues.map(d => d.id));
     }
  };

  const processBulkPayment = (e: React.FormEvent) => {
     e.preventDefault();
     if (selectedDues.length === 0 || !currentPayAmount) return;

     const amountToAdd = parseFloat(currentPayAmount) || 0;
     if (amountToAdd <= 0) return;

     // We distribute the amount among selected dues sequentially or simply accept it as total
     // The simplest is to fulfill dues sequentially up to the paid amount, or if they just typed the EXACT remaining, it pays all.
     // Requirement says "pay them together", so we distribute the bulk payment across selected dues.
     
     let remainingBulkPayment = amountToAdd;
     let newPaidLabs = { ...paidLabs };
     
     const updatedDues = dues.map(d => {
        if (selectedDues.includes(d.id) && remainingBulkPayment > 0) {
           const remDue = d.remaining_due;
           if (remDue > 0) {
              const paymentForThis = Math.min(remDue, remainingBulkPayment);
              
              const currentPaid = newPaidLabs[d.id] === true ? d.total_price : (Number(newPaidLabs[d.id]) || 0);
              const newTotalPaid = currentPaid + paymentForThis;
              
              newPaidLabs[d.id] = newTotalPaid;
              remainingBulkPayment -= paymentForThis;
              
              const newRemainingDue = d.total_price - newTotalPaid;
              return { ...d, paid_amount: newTotalPaid, remaining_due: newRemainingDue, is_paid: newRemainingDue <= 0 };
           }
        }
        return d;
     });
     
     setPaidLabs(newPaidLabs);
     localStorage.setItem('diag_paid_labs', JSON.stringify(newPaidLabs));
     setDues(updatedDues);
     
     setBulkPaymentDialogOpen(false);
     setCurrentPayAmount("");
     
     // After payment, automatically open invoice for the selected dues
     setInvoiceDialogOpen(true);
     setInvoiceId(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
     setInvoiceDate(new Date().toLocaleDateString());
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
    <div className={cn("flex flex-col gap-6 w-full max-w-6xl mx-auto", invoiceDialogOpen ? "print:hidden" : "")}>
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
                      ৳{dues.filter(d => !d.is_paid).reduce((acc, curr) => acc + curr.remaining_due, 0)}
                    </div>
                    {selectedDues.length > 0 && (
                      <div className="flex items-center gap-2 mt-4 justify-end">
                         <Button onClick={() => setInvoiceDialogOpen(true)} variant="outline" className="bg-white">
                           <Receipt className="h-4 w-4 mr-2" />
                           Generate Invoice
                         </Button>
                         <Button onClick={() => {
                            const totalSelectedRemaining = dues.filter(d => selectedDues.includes(d.id)).reduce((acc, curr) => acc + curr.remaining_due, 0);
                            setCurrentPayAmount(totalSelectedRemaining.toString());
                            setBulkPaymentDialogOpen(true);
                         }} className="bg-green-600 hover:bg-green-700">
                           <CreditCard className="h-4 w-4 mr-2" />
                           Pay Selected ({selectedDues.length})
                         </Button>
                      </div>
                    )}
                 </div>
               </div>
            </CardHeader>
            <CardContent>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead className="w-12">
                        <Checkbox 
                          checked={selectedDues.length > 0 && selectedDues.length === dues.length} 
                          onCheckedChange={toggleSelectAll} 
                          aria-label="Select all"
                        />
                     </TableHead>
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
                       <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No diagnostics found for this patient.</TableCell>
                     </TableRow>
                   ) : (
                     dues.map(d => (
                       <TableRow key={d.id} className={selectedDues.includes(d.id) ? "bg-muted/50" : ""}>
                         <TableCell>
                           <Checkbox 
                             checked={selectedDues.includes(d.id)}
                             onCheckedChange={() => toggleSelectDue(d.id)}
                             aria-label={`Select ${d.test_name}`}
                           />
                         </TableCell>
                         <TableCell>{d.test_date}</TableCell>
                         <TableCell className="font-medium">{d.test_name}</TableCell>
                         <TableCell className="font-bold">৳{d.total_price.toFixed(2)}</TableCell>
                         <TableCell className="text-green-600 font-medium">৳{(d.paid_amount || 0).toFixed(2)}</TableCell>
                         <TableCell>
                            {d.is_paid ? (
                               <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Paid full</Badge>
                            ) : (
                               <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Due: ৳{d.remaining_due.toFixed(2)}</Badge>
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
         <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
               <DialogTitle>Make a Payment</DialogTitle>
               <DialogDescription>
                  Enter the amount the patient is paying for {selectedLab?.test_name}.
               </DialogDescription>
            </DialogHeader>
            {selectedLab && (
               <form onSubmit={processPayment} className="space-y-6 pt-4">
                  <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500">Total Cost:</span>
                       <span className="font-semibold">৳{selectedLab.total_price}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500">Already Paid:</span>
                       <span className="font-semibold text-green-600">৳{selectedLab.paid_amount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t font-bold">
                       <span className="text-slate-900">Remaining Due:</span>
                       <span className="text-red-600">৳{selectedLab.remaining_due}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                     <Label htmlFor="payment-amount" className="text-sm font-semibold">Payment Amount (৳)</Label>
                     <Input 
                        id="payment-amount"
                        type="number" 
                        min="1" 
                        max={selectedLab.remaining_due} 
                        step="0.01"
                        placeholder="Enter amount"
                        value={currentPayAmount}
                        onChange={(e) => setCurrentPayAmount(e.target.value)}
                        required
                        className="h-12 text-lg"
                     />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                     <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)} className="w-full sm:w-auto">
                        Cancel
                     </Button>
                     <Button type="submit" className="w-full sm:w-auto bg-[#15807D] hover:bg-[#0E5C59]">
                        Confirm Payment
                     </Button>
                  </div>
               </form>
            )}
         </DialogContent>
      </Dialog>
      
      {/* Bulk Payment Dialog */}
      <Dialog open={bulkPaymentDialogOpen} onOpenChange={setBulkPaymentDialogOpen}>
         <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
               <DialogTitle>Process Bulk Payment</DialogTitle>
               <DialogDescription>
                  Enter total payment for {selectedDues.length} selected bills.
               </DialogDescription>
            </DialogHeader>
            <form onSubmit={processBulkPayment} className="space-y-6 pt-4">
               {(() => {
                  const items = dues.filter(d => selectedDues.includes(d.id));
                  const total = items.reduce((a, b) => a + b.total_price, 0);
                  const paid = items.reduce((a, b) => a + (b.paid_amount || 0), 0);
                  const rem = items.reduce((a, b) => a + b.remaining_due, 0);
                  return (
                    <>
                      <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-500">Total Cost (Selected):</span>
                           <span className="font-semibold">৳{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-500">Already Paid:</span>
                           <span className="font-semibold text-green-600">৳{paid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t font-bold">
                           <span className="text-slate-900">Remaining Due:</span>
                           <span className="text-red-600">৳{rem.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                         <Label htmlFor="bulk-payment-amount" className="text-sm font-semibold">Payment Amount (৳)</Label>
                         <Input 
                            id="bulk-payment-amount"
                            type="number" 
                            min="1" 
                            max={rem} 
                            step="0.01"
                            placeholder="Enter amount"
                            value={currentPayAmount}
                            onChange={(e) => setCurrentPayAmount(e.target.value)}
                            required
                            className="h-12 text-lg"
                         />
                      </div>
                    </>
                  );
               })()}
               <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setBulkPaymentDialogOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto bg-[#15807D] hover:bg-[#0E5C59]">
                    Confirm Payment
                  </Button>
               </div>
            </form>
         </DialogContent>
      </Dialog>

      {/* Invoice Modal for selected items */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
         <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto print:absolute print:left-0 print:top-0 print:translate-x-0 print:translate-y-0 print:w-full print:h-auto print:max-h-none print:overflow-visible print:p-0 print:m-0 print:border-none print:shadow-none bg-white">
            <DialogHeader className="print:hidden">
               <DialogTitle>Master Invoice</DialogTitle>
               <DialogDescription>Review and print the invoice.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end print:hidden mb-4">
               <Button onClick={() => window.print()}><Receipt className="mr-2 h-4 w-4" /> Print Invoice</Button>
            </div>
            
            {/* Printable Invoice Area */}
            <div className="print-area bg-white text-black p-4 sm:p-8 mx-auto w-full max-w-4xl font-sans min-h-screen print:min-h-0">
               {/* Invoice Header */}
               <div className="flex flex-row justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
                 <div className="flex flex-row items-center gap-4">
                    {hospitalSettings.logo ? (
                      <img src={hospitalSettings.logo} alt="Logo" className="max-h-20 w-auto object-contain" />
                    ) : (
                      <div className="h-20 w-20 bg-gray-200 border flex items-center justify-center text-xs font-bold text-gray-500 rounded flex-shrink-0">LOGO</div>
                    )}
                    <div className="text-left">
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{hospitalSettings.name || "MedCore Hospital"}</h2>
                      <p className="text-gray-600 text-sm mt-1">{hospitalSettings.address || "123 Health Ave, Medical District"}</p>
                      <p className="text-gray-600 text-sm">Phone: {hospitalSettings.phone || "+1 234 567 8900"} <br className="sm:hidden" /> Email: {hospitalSettings.email || "contact@medcore.com"}</p>
                    </div>
                 </div>
                 <div className="text-right pl-4">
                    <h1 className="text-2xl sm:text-4xl font-bold tracking-widest text-gray-300 mb-2 uppercase">Invoice</h1>
                    <p className="text-sm font-semibold text-gray-800">Date: {invoiceDate || new Date().toLocaleDateString()}</p>
                    <p className="text-sm text-gray-800">Invoice #: {invoiceId || "INV-PENDING"}</p>
                 </div>
               </div>
               
               {/* Patient Info */}
               <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-8">
                  <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Bill To:</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-gray-600 text-sm">Patient Name</p>
                        <p className="font-semibold text-lg">{patient?.full_name}</p>
                     </div>
                     <div>
                        <p className="text-gray-600 text-sm">Patient ID</p>
                        <p className="font-semibold">{patient?.patient_id}</p>
                     </div>
                     <div>
                        <p className="text-gray-600 text-sm">Phone</p>
                        <p className="font-semibold">{patient?.phone}</p>
                     </div>
                     <div>
                        <p className="text-gray-600 text-sm">Age/Gender</p>
                        <p className="font-semibold">{patient?.age} Yrs / {patient?.gender}</p>
                     </div>
                  </div>
               </div>

               {/* Items Table */}
               <div className="mb-8">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-gray-800 text-white">
                        <th className="py-3 px-4 font-semibold text-sm rounded-tl">#</th>
                        <th className="py-3 px-4 font-semibold text-sm">Test Description</th>
                        <th className="py-3 px-4 font-semibold text-sm">Date</th>
                        <th className="py-3 px-4 font-semibold text-sm text-right rounded-tr">Amount</th>
                     </tr>
                   </thead>
                   <tbody>
                     {dues.filter(d => selectedDues.includes(d.id)).map((d, index) => (
                       <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-600">{index + 1}</td>
                          <td className="py-3 px-4 font-medium text-gray-800">{d.test_name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{d.test_date}</td>
                          <td className="py-3 px-4 text-right font-medium text-gray-800">৳{d.total_price.toFixed(2)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               
               {/* Summary */}
               <div className="flex justify-end pr-4">
                  <div className="w-64 space-y-3">
                     {(() => {
                        const items = dues.filter(d => selectedDues.includes(d.id));
                        const total = items.reduce((a, b) => a + b.total_price, 0);
                        const paid = items.reduce((a, b) => a + (b.paid_amount || 0), 0);
                        const rem = items.reduce((a, b) => a + b.remaining_due, 0);
                        return (
                          <>
                           <div className="flex justify-between items-center text-gray-600">
                             <span>Subtotal</span>
                             <span className="font-medium">${total.toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between items-center text-green-700">
                             <span>Paid Amount</span>
                             <span className="font-medium border-b border-gray-300 pb-1">${paid.toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between items-center text-xl font-bold pt-2 text-gray-900 border-t-2 border-gray-800">
                             <span>Balance Due</span>
                             <span>${rem.toFixed(2)}</span>
                           </div>
                          </>
                        );
                     })()}
                  </div>
               </div>

               {/* Footer */}
               <div className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
                 <p className="font-semibold text-gray-700 mb-1">Thank you for your business.</p>
                 <p>If you have any questions concerning this invoice, contact our billing department.</p>
               </div>
            </div>
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
