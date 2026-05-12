"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, UserPlus, Filter, Loader2, Calendar as CalendarIcon, History } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Patient = {
  id: string;
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  blood_group: string;
  phone: string;
  last_visit: string;
  status: string;
};

export default function PatientsView() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [search, setSearch] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [patientLabs, setPatientLabs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    blood_group: "O+",
  });

  const fetchPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      setPatients(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('patients_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => fetchPatients())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        if (selectedPatient && historyOpen) handleViewHistory(selectedPatient);
        fetchPatients();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'diagnostics_labs' }, () => {
        if (selectedPatient && historyOpen) handleViewHistory(selectedPatient);
        fetchPatients();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPatient, historyOpen]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setRegistering(true);

    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const patient_id = `PT-${randomNum}`;

    const { error } = await supabase.from("patients").insert([{
      patient_id,
      full_name: formData.name,
      age: parseInt(formData.age) || null,
      gender: formData.gender,
      blood_group: formData.blood_group,
      phone: formData.phone,
      status: "Active"
    }]);

    if (!error) {
      setIsOpen(false);
      setFormData({ name: "", age: "", gender: "", phone: "", blood_group: "O+" });
      fetchPatients();
    } else {
      console.error(error);
      alert("Error registering patient: " + error.message);
    }
    setRegistering(false);
  };

  const handleViewHistory = async (patient: Patient) => {
    setSelectedPatient(patient);
    setHistoryOpen(true);
    setLoadingHistory(true);
    
    // Fetch user's appointment history
    const [aptResponse, labResponse] = await Promise.all([
      supabase
        .from('appointments')
        .select('*, doctors(full_name, speciality)')
        .eq('patient_id', patient.id)
        .order('appointment_date', { ascending: false }),
      supabase
        .from("diagnostics_labs")
        .select("*, doctors(full_name)")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
    ]);
      
    if (!aptResponse.error && aptResponse.data) {
      setPatientHistory(aptResponse.data);
    }
    if (!labResponse.error && labResponse.data) {
       setPatientLabs(labResponse.data);
    }
    setLoadingHistory(false);
  };

  const filteredPatients = patients.filter(patient => 
    patient.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    patient.patient_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">
            Manage patient records and clinical histories.
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className={buttonVariants()}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add New Patient
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Patient</DialogTitle>
              <DialogDescription>
                Enter the details of the new patient here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRegister}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} placeholder="30" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v || "" })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={registering}>
                  {registering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Patient
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Patient History Dialog */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Patient History</DialogTitle>
              <DialogDescription>
                Overview of clinical history for {selectedPatient?.full_name} ({selectedPatient?.patient_id}).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 flex-1 overflow-y-auto pr-2 pb-4">
               {selectedPatient && (
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md bg-muted/30">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium">Age / Gender</p>
                      <p className="font-semibold text-sm mt-1">{selectedPatient.age || '-'} Y / {selectedPatient.gender || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium">Blood Group</p>
                      <p className="font-semibold text-sm mt-1">{selectedPatient.blood_group || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium">Phone</p>
                      <p className="font-semibold text-sm mt-1">{selectedPatient.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium">Joined On</p>
                      <p className="font-semibold text-sm mt-1">{new Date(selectedPatient?.last_visit ? selectedPatient.last_visit : Date.now()).toLocaleDateString()}</p>
                    </div>
                 </div>
               )}

               <h3 className="font-semibold mt-4 text-base flex items-center">
                 <History className="h-4 w-4 mr-2" />
                 Appointment History
               </h3>
               {loadingHistory ? (
                  <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
               ) : patientHistory.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground border rounded-md">No past appointments found.</div>
               ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patientHistory.map((apt) => (
                          <TableRow key={apt.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                              <div className="flex items-center">
                                <CalendarIcon className="h-3 w-3 mr-2 text-muted-foreground" />
                                {apt.appointment_date} <span className="text-xs rounded-sm bg-muted px-1.5 py-0.5 ml-2 text-muted-foreground">{apt.appointment_time?.slice(0, 5)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{apt.doctors?.full_name}</TableCell>
                            <TableCell>{apt.department || apt.doctors?.speciality}</TableCell>
                            <TableCell>
                              <Badge variant={apt.status === "Scheduled" ? "default" : apt.status === "Completed" ? "secondary" : "outline"}>
                                {apt.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
               )}

               <h3 className="font-semibold mt-4 text-base flex items-center">
                 <History className="h-4 w-4 mr-2" />
                 Diagnostic Tests
               </h3>
               {loadingHistory ? (
                  <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
               ) : patientLabs.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground border rounded-md">No diagnostic tests found.</div>
               ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Test Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Ref Doctor</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patientLabs.map((lab) => (
                          <TableRow key={lab.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                              <div className="flex items-center">
                                <CalendarIcon className="h-3 w-3 mr-2 text-muted-foreground" />
                                {lab.test_date}
                              </div>
                            </TableCell>
                            <TableCell>{lab.test_name}</TableCell>
                            <TableCell>{lab.category}</TableCell>
                            <TableCell>{lab.doctors?.full_name}</TableCell>
                            <TableCell>
                              <Badge variant={lab.status === "Processing" ? "secondary" : lab.status === "Completed" ? "default" : "outline"}>
                                {lab.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
               )}
            </div>
            <div className="flex justify-end pt-4 border-t mt-auto shrink-0">
              <Button variant="outline" onClick={() => setHistoryOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Patients</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or ID..."
                  className="pl-8 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age / Gender</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No patients found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.patient_id}</TableCell>
                  <TableCell>{patient.full_name}</TableCell>
                  <TableCell>{patient.age || '-'} / {patient.gender || '-'}</TableCell>
                  <TableCell>{patient.blood_group || '-'}</TableCell>
                  <TableCell>{patient.phone || '-'}</TableCell>
                  <TableCell>{patient.last_visit || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={patient.status === "Active" ? "default" : "secondary"}>
                      {patient.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => handleViewHistory(patient)}>History</Button>
                    <Link href={`/id-cards?query=${patient.patient_id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      ID Card
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
