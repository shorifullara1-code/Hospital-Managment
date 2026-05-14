"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  date_of_birth: string;
  allergies: string;
  medical_history: string;
  address: string;
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

  const [editOpen, setEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Patient>>({});
  const [editingId, setEditingId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    date_of_birth: "",
    allergies: "",
    medical_history: "",
    address: "",
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

  useEffect(() => {
    fetchPatients();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('patients_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        fetchPatients();
      })
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
      email: formData.email,
      emergency_contact_name: formData.emergency_contact_name,
      emergency_contact_phone: formData.emergency_contact_phone,
      date_of_birth: formData.date_of_birth || null,
      allergies: formData.allergies,
      medical_history: formData.medical_history,
      address: formData.address,
      status: "Active"
    }]);

    if (!error) {
      setIsOpen(false);
      setFormData({ name: "", age: "", gender: "", phone: "", email: "", emergency_contact_name: "", emergency_contact_phone: "", date_of_birth: "", allergies: "", medical_history: "", address: "", blood_group: "O+" });
      fetchPatients();
    } else {
      console.error(error);
      alert("Error registering patient: " + error.message);
    }
    setRegistering(false);
  };

  const handleEditClick = (patient: Patient) => {
    setEditingId(patient.id);
    setEditFormData({
      full_name: patient.full_name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      emergency_contact_name: patient.emergency_contact_name,
      emergency_contact_phone: patient.emergency_contact_phone,
      date_of_birth: patient.date_of_birth,
      allergies: patient.allergies,
      medical_history: patient.medical_history,
      address: patient.address,
      blood_group: patient.blood_group,
      status: patient.status
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSavingEdit(true);

    const { error } = await supabase
      .from("patients")
      .update({
        full_name: editFormData.full_name,
        age: editFormData.age ? parseInt(editFormData.age as any) : null,
        gender: editFormData.gender,
        phone: editFormData.phone,
        email: editFormData.email,
        emergency_contact_name: editFormData.emergency_contact_name,
        emergency_contact_phone: editFormData.emergency_contact_phone,
        date_of_birth: editFormData.date_of_birth || null,
        allergies: editFormData.allergies,
        medical_history: editFormData.medical_history,
        address: editFormData.address,
        blood_group: editFormData.blood_group,
        status: editFormData.status
      })
      .eq("id", editingId);

    if (!error) {
      setEditOpen(false);
      fetchPatients();
    } else {
      console.error(error);
      alert("Error updating patient: " + error.message);
    }
    setSavingEdit(false);
  };

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;
    setDeleting(true);
    
    const { error } = await supabase.from("patients").delete().eq("id", patientToDelete.id);
    
    if (!error) {
      setDeleteOpen(false);
      setPatientToDelete(null);
      fetchPatients();
    } else {
      console.error(error);
      if (error.code === '23503') {
          alert("Cannot delete patient. They have existing records (appointments, prescriptions or lab tests). Please delete those first.");
      } else {
          alert("Error deleting patient: " + error.message);
      }
    }
    setDeleting(false);
  };

  const filteredPatients = patients.filter(patient => 
    patient.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    patient.patient_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {isOpen ? (
        <Card className="max-w-4xl mx-auto w-full">
          <CardHeader>
            <CardTitle>Add New Patient</CardTitle>
            <CardDescription>
              Enter the details of the new patient here. Click save when you&apos;re done.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister}>
              <div className="grid gap-4 py-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} placeholder="30" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })} />
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
                  <div className="grid gap-2">
                     <Label htmlFor="blood_group">Blood Group</Label>
                     <Select value={formData.blood_group} onValueChange={(v) => setFormData({ ...formData, blood_group: v || "O+" })}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="A+">A+</SelectItem>
                         <SelectItem value="A-">A-</SelectItem>
                         <SelectItem value="B+">B+</SelectItem>
                         <SelectItem value="B-">B-</SelectItem>
                         <SelectItem value="O+">O+</SelectItem>
                         <SelectItem value="O-">O-</SelectItem>
                         <SelectItem value="AB+">AB+</SelectItem>
                         <SelectItem value="AB-">AB-</SelectItem>
                       </SelectContent>
                     </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="patient@example.com" />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="123 Main St, City, Country" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                    <Input id="emergency_contact_name" value={formData.emergency_contact_name} onChange={e => setFormData({ ...formData, emergency_contact_name: e.target.value })} placeholder="Jane Doe" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                    <Input id="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={e => setFormData({ ...formData, emergency_contact_phone: e.target.value })} placeholder="+1 (555) 123-4567" />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="allergies">Allergies</Label>
                    <Input id="allergies" value={formData.allergies} onChange={e => setFormData({ ...formData, allergies: e.target.value })} placeholder="Peanuts, Penicillin..." />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="medical_history">Medical History / Notes</Label>
                    <Input id="medical_history" value={formData.medical_history} onChange={e => setFormData({ ...formData, medical_history: e.target.value })} placeholder="Diabetic, Hypertension..." />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4 gap-2 border-t mt-4">
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={registering}>
                  {registering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Patient
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : editOpen ? (
        <Card className="max-w-4xl mx-auto w-full">
          <CardHeader>
            <CardTitle>Edit Patient</CardTitle>
            <CardDescription>
              Update patient information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="edit-name">Full Name *</Label>
                    <Input id="edit-name" required value={editFormData.full_name || ""} onChange={e => setEditFormData({ ...editFormData, full_name: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-age">Age</Label>
                    <Input id="edit-age" type="number" value={editFormData.age || ""} onChange={e => setEditFormData({ ...editFormData, age: parseInt(e.target.value) || undefined })} placeholder="30" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-dob">Date of Birth</Label>
                    <Input id="edit-dob" type="date" value={editFormData.date_of_birth || ""} onChange={e => setEditFormData({ ...editFormData, date_of_birth: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-gender">Gender</Label>
                    <Select value={editFormData.gender || ""} onValueChange={(v) => setEditFormData({ ...editFormData, gender: v || "" })}>
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
                  <div className="grid gap-2">
                    <Label htmlFor="edit-blood-group">Blood Group</Label>
                    <Select value={editFormData.blood_group || ""} onValueChange={(v) => setEditFormData({ ...editFormData, blood_group: v || "" })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-phone">Phone Number</Label>
                    <Input id="edit-phone" value={editFormData.phone || ""} onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input id="edit-email" type="email" value={editFormData.email || ""} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} placeholder="patient@example.com" />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Input id="edit-address" value={editFormData.address || ""} onChange={e => setEditFormData({ ...editFormData, address: e.target.value })} placeholder="123 Main St..." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-emerg-name">Emergency Contact Name</Label>
                    <Input id="edit-emerg-name" value={editFormData.emergency_contact_name || ""} onChange={e => setEditFormData({ ...editFormData, emergency_contact_name: e.target.value })} placeholder="Jane Doe" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-emerg-phone">Emergency Phone</Label>
                    <Input id="edit-emerg-phone" value={editFormData.emergency_contact_phone || ""} onChange={e => setEditFormData({ ...editFormData, emergency_contact_phone: e.target.value })} placeholder="Jane Doe" />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="edit-allergies">Allergies</Label>
                    <Input id="edit-allergies" value={editFormData.allergies || ""} onChange={e => setEditFormData({ ...editFormData, allergies: e.target.value })} placeholder="Peanuts..." />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="edit-history">Medical History</Label>
                    <Input id="edit-history" value={editFormData.medical_history || ""} onChange={e => setEditFormData({ ...editFormData, medical_history: e.target.value })} placeholder="Diabetic..." />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select value={editFormData.status || ""} onValueChange={(v) => setEditFormData({ ...editFormData, status: v || "" })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Deceased">Deceased</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4 gap-2 border-t mt-4">
                <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={savingEdit}>
                  {savingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
              <p className="text-muted-foreground">
                Manage patient records and clinical histories.
              </p>
            </div>
            
            <Button onClick={() => setIsOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add New Patient
            </Button>
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
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(patient)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(patient)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

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
                      <p className="text-xs text-muted-foreground uppercase font-medium">DOB</p>
                      <p className="font-semibold text-sm mt-1">{selectedPatient.date_of_birth ? new Date(selectedPatient.date_of_birth).toLocaleDateString() : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium">Blood Group</p>
                      <p className="font-semibold text-sm mt-1">{selectedPatient.blood_group || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium">Phone</p>
                      <p className="font-semibold text-sm mt-1">{selectedPatient.phone || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                       <p className="text-xs text-muted-foreground uppercase font-medium">Email & Address</p>
                       <p className="font-semibold text-sm mt-1">{selectedPatient.email || '-'} / {selectedPatient.address || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                       <p className="text-xs text-muted-foreground uppercase font-medium">Emergency Contact</p>
                       <p className="font-semibold text-sm mt-1">{selectedPatient.emergency_contact_name || '-'} {selectedPatient.emergency_contact_phone ? `(${selectedPatient.emergency_contact_phone})` : ''}</p>
                    </div>
                    <div className="md:col-span-2">
                       <p className="text-xs text-muted-foreground uppercase font-medium">Allergies</p>
                       <p className="font-semibold text-sm mt-1">{selectedPatient.allergies || 'None recorded'}</p>
                    </div>
                    <div className="md:col-span-2">
                       <p className="text-xs text-muted-foreground uppercase font-medium">Medical History</p>
                       <p className="font-semibold text-sm mt-1">{selectedPatient.medical_history || 'None recorded'}</p>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the patient record
              for <span className="font-semibold text-foreground">{patientToDelete?.full_name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4 gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
