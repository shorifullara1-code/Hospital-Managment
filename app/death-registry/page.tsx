"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, FileText, ScanBarcode, Printer, HeartOff } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function DeathRegistryPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  
  const [causeOfDeath, setCauseOfDeath] = useState("");
  const [dateOfDeath, setDateOfDeath] = useState(new Date().toISOString().slice(0, 10));
  const [timeOfDeath, setTimeOfDeath] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0,5));
  const [attendingDoctor, setAttendingDoctor] = useState("");
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);

  const [certificates, setCertificates] = useState<Record<string, any>>({});
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [viewingCert, setViewingCert] = useState<any>(null);
  const [hospitalSettings, setHospitalSettings] = useState<any>({});

  const fetchData = async () => {
    setLoading(true);
    const [patRes, docRes, certRes] = await Promise.all([
      supabase.from('patients').select('*'),
      supabase.from('doctors').select('*'),
      supabase.from('death_certificates').select('*, doctor:doctors(*)')
    ]);
    
    if (patRes.data) setPatients(patRes.data);
    if (docRes.data) setDoctors(docRes.data);
    
    if (certRes.data) {
      const certsMap: Record<string, any> = {};
      certRes.data.forEach(cert => {
         const date = new Date(cert.date_of_death);
         certsMap[cert.patient_id] = {
           id: cert.certificate_id,
           patientId: cert.patient_id,
           patientName: patRes.data?.find(p => p.id === cert.patient_id)?.full_name,
           patientCode: patRes.data?.find(p => p.id === cert.patient_id)?.patient_id,
           age: patRes.data?.find(p => p.id === cert.patient_id)?.age,
           gender: patRes.data?.find(p => p.id === cert.patient_id)?.gender,
           causeOfDeath: cert.cause_of_death,
           dateOfDeath: date.toISOString().slice(0, 10),
           timeOfDeath: date.toLocaleTimeString('en-US', { hour12: false }).slice(0,5),
           place_of_death: cert.place_of_death,
           attendingDoctor: cert.doctor_id,
           remarks: cert.notes,
           issuedAt: cert.created_at
         };
      });
      setCertificates(certsMap);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const settings = localStorage.getItem('hospital_settings');
    if (settings) {
      setHospitalSettings(JSON.parse(settings));
    }
  }, []);

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const code = detectedCodes[0].rawValue;
      setSearchQuery(code);
      setScannerOpen(false);
      performSearch(code);
    }
  };

  const performSearch = (q: string) => {
    const term = q.toLowerCase().trim();
    if (!term) return;
    const found = patients.find(p => p.patient_id?.toLowerCase().includes(term) || p.full_name?.toLowerCase().includes(term));
    if (found) {
      setSelectedPatient(found);
      const existing = certificates[found.id];
      if (existing) {
        setCauseOfDeath(existing.causeOfDeath);
        setDateOfDeath(existing.dateOfDeath);
        setTimeOfDeath(existing.timeOfDeath);
        setAttendingDoctor(existing.attendingDoctor);
        setRemarks(existing.remarks);
      } else {
        setCauseOfDeath("");
        setDateOfDeath(new Date().toISOString().slice(0, 10));
        setTimeOfDeath(new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0,5));
        setAttendingDoctor("");
        setRemarks("");
      }
    } else {
      setSelectedPatient(null);
      alert("No patient matches this ID or name.");
    }
  };

  const handleMarkDeceased = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setProcessing(true);

    try {
      // Create timestamp string
      const fullDateStr = `${dateOfDeath}T${timeOfDeath}:00`;
      const dateOfDeathObj = new Date(fullDateStr);

      const certId = `DC-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const certEntry = {
         certificate_id: certId,
         patient_id: selectedPatient.id,
         doctor_id: attendingDoctor || null,
         date_of_death: dateOfDeathObj.toISOString(),
         cause_of_death: causeOfDeath,
         place_of_death: hospitalSettings.name || "MedCore Hospital",
         notes: remarks
      };

      // Check if already exist
      if (!certificates[selectedPatient.id]) {
         const { error: certError } = await supabase.from('death_certificates').insert(certEntry);
         if (certError) throw certError;
      } else {
         const { error: certError } = await supabase.from('death_certificates')
             .update(certEntry)
             .eq('patient_id', selectedPatient.id);
         if (certError) throw certError;
      }

      // Update patient status in DB
      const { error } = await supabase.from('patients').update({ status: 'Deceased' }).eq('id', selectedPatient.id);
      
      if (error) throw error;

      // Save certificate details locally for UI update
      const certData = {
        id: certificates[selectedPatient.id]?.id || certId,
        patientId: selectedPatient.id,
        patientName: selectedPatient.full_name,
        patientCode: selectedPatient.patient_id,
        age: selectedPatient.age,
        gender: selectedPatient.gender,
        causeOfDeath,
        dateOfDeath,
        timeOfDeath,
        attendingDoctor,
        remarks,
        issuedAt: new Date().toISOString()
      };

      const newCerts = { ...certificates, [selectedPatient.id]: certData };
      setCertificates(newCerts);

      // Update local state
      setPatients(patients.map(p => p.id === selectedPatient.id ? { ...p, status: 'Deceased' } : p));
      setSelectedPatient({ ...selectedPatient, status: 'Deceased' });
      
      setViewingCert(certData);
      setCertDialogOpen(true);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const deceasedPatients = patients.filter(p => p.status === 'Deceased' || certificates[p.id]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-red-700 flex items-center gap-2">
          <HeartOff className="h-8 w-8" />
          Death Registry
        </h1>
        <p className="text-muted-foreground">
          Register patient mortalities and issue death certificates.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full">
        {/* Search & Registration */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Report Patient Death</CardTitle>
            <CardDescription>Scan ID Card or search by Patient ID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Input 
                placeholder="Enter Patient ID (e.g. PT-1234)..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && performSearch(searchQuery)}
              />
              <Button onClick={() => performSearch(searchQuery)}><Search className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => setScannerOpen(true)}>
                <ScanBarcode className="h-5 w-5" />
              </Button>
            </div>

            {selectedPatient && (
              <div className="border p-4 rounded-md bg-muted/30">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{selectedPatient.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedPatient.patient_id} • {selectedPatient.age} Yrs • {selectedPatient.gender}</p>
                  </div>
                  {selectedPatient.status === 'Deceased' && (
                    <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Deceased
                    </div>
                  )}
                </div>

                <form onSubmit={handleMarkDeceased} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label>Date of Death</Label>
                       <Input type="date" required value={dateOfDeath} onChange={e => setDateOfDeath(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                       <Label>Time of Death</Label>
                       <Input type="time" required value={timeOfDeath} onChange={e => setTimeOfDeath(e.target.value)} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                     <Label>Primary Cause of Death</Label>
                     <Input 
                       placeholder="e.g. Cardiac Arrest, Respiratory Failure" 
                       required 
                       value={causeOfDeath} 
                       onChange={e => setCauseOfDeath(e.target.value)} 
                     />
                  </div>

                  <div className="space-y-2">
                     <Label>Attending Doctor</Label>
                     <Select value={attendingDoctor} onValueChange={(val) => setAttendingDoctor(val || "")} required>
                        <SelectTrigger><SelectValue placeholder="Select Doctor" /></SelectTrigger>
                        <SelectContent>
                          {doctors.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.full_name} ({d.speciality})</SelectItem>
                          ))}
                        </SelectContent>
                     </Select>
                  </div>

                  <div className="space-y-2">
                     <Label>Remarks / Additional Info (Optional)</Label>
                     <Input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any notes..." />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" variant="destructive" className="w-full" disabled={processing}>
                      {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <HeartOff className="h-4 w-4 mr-2" />}
                      {selectedPatient.status === 'Deceased' ? "Update Record" : "Declare Deceased"}
                    </Button>
                    {certificates[selectedPatient.id] && (
                       <Button type="button" variant="outline" className="w-full" onClick={() => {
                          setViewingCert(certificates[selectedPatient.id]);
                          setCertDialogOpen(true);
                       }}>
                         <Printer className="h-4 w-4 mr-2" />
                         View Certificate
                       </Button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        {/* List of Deceased */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Recent Death Registry</CardTitle>
            <CardDescription>Previously issued certificates</CardDescription>
          </CardHeader>
          <CardContent>
             {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /> : (
                <div className="space-y-3">
                  {deceasedPatients.length === 0 ? (
                    <div className="text-sm text-center text-muted-foreground p-8 border rounded-md">No deceased patients registered.</div>
                  ) : (
                    deceasedPatients.slice(0, 10).map((p) => (
                       <div key={p.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/10 hover:bg-muted/30">
                         <div>
                            <p className="font-medium text-sm">{p.full_name}</p>
                            <p className="text-xs text-muted-foreground">{p.patient_id}</p>
                         </div>
                         {certificates[p.id] ? (
                           <Button size="sm" variant="outline" onClick={() => {
                              setViewingCert(certificates[p.id]);
                              setCertDialogOpen(true);
                           }}>
                             <FileText className="h-4 w-4 mr-2" /> Cert
                           </Button>
                         ) : (
                           <Button size="sm" variant="ghost" onClick={() => {
                             setSearchQuery(p.patient_id);
                             performSearch(p.patient_id);
                           }}>
                             Record
                           </Button>
                         )}
                       </div>
                    ))
                  )}
                </div>
             )}
          </CardContent>
        </Card>
      </div>

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
      
      {/* Certificate Printer Dialog */}
      <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
         <DialogContent className="max-w-3xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto print:absolute print:left-0 print:top-0 print:translate-x-0 print:translate-y-0 print:w-full print:h-auto print:max-h-none print:overflow-visible print:p-0 print:m-0 print:border-none print:shadow-none bg-white">
            <DialogHeader className="print:hidden">
               <DialogTitle>Death Certificate</DialogTitle>
               <DialogDescription>Review and print the certificate.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end print:hidden mb-4">
               <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print Certificate</Button>
            </div>
            
            {/* Printable Area */}
            {viewingCert && (
               <div className="print-area bg-white text-black p-8 sm:p-12 mx-auto w-full max-w-3xl border-8 border-double border-gray-800 relative min-h-[29.7cm] print:min-h-0 print:border-4 font-serif">
                 
                 <div className="text-center border-b-2 border-gray-800 pb-8 mb-8 relative z-10">
                    <div className="flex justify-center mb-4">
                        {hospitalSettings.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={hospitalSettings.logo} alt="Logo" className="max-h-24 w-auto object-contain" />
                        ) : (
                          <div className="h-20 w-20 bg-gray-200 border-2 border-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 rounded-full flex-shrink-0">LOGO</div>
                        )}
                    </div>
                    <h1 className="text-4xl font-bold uppercase tracking-widest text-gray-900 mb-2">{hospitalSettings.name || "MedCore Hospital"}</h1>
                    <p className="text-gray-700">{hospitalSettings.address || "123 Health Ave, Medical District"}</p>
                    <p className="text-gray-700">Phone: {hospitalSettings.phone || "+1 234 567 8900"}</p>
                 </div>

                 <div className="text-center mb-10">
                    <h2 className="text-5xl font-extrabold uppercase tracking-tight text-gray-900 border-b-2 border-gray-900 inline-block pb-2">Certificate of Death</h2>
                    <p className="mt-4 text-gray-600">Certificate No: <span className="font-bold text-gray-900">{viewingCert.id}</span></p>
                 </div>

                 <div className="leading-relaxed text-lg mb-12 relative z-10 mx-auto max-w-2xl px-4 text-justify">
                    <p className="mb-6 indent-8">
                       This is to certify that <span className="font-bold text-black border-b border-black inline-block min-w-64 text-center pb-1 px-4">{viewingCert.patientName}</span>, 
                       registered as patient ID <span className="font-bold text-black border-b border-black inline-block min-w-32 text-center pb-1 px-2">{viewingCert.patientCode}</span>, 
                       aged <span className="font-bold text-black border-b border-black inline-block min-w-16 text-center pb-1 px-2">{viewingCert.age || '-'}</span> years, 
                       gender <span className="font-bold text-black border-b border-black inline-block min-w-20 text-center pb-1 px-2">{viewingCert.gender || '-'}</span>, 
                       has sadly passed away.
                    </p>
                    
                    <p className="mb-6 indent-8">
                       The death occurred on the <span className="font-bold text-black border-b border-black inline-block min-w-40 text-center pb-1 px-2">{new Date(viewingCert.dateOfDeath).toLocaleDateString('en-US', { dateStyle: 'long'})}</span> at 
                       time <span className="font-bold text-black border-b border-black inline-block min-w-24 text-center pb-1 px-2">{viewingCert.timeOfDeath}</span>.
                    </p>
                    
                    <p className="mb-6 indent-8">
                       The primary cause of death is recorded as: <br />
                       <span className="font-bold text-black border-b border-black block text-center pb-1 px-2 mt-4 text-xl">{viewingCert.causeOfDeath}</span>
                    </p>
                 </div>

                 <div className="mt-20 pt-8 flex justify-between items-end border-t border-gray-300">
                    <div className="text-left text-sm text-gray-600">
                       <p>Date Issued: {new Date(viewingCert.issuedAt).toLocaleDateString()}</p>
                       <p>Authorized by {hospitalSettings.name || "Administration"}</p>
                    </div>
                    <div className="text-center">
                       <div className="w-64 border-b border-gray-800 mb-2"></div>
                       <p className="font-bold text-gray-800 text-lg">
                         {doctors.find(d => d.id === viewingCert.attendingDoctor)?.full_name || "Doctor in Charge"}
                       </p>
                       <p className="text-sm text-gray-600">Attending Physician Name & Signature</p>
                    </div>
                 </div>

                 {/* Absolute watermark background for printing graphic */}
                 <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
                    <HeartOff className="w-112 h-112 print:block hidden" />
                 </div>
               </div>
            )}
         </DialogContent>
      </Dialog>
    </div>
  );
}
