"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, Search, User, Phone, Calendar, MoreVertical, CreditCard, Loader2, CalendarPlus, IdCard as IdIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Suspense } from "react";

function PatientsContent() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const q = searchParams.get("q");

  useEffect(() => {
    if (q) setSearchQuery(q);
  }, [q]);

  const fetchPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) setPatients(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patient_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery)
    );
  }, [patients, searchQuery]);

  const [isOpen, setIsOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    gender: "Male",
    phone: "",
    address: "",
    blood_group: ""
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name) return;
    setRegistering(true);

    const patient_id = `PT-${Math.floor(10000 + Math.random() * 90000)}`;

    const { error } = await supabase.from("patients").insert([{
      ...formData,
      patient_id,
      age: parseInt(formData.age) || null
    }]);

    if (!error) {
      setIsOpen(false);
      setFormData({ full_name: "", age: "", gender: "Male", phone: "", address: "", blood_group: "" });
      fetchPatients();
    } else {
      console.error(error);
      alert("Error adding patient: " + error.message);
    }
    setRegistering(false);
  };

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients Registry</h1>
          <p className="text-sm text-slate-500">Manage and view all registered patients</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#15807D] hover:bg-[#0E5C59]">
              <Plus className="mr-2 h-4 w-4" /> Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Register New Patient</DialogTitle>
              <DialogDescription>
                Enter patient personal details to create a new registry record.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRegister}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" required value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} placeholder="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} placeholder="25" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1..." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="blood">Blood Group</Label>
                    <Input id="blood" value={formData.blood_group} onChange={e => setFormData({ ...formData, blood_group: e.target.value })} placeholder="O+" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="123 Street..." />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={registering} className="bg-[#15807D] hover:bg-[#0E5C59]">
                  {registering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Register Patient
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          className="pl-10"
          placeholder="Search patients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age/Gender</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">No patients found</TableCell></TableRow>
              ) : filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-mono text-xs">{patient.patient_id || 'N/A'}</TableCell>
                  <TableCell className="font-bold">{patient.full_name}</TableCell>
                  <TableCell>{patient.age || '-'} / {patient.gender || '-'}</TableCell>
                  <TableCell>{patient.phone || '-'}</TableCell>
                  <TableCell>{patient.last_visit || '-'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/id-cards?id=${patient.patient_id}`)}>
                          <IdIcon className="mr-2 h-4 w-4" /> View ID Card
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/appointments?patient=${patient.id}`)}>
                          <CalendarPlus className="mr-2 h-4 w-4" /> Schedule Appt
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => router.push(`/death-registry?id=${patient.patient_id}`)}>
                          <MoreVertical className="mr-2 h-4 w-4" /> Report Death
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

export default function PatientsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading patients page...</div>}>
      <PatientsContent />
    </Suspense>
  );
}
