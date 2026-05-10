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

type Doctor = {
  id: string;
  doctor_id: string;
  full_name: string;
  speciality: string;
  qualifications: string;
  fee: number;
  status: string;
};

export default function DoctorsView() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    speciality: "",
    qualification: "",
    fee: "50",
  });

  const fetchDoctors = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("doctors").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      setDoctors(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setRegistering(true);

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const doctor_id = `DR-${randomNum}`;

    const { error } = await supabase.from("doctors").insert([{
      doctor_id,
      full_name: formData.name,
      speciality: formData.speciality,
      qualifications: formData.qualification,
      fee: parseFloat(formData.fee) || 0,
      status: "Active"
    }]);

    if (!error) {
      setIsOpen(false);
      setFormData({ name: "", speciality: "", qualification: "", fee: "50" });
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
          <DialogTrigger className={buttonVariants()}>
            <UserPlus className="mr-2 h-4 w-4" />
            Register Doctor
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Register Doctor</DialogTitle>
              <DialogDescription>
                Enter the doctor's details and set their appointment fee.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRegister}>
              <div className="grid gap-4 py-4">
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
                <TableHead>Appt. Fee</TableHead>
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
              ) : filteredDoctors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No doctors found. Register one to get started.
                  </TableCell>
                </TableRow>
              ) : filteredDoctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.doctor_id}</TableCell>
                  <TableCell className="font-bold">{doctor.full_name}</TableCell>
                  <TableCell>{doctor.speciality}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{doctor.qualifications}</TableCell>
                  <TableCell>${doctor.fee}</TableCell>
                  <TableCell>
                    <Badge variant={doctor.status === "Active" ? "default" : "secondary"}>
                      {doctor.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
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
