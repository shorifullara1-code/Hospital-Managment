"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Clock, MoreHorizontal, Plus, Loader2, ScanBarcode } from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Appointment = {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  department: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  patients?: { full_name: string };
  doctors?: { full_name: string, speciality: string };
};

type Doctor = { id: string; doctor_id: string; full_name: string; speciality: string; fee?: number; };
type Patient = { id: string; patient_id: string; full_name: string; age?: number; gender?: string; phone?: string; };

export default function AppointmentsView() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [search, setSearch] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: "",
    doctor_id: "",
    date: "",
    time: "10:00",
    fee_amount: 50,
    discount: 0
  });

  const fetchData = async () => {
    setLoading(true);
    const [aptRes, docsRes, patsRes] = await Promise.all([
      supabase.from("appointments").select("*, patients(full_name), doctors(full_name, speciality)").order("created_at", { ascending: false }),
      supabase.from("doctors").select("id, doctor_id, full_name, speciality, fee"),
      supabase.from("patients").select("id, patient_id, full_name, age, gender, phone")
    ]);

    if (!aptRes.error && aptRes.data) setAppointments(aptRes.data as any);
    if (!docsRes.error && docsRes.data) setDoctors(docsRes.data);
    if (!patsRes.error && patsRes.data) setPatients(patsRes.data);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('appointments_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.doctor_id || !formData.date) return;
    setRegistering(true);

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const appointment_id = `APT-${randomNum}`;

    const doctor = doctors.find(d => d.id === formData.doctor_id);

    const { error } = await supabase.from("appointments").insert([{
      appointment_id,
      patient_id: formData.patient_id,
      doctor_id: formData.doctor_id,
      department: doctor?.speciality || "General",
      appointment_date: formData.date,
      appointment_time: formData.time + ":00",
      status: "Scheduled",
      fee_amount: Math.max(0, formData.fee_amount - formData.discount),
      payment_status: "Paid"
    }]);

    if (!error) {
      setIsOpen(false);
      setFormData({ patient_id: "", doctor_id: "", date: "", time: "10:00", fee_amount: 50, discount: 0 });
      fetchData();
    } else {
      console.error(error);
      alert("Error scheduling appointment: " + error.message);
    }
    setRegistering(false);
  };

  const filteredAppointments = appointments.filter(apt => {
    const term = search.toLowerCase();
    return apt.appointment_id?.toLowerCase().includes(term) ||
           apt.patients?.full_name?.toLowerCase().includes(term) ||
           apt.doctors?.full_name?.toLowerCase().includes(term);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            View and manage patient appointments.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Schedule Appointment</DialogTitle>
              <DialogDescription>
                Select a patient and doctor to schedule a new appointment.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRegister}>
              <div className="grid gap-4 py-4">
                <div className="flex justify-end">
                   <Button type="button" variant="outline" size="sm" onClick={() => setShowScanner(!showScanner)}>
                     <ScanBarcode className="mr-2 h-4 w-4" />
                     {showScanner ? "Close Scanner" : "Scan Patient Barcode"}
                   </Button>
                </div>
                {showScanner && (
                   <div className="w-full flex justify-center border rounded-md overflow-hidden bg-black">
                     <div className="w-[300px] h-[300px] relative">
                       <Scanner
                         onScan={(result) => {
                           if (result && result.length > 0) {
                             const text = result[0].rawValue;
                             const found = patients.find(p => p.patient_id === text);
                             if (found) {
                               setFormData({...formData, patient_id: found.id});
                               setShowScanner(false);
                             } else {
                               alert("Patient not found for barcode: " + text);
                             }
                           }
                         }}
                       />
                     </div>
                   </div>
                )}
                <div className="grid gap-2">
                  <Label>Patient *</Label>
                  <Input 
                    type="search" 
                    placeholder="Search Patient by ID or Name..." 
                    onChange={(e) => {
                      const term = e.target.value.toLowerCase();
                      if (term.length > 0) {
                        const found = patients.find(p => 
                          p.patient_id.toLowerCase().includes(term) || 
                          p.full_name.toLowerCase().includes(term)
                        );
                        if (found) {
                          setFormData({...formData, patient_id: found.id});
                        }
                      }
                    }} 
                  />
                  <Select value={formData.patient_id} onValueChange={v => setFormData({...formData, patient_id: v || ""})}>
                    <SelectTrigger><SelectValue placeholder="Or select from list" /></SelectTrigger>
                    <SelectContent>
                      {patients.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.patient_id && patients.find(p => p.id === formData.patient_id) && (() => {
                    const selectedPatient = patients.find(p => p.id === formData.patient_id);
                    return (
                      <div className="mt-2 text-sm bg-muted p-3 rounded-md space-y-1">
                        <p><strong>Name:</strong> {selectedPatient?.full_name}</p>
                        <p><strong>Patient ID:</strong> {selectedPatient?.patient_id}</p>
                        <p><strong>Phone:</strong> {selectedPatient?.phone || 'N/A'}</p>
                        <p><strong>Age/Gender:</strong> {selectedPatient?.age || '-'} / {selectedPatient?.gender || '-'}</p>
                      </div>
                    );
                  })()}
                </div>
                <div className="grid gap-2">
                  <Label>Doctor *</Label>
                  <Input 
                    type="search" 
                    placeholder="Search Doctor by ID or Name..." 
                    onChange={(e) => {
                      const term = e.target.value.toLowerCase();
                      if (term.length > 0) {
                        const found = doctors.find(d => 
                          d.doctor_id?.toLowerCase().includes(term) || 
                          d.full_name?.toLowerCase().includes(term)
                        );
                        if (found) {
                          setFormData({...formData, doctor_id: found.id, fee_amount: found.fee || 50});
                        }
                      }
                    }} 
                  />
                  <Select value={formData.doctor_id} onValueChange={v => {
                    const found = doctors.find(d => d.id === v);
                    setFormData({...formData, doctor_id: v || "", fee_amount: found?.fee || 50});
                  }}>
                    <SelectTrigger><SelectValue placeholder="Or select from list" /></SelectTrigger>
                    <SelectContent>
                      {doctors.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.full_name} ({d.speciality} - Fee: ${d.fee || 50})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Date *</Label>
                    <Input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Time *</Label>
                    <Input type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Consultation Fee ($)</Label>
                    <Input type="number" required value={formData.fee_amount} onChange={e => setFormData({...formData, fee_amount: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Discount ($)</Label>
                    <Input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="bg-muted p-3 rounded-md flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Net Payable:</span>
                  <span className="text-xl font-bold text-green-700">${Math.max(0, formData.fee_amount - formData.discount)}</span>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={registering}>
                  {registering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Schedule
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-2 overflow-x-auto pb-2">
        <Button variant="default" className="whitespace-nowrap">All Appointments</Button>
        <Button variant="outline" className="whitespace-nowrap">Today</Button>
        <Button variant="outline" className="whitespace-nowrap">Upcoming</Button>
        <Button variant="outline" className="whitespace-nowrap">Past</Button>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-xl">Schedule List</CardTitle>
            <div className="relative w-full sm:w-72">
              <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search appointments..."
                className="pl-8 h-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Appointment ID</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Assigned Doctor</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No appointments found.
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.map((apt: any) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-medium">{apt.appointment_id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{apt.patients?.full_name || 'Unknown Patient'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                        {apt.doctors?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'D'}
                      </div>
                      <span>{apt.doctors?.full_name || 'Unknown Doctor'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{apt.department || apt.doctors?.speciality}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {apt.appointment_date} {apt.appointment_time}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-green-700">${apt.fee_amount || apt.doctors?.fee || 50}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      apt.payment_status === "Paid" ? "secondary" : "outline"
                    } className={apt.payment_status === "Paid" ? "bg-green-100 text-green-700" : "text-amber-600 bg-amber-50"}>
                      {apt.payment_status || "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      apt.status === "Completed" ? "secondary" : 
                      apt.status === "In Progress" ? "default" :
                      apt.status === "Confirmed" ? "outline" : 
                      apt.status === "Scheduled" ? "outline" : 
                      apt.status === "Pending" ? "destructive" : "outline"}>
                      {apt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon" })}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Reschedule</DropdownMenuItem>
                        {apt.payment_status !== "Paid" && (
                           <DropdownMenuItem className="text-green-600 font-medium cursor-pointer" onClick={async () => {
                             const { error } = await supabase.from("appointments").update({ payment_status: "Paid" }).eq("id", apt.id);
                             if (!error) {
                               alert("Payment marked as Paid");
                               fetchData();
                             }
                           }}>
                             Mark as Paid
                           </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/prescription/${apt.id}`)}>
                          Generate Prescription
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
