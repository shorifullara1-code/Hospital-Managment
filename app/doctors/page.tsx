"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Filter, Loader2 } from "lucide-react";
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

type Doctor = {
  id: string;
  doctor_id: string;
  full_name: string;
  speciality: string;
  qualifications: string;
  fee: number;
  status: string;
  total_appointments?: number;
};

export default function DoctorsView() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [search, setSearch] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Doctor>>({});
  const [editingId, setEditingId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    doctor_id: "DR-####",
    name: "",
    speciality: "",
    qualification: "",
    fee: "50",
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, doctor_id: `DR-${Math.floor(1000 + Math.random() * 9000)}` }));
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    const [docsRes, aptsRes] = await Promise.all([
      supabase.from("doctors").select("*").order("created_at", { ascending: false }),
      supabase.from("appointments").select("doctor_id")
    ]);

    if (!docsRes.error && docsRes.data) {
      // Calculate appointments per doctor
      const aptCount: Record<string, number> = {};
      if (aptsRes.data) {
        aptsRes.data.forEach((apt: any) => {
          aptCount[apt.doctor_id] = (aptCount[apt.doctor_id] || 0) + 1;
        });
      }

      const docsWithCounts = docsRes.data.map((doc: any) => ({
        ...doc,
        total_appointments: aptCount[doc.id] || 0
      }));

      setDoctors(docsWithCounts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDoctors();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('doctors_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, () => fetchDoctors())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchDoctors())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleEditClick = (doctor: Doctor) => {
    setEditingId(doctor.id);
    setEditFormData({
      doctor_id: doctor.doctor_id,
      full_name: doctor.full_name,
      speciality: doctor.speciality,
      qualifications: doctor.qualifications,
      fee: doctor.fee,
      status: doctor.status,
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSavingEdit(true);

    const { error } = await supabase
      .from("doctors")
      .update({
        doctor_id: editFormData.doctor_id,
        full_name: editFormData.full_name,
        speciality: editFormData.speciality,
        qualifications: editFormData.qualifications,
        fee: editFormData.fee ? parseFloat(editFormData.fee as any) : 0,
        status: editFormData.status,
      })
      .eq("id", editingId);

    if (!error) {
      setEditOpen(false);
      fetchDoctors();
    } else {
      console.error(error);
      alert("Error updating doctor: " + error.message);
    }
    setSavingEdit(false);
  };

  const handleDeleteClick = (doctor: Doctor) => {
    setDoctorToDelete(doctor);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!doctorToDelete) return;
    setDeleting(true);

    const { error } = await supabase.from("doctors").delete().eq("id", doctorToDelete.id);

    if (!error) {
      setDeleteOpen(false);
      setDoctorToDelete(null);
      fetchDoctors();
    } else {
      console.error(error);
      if (error.code === '23503') {
        alert("Cannot delete doctor. They have existing records (appointments, prescriptions, etc). Please delete those first.");
      } else {
        alert("Error deleting doctor: " + error.message);
      }
    }
    setDeleting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setRegistering(true);

    const { error } = await supabase.from("doctors").insert([{
      doctor_id: formData.doctor_id || `DR-${Math.floor(1000 + Math.random() * 9000)}`,
      full_name: formData.name,
      speciality: formData.speciality,
      qualifications: formData.qualification,
      fee: parseFloat(formData.fee) || 0,
      status: "Active"
    }]);

    if (!error) {
      setIsOpen(false);
      setFormData({ 
         doctor_id: `DR-${Math.floor(1000 + Math.random() * 9000)}`,
         name: "", 
         speciality: "", 
         qualification: "", 
         fee: "50" 
      });
      fetchDoctors();
    } else {
      console.error(error);
      alert("Error registering doctor: " + error.message);
    }
    setRegistering(false);
  };

  const filteredDoctors = doctors.filter(doctor => 
    doctor.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    doctor.speciality?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
          <p className="text-muted-foreground">
            Manage doctors, their specialties, and appointment fees.
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Register Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Register Doctor</DialogTitle>
              <DialogDescription>
                Enter the doctor&apos;s details and set their appointment fee.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRegister}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="doctor_id">Doctor ID</Label>
                  <Input id="doctor_id" required value={formData.doctor_id} onChange={e => setFormData({ ...formData, doctor_id: e.target.value })} placeholder="DR-1234" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Dr. John Doe" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="speciality">Speciality</Label>
                  <Input id="speciality" value={formData.speciality} onChange={e => setFormData({ ...formData, speciality: e.target.value })} placeholder="e.g. Cardiology" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="qualification">Qualifications</Label>
                  <Input id="qualification" value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} placeholder="e.g. MBBS, FACC" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fee">Appointment Fee ($)</Label>
                  <Input id="fee" type="number" required value={formData.fee} onChange={e => setFormData({ ...formData, fee: e.target.value })} placeholder="50" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={registering}>
                  {registering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Register Doctor
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Registered Doctors</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or specialty..."
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
                <TableHead>Doctor ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Speciality</TableHead>
                <TableHead>Qualifications</TableHead>
                <TableHead>Appointments</TableHead>
                <TableHead>Appt. Fee</TableHead>
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
              ) : filteredDoctors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No doctors found. Register one to get started.
                  </TableCell>
                </TableRow>
              ) : filteredDoctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.doctor_id}</TableCell>
                  <TableCell className="font-bold">{doctor.full_name}</TableCell>
                  <TableCell>{doctor.speciality}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{doctor.qualifications}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                      {doctor.total_appointments || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>${doctor.fee}</TableCell>
                  <TableCell>
                    <Badge variant={doctor.status === "Active" ? "default" : "secondary"}>
                      {doctor.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(doctor)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(doctor)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Doctor Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
            <DialogDescription>
              Update doctor information and availability status.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-doctor_id">Doctor ID</Label>
                <Input id="edit-doctor_id" required value={editFormData.doctor_id || ""} onChange={e => setEditFormData({ ...editFormData, doctor_id: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input id="edit-name" required value={editFormData.full_name || ""} onChange={e => setEditFormData({ ...editFormData, full_name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-speciality">Speciality</Label>
                <Input id="edit-speciality" value={editFormData.speciality || ""} onChange={e => setEditFormData({ ...editFormData, speciality: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-qualification">Qualifications</Label>
                <Input id="edit-qualification" value={editFormData.qualifications || ""} onChange={e => setEditFormData({ ...editFormData, qualifications: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-fee">Fee ($)</Label>
                  <Input id="edit-fee" type="number" required value={editFormData.fee || ""} onChange={e => setEditFormData({ ...editFormData, fee: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editFormData.status || ""} onValueChange={(v) => setEditFormData({ ...editFormData, status: v || "" })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={savingEdit}>
                {savingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the doctor record
              for <span className="font-semibold text-foreground">{doctorToDelete?.full_name}</span>.
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
