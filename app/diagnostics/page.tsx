"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { PlayCircle, Download, FileText, CheckCircle2, Clock, Loader2 } from "lucide-react";
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

export default function DiagnosticsView() {
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

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
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleComplete = async (id: string) => {
    await supabase.from("diagnostics_labs").update({ status: "Completed" }).eq("id", id);
    fetchData();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diagnostics & Labs</h1>
          <p className="text-muted-foreground">
            Manage lab requests, imaging, and diagnostic reports.
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className={buttonVariants()}>
            <PlayCircle className="mr-2 h-4 w-4" />
            New Test Request
          </DialogTrigger>
          <DialogContent>
             <DialogHeader>
               <DialogTitle>New Diagnostic Test</DialogTitle>
               <DialogDescription>Add a new lab or imaging request.</DialogDescription>
             </DialogHeader>
             <form onSubmit={handleAdd} className="grid gap-4 py-4">
               <div className="grid gap-2">
                 <Label>Patient *</Label>
                 <Select value={formData.patient_id} onValueChange={v => setFormData({...formData, patient_id: v || ""})}>
                    <SelectTrigger><SelectValue placeholder="Select Patient" /></SelectTrigger>
                    <SelectContent>
                      {patients.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
               </div>
               <div className="grid gap-2">
                 <Label>Referred By Doctor *</Label>
                 <Select value={formData.doctor_id} onValueChange={v => setFormData({...formData, doctor_id: v || ""})}>
                    <SelectTrigger><SelectValue placeholder="Select Doctor" /></SelectTrigger>
                    <SelectContent>
                      {doctors.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.full_name} ({d.speciality})</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                   <Label>Test Name *</Label>
                   <Input required placeholder="e.g. CBC, MRI" value={formData.test_name} onChange={e => setFormData({...formData, test_name: e.target.value})} />
                 </div>
                 <div className="grid gap-2">
                   <Label>Category *</Label>
                   <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v || ""})}>
                      <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hematology">Hematology</SelectItem>
                        <SelectItem value="Biochemistry">Biochemistry</SelectItem>
                        <SelectItem value="Radiology">Radiology</SelectItem>
                        <SelectItem value="Pathology">Pathology</SelectItem>
                        <SelectItem value="Microbiology">Microbiology</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-amber-500" />
              <div className="text-3xl font-bold">24</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div className="text-3xl font-bold">142</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ready for Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <FileText className="h-8 w-8 text-primary" />
              <div className="text-3xl font-bold">18</div>
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
                <TableHead className="text-right">Report</TableHead>
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
                  <TableCell className="text-right">
                    {lab.status === "Completed" ? (
                      <Button variant="ghost" size="sm" onClick={() => alert("Simulating PDF download for: " + lab.test_name)}>
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleComplete(lab.id)}>
                        Mark Completed
                      </Button>
                    )}
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
