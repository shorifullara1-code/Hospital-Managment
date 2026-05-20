"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { PlayCircle, Download, FileText, CheckCircle2, Clock, Loader2, Plus, Trash2, ScanBarcode } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DiagnosticsView() {
  const router = useRouter();
  const [labs, setLabs] = useState<any[]>([]);
  const [testCatalog, setTestCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [paidLabs, setPaidLabs] = useState<Record<string, number | boolean>>({});
  const [scannerOpen, setScannerOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState<any>(null);
  const [testResult, setTestResult] = useState("");
  const [savingResult, setSavingResult] = useState(false);

  const isLabsFullyPaid = (lab: any) => {
    const test = testCatalog.find(t => t.name === lab.test_name);
    const price = test ? test.price : 50;
    const paidVal = paidLabs[lab.id];
    if (paidVal === true) return true;
    return (Number(paidVal) || 0) >= price;
  };

  // Catalog Form
  const [catalogForm, setCatalogForm] = useState({ name: "", category: "Hematology", price: "0" });

  const [formData, setFormData] = useState({
    patient_id: "",
    doctor_id: "",
    test_name: "",
    category: "",
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    const [labsRes, ptsRes, docsRes] = await Promise.all([
      supabase.from("diagnostics_labs").select("*, patients(full_name, patient_id), doctors(full_name)").order("created_at", { ascending: false }),
      supabase.from("patients").select("id, full_name, patient_id"),
      supabase.from("doctors").select("id, full_name, speciality")
    ]);
    
    if (!labsRes.error && labsRes.data) setLabs(labsRes.data);
    if (!ptsRes.error && ptsRes.data) setPatients(ptsRes.data);
    if (!docsRes.error && docsRes.data) setDoctors(docsRes.data);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('diagnostics_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'diagnostics_labs' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, () => fetchData())
      .subscribe();

    const stored = localStorage.getItem('hospital_service_catalog');
    if (stored) {
      setTestCatalog(JSON.parse(stored).filter((s: any) => s.category === 'Test' || s.category === 'Imaging'));
    } else {
      const defaultCatalog = [
        { id: "1", name: "Complete Blood Count (CBC)", category: "Test", price: 300 },
        { id: "2", name: "Lipid Panel", category: "Test", price: 450 },
        { id: "3", name: "MRI Scan - Brain", category: "Imaging", price: 5000 }
      ];
      setTestCatalog(defaultCatalog);
      localStorage.setItem("hospital_service_catalog", JSON.stringify(defaultCatalog));
    }
    
    const paidStorage = localStorage.getItem('diag_paid_labs');
    if (paidStorage) {
      setPaidLabs(JSON.parse(paidStorage));
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addLog = (log: any) => {
    const newLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      ...log
    };
    const stored = localStorage.getItem('hospital_activity_logs');
    const logs = stored ? JSON.parse(stored) : [];
    const updated = [newLog, ...logs].slice(0, 500);
    localStorage.setItem('hospital_activity_logs', JSON.stringify(updated));
  };

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const code = detectedCodes[0].rawValue;
      const term = code.toLowerCase();
      const found = patients.find(p => 
        p.patient_id?.toLowerCase().includes(term) || 
        p.full_name?.toLowerCase().includes(term)
      );
      if (found) {
        setFormData(prev => ({...prev, patient_id: found.id}));
      }
      setScannerOpen(false);
    }
  };

  const handlePay = (labId: string) => {
    const newPaid = { ...paidLabs, [labId]: true };
    setPaidLabs(newPaid);
    localStorage.setItem('diag_paid_labs', JSON.stringify(newPaid));
  };

  const handleAddCatalog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogForm.name) return;
    
    // Read current global catalog
    const raw = localStorage.getItem('hospital_service_catalog');
    const fullCatalog = raw ? JSON.parse(raw) : [];

    const newService = {
       id: Math.random().toString(36).substring(7),
       name: catalogForm.name,
       category: catalogForm.category,
       price: parseFloat(catalogForm.price) || 0
    };

    const updatedFull = [...fullCatalog, newService];
    localStorage.setItem("hospital_service_catalog", JSON.stringify(updatedFull));
    
    // Refresh local filtered view
    setTestCatalog(updatedFull.filter((s: any) => s.category === 'Test' || s.category === 'Imaging'));
    setCatalogForm({ name: "", category: "Test", price: "0" });
  };

  const handleRemoveCatalog = (id: string) => {
    const raw = localStorage.getItem('hospital_service_catalog');
    const fullCatalog = raw ? JSON.parse(raw) : [];
    
    const updatedFull = fullCatalog.filter((t: any) => t.id !== id);
    localStorage.setItem("hospital_service_catalog", JSON.stringify(updatedFull));
    
    setTestCatalog(updatedFull.filter((s: any) => s.category === 'Test' || s.category === 'Imaging'));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.doctor_id) {
       alert("Please select a patient and referral doctor.");
       return;
    }
    
    setAdding(true);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    
    const { error } = await supabase.from("diagnostics_labs").insert([{
      test_id: `LAB-${randomNum}`,
      patient_id: formData.patient_id,
      doctor_id: formData.doctor_id,
      test_name: formData.test_name,
      category: formData.category,
      test_date: formData.date,
      status: "Processing"
    }]);

    if (!error) {
      // Log test request
      const patient = patients.find(p => p.id === formData.patient_id);
      addLog({
        patient_id: patient?.patient_id || 'N/A',
        patient_name: patient?.full_name || 'Unknown',
        service_name: `Requested: ${formData.test_name}`,
        amount: 0,
        type: 'Test Request'
      });

      setIsOpen(false);
      setFormData({
        patient_id: "",
        doctor_id: "",
        test_name: "",
        category: "",
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } else {
      alert("Error adding test: " + error.message);
    }
    setAdding(false);
  };

  const handleComplete = async (lab: any) => {
    setSelectedLab(lab);
    setTestResult(lab.test_results || "");
    setResultDialogOpen(true);
  };

  const handleSaveResult = async () => {
    if (!selectedLab) return;
    setSavingResult(true);
    
    const { error } = await supabase
      .from("diagnostics_labs")
      .update({ 
        status: "Completed",
        test_results: testResult,
        completed_at: new Date().toISOString()
      })
      .eq("id", selectedLab.id);

    if (!error) {
      // Log test completion
      addLog({
        patient_id: selectedLab.patients?.patient_id || 'N/A',
        patient_name: selectedLab.patients?.full_name || 'Unknown',
        service_name: `Completed: ${selectedLab.test_name}`,
        amount: 0,
        type: 'Test Result'
      });

      setResultDialogOpen(false);
      setSelectedLab(null);
      setTestResult("");
      fetchData();
    } else {
      alert("Error saving result: " + error.message);
    }
    setSavingResult(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diagnostics & Labs</h1>
          <p className="text-muted-foreground">
            Manage lab requests, imaging, and diagnostic test catalog.
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlayCircle className="mr-2 h-4 w-4" />
              New Test Request
            </Button>
          </DialogTrigger>
          <DialogContent>
             <DialogHeader>
               <DialogTitle>New Diagnostic Test</DialogTitle>
               <DialogDescription>Add a new lab or imaging request.</DialogDescription>
             </DialogHeader>
             <form onSubmit={handleAdd} className="grid gap-4 py-4">
               <div className="grid gap-2">
                 <Label>Patient *</Label>
                 <div className="flex gap-2">
                   <Input 
                     type="search" 
                     className="flex-1"
                     placeholder="Search Patient by ID or Name..." 
                     onChange={(e) => {
                       const term = e.target.value.toLowerCase();
                       if (term.length > 0) {
                         const found = patients.find(p => 
                           p.patient_id?.toLowerCase().includes(term) || 
                           p.full_name?.toLowerCase().includes(term)
                         );
                         if (found) {
                           setFormData({...formData, patient_id: found.id});
                         }
                       }
                     }} 
                   />
                   <Button type="button" variant="outline" size="icon" onClick={() => setScannerOpen(true)}>
                     <ScanBarcode className="h-5 w-5" />
                   </Button>
                 </div>
                 <Select value={formData.patient_id} onValueChange={v => setFormData({...formData, patient_id: v || ""})}>
                    <SelectTrigger><SelectValue placeholder="Or select from list" /></SelectTrigger>
                    <SelectContent>
                      {patients.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
               </div>
               <div className="grid gap-2">
                 <Label>Referred By Doctor *</Label>
                 <Input 
                   type="search" 
                   placeholder="Search Doctor by Name..." 
                   onChange={(e) => {
                     const term = e.target.value.toLowerCase();
                     if (term.length > 0) {
                       const found = doctors.find(d => 
                         d.full_name?.toLowerCase().includes(term)
                       );
                       if (found) {
                         setFormData({...formData, doctor_id: found.id});
                       }
                     }
                   }} 
                 />
                 <Select value={formData.doctor_id} onValueChange={v => setFormData({...formData, doctor_id: v || ""})}>
                    <SelectTrigger><SelectValue placeholder="Or select from list" /></SelectTrigger>
                    <SelectContent>
                      {doctors.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.full_name} ({d.speciality})</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
               </div>
               
               <div className="grid gap-2">
                 <Label>Select Test *</Label>
                 <Select 
                   required
                   value={formData.test_name} 
                   onValueChange={v => {
                     const selectedTest = testCatalog.find(t => t.name === v);
                     if (selectedTest) {
                       setFormData({...formData, test_name: selectedTest.name, category: selectedTest.category});
                     }
                   }}
                 >
                    <SelectTrigger><SelectValue placeholder="Select from catalog..." /></SelectTrigger>
                    <SelectContent>
                      {testCatalog.map(t => (
                        <SelectItem key={t.id} value={t.name}>{t.name} - ৳{t.price}</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
               </div>
               
               <div className="grid gap-2">
                 <Label>Date</Label>
                 <Input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
               </div>
               <div className="flex justify-end pt-4">
                 <Button type="submit" disabled={adding}>
                   {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                   Add Request
                 </Button>
               </div>
             </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList>
          <TabsTrigger value="requests">Test Requests</TabsTrigger>
          <TabsTrigger value="catalog">Tests Catalog</TabsTrigger>
        </TabsList>
        <TabsContent value="requests" className="mt-4">
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Clock className="h-8 w-8 text-amber-500" />
                    <div className="text-3xl font-bold">{labs.filter(l => l.status !== 'Completed').length}</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completed Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                    <div className="text-3xl font-bold">{labs.filter(l => l.status === 'Completed').length}</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-3xl font-bold">{labs.length}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Diagnostic Reports</CardTitle>
                <CardDescription>Track the status of recent lab tests and imaging.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test ID</TableHead>
                      <TableHead>Patient / Doctor</TableHead>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : labs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No records found.
                        </TableCell>
                      </TableRow>
                    ) : labs.map((lab) => (
                      <TableRow key={lab.id}>
                        <TableCell className="font-medium text-primary">{lab.test_id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{lab.patients?.full_name}</div>
                          <div className="text-xs text-muted-foreground">By {lab.doctors?.full_name}</div>
                        </TableCell>
                        <TableCell>{lab.test_name}</TableCell>
                        <TableCell>{lab.category}</TableCell>
                        <TableCell>{lab.test_date}</TableCell>
                        <TableCell>
                          <Badge variant={
                            lab.status === "Completed" ? "default" :
                            lab.status === "Processing" ? "secondary" : "outline"
                          }>
                            {lab.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {isLabsFullyPaid(lab) ? (
                            <Button variant="ghost" size="sm" className="mr-2 text-green-600" onClick={() => window.open(`/diagnostics/receipt/${lab.id}`, '_blank')}>
                              <FileText className="h-4 w-4 mr-2" />
                              Receipt
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mr-2 border-green-600 text-green-600 hover:bg-green-50" 
                              onClick={() => {
                                 // Redirect to billing page for partial or full payments
                                 router.push('/billing');
                              }}
                            >
                              Collect Dues
                            </Button>
                          )}
                          {lab.status === "Processing" && (
                            <Button variant="outline" size="sm" onClick={() => handleComplete(lab)}>
                              Input Result
                            </Button>
                          )}
                          {lab.status === "Completed" && (
                             <div className="flex gap-2 justify-end">
                               <Button variant="ghost" size="sm" onClick={() => {
                                 setSelectedLab(lab);
                                 setTestResult(lab.test_results || "");
                                 setResultDialogOpen(true);
                               }}>
                                 <FileText className="h-4 w-4 mr-2" />
                                 View Result
                               </Button>
                               <Button variant="ghost" size="sm" onClick={() => alert("Simulating PDF download for: " + lab.test_name)}>
                                 <Download className="h-4 w-4 mr-2" />
                                 Report
                               </Button>
                             </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="catalog" className="mt-4">
          <Card>
             <CardHeader>
                <CardTitle>Catalog of Tests</CardTitle>
                <CardDescription>Manage your available tests, categorizations, and prices.</CardDescription>
             </CardHeader>
             <CardContent>
                <form onSubmit={handleAddCatalog} className="flex flex-wrap lg:flex-nowrap gap-4 mb-6 items-end border p-4 rounded-md bg-muted/30">
                   <div className="grid gap-2 flex-1 w-full min-w-[200px]">
                      <Label>Test Name</Label>
                      <Input required placeholder="MRI - Left Knee" value={catalogForm.name} onChange={e => setCatalogForm({...catalogForm, name: e.target.value})} />
                   </div>
                   <div className="grid gap-2">
                      <Label>Category</Label>
                      <Select value={catalogForm.category} onValueChange={v => setCatalogForm({...catalogForm, category: v || "Test"})}>
                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Test">Lab Test</SelectItem>
                          <SelectItem value="Imaging">Imaging</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="grid gap-2 w-[120px]">
                      <Label>Price (৳)</Label>
                      <Input required type="number" min="0" value={catalogForm.price} onChange={e => setCatalogForm({...catalogForm, price: e.target.value})} />
                   </div>
                   <Button type="submit" className="shrink-0"><Plus className="h-4 w-4 mr-2" />Add Test</Button>
                </form>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testCatalog.length === 0 ? (
                      <TableRow>
                         <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No tests in catalog yet.</TableCell>
                      </TableRow>
                    ) : testCatalog.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">{test.name}</TableCell>
                        <TableCell>{test.category}</TableCell>
                        <TableCell className="font-medium text-green-600">৳{test.price}</TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="icon" onClick={() => handleRemoveCatalog(test.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Result Entry Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Test Results - {selectedLab?.test_id}</DialogTitle>
            <DialogDescription>
              Enter the diagnostic findings for {selectedLab?.test_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="bg-slate-50 p-4 rounded-lg border text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-500 text-xs">Patient</p>
                  <p className="font-semibold">{selectedLab?.patients?.full_name}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Test Date</p>
                  <p className="font-semibold">{selectedLab?.test_date}</p>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="results">Clinical Findings & Results</Label>
              <textarea
                id="results"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Type the laboratory findings here..."
                value={testResult}
                onChange={(e) => setTestResult(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setResultDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveResult} disabled={savingResult} className="bg-[#15807D] hover:bg-[#0E5C59]">
              {savingResult ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Save & Complete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scanner Dialog */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Scan Patient Barcode</DialogTitle>
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

