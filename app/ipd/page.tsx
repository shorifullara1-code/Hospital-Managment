"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Plus,
  Bed as BedIcon,
  UserPlus,
  ClipboardList,
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  LayoutGrid,
  List
} from "lucide-react";
import { format } from "date-fns";

type Bed = {
  id: string;
  name: string;
  type: 'General' | 'ICU' | 'Private' | 'Semi-Private';
  floor: string;
  status: 'Available' | 'Occupied' | 'Maintenance';
  price_per_day: number;
};

type Admission = {
  id: string;
  admission_id: string;
  patient_id: string;
  bed_id: string;
  doctor_id: string;
  status: 'Admitted' | 'Discharged';
  admission_date: string;
  actual_discharge_date?: string;
  diagnosis: string;
  notes: string;
  patient?: { full_name: string };
  doctor?: { full_name: string };
  bed?: { name: string };
};

type NursingChart = {
  id: string;
  admission_id: string;
  type: 'Vitals' | 'Medication' | 'Observation';
  recorded_by: string;
  vital_type?: string;
  vital_value?: string;
  medication_name?: string;
  dosage?: string;
  notes?: string;
  recorded_at: string;
  staff?: { full_name: string };
};

export default function IPDPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [patients, setPatients] = useState<{ id: string, full_name: string }[]>([]);
  const [doctors, setDoctors] = useState<{ id: string, full_name: string }[]>([]);
  const [staff, setStaff] = useState<{ id: string, full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("beds");

  // Selection states for dialogs
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [nursingCharts, setNursingCharts] = useState<NursingChart[]>([]);
  const [isChartOpen, setIsChartOpen] = useState(false);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchBeds(),
      fetchAdmissions(),
      fetchDropdownData()
    ]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  async function fetchBeds() {
    const { data } = await supabase.from("beds").select("*").order("name");
    if (data) setBeds(data);
  }

  async function fetchAdmissions() {
    const { data } = await supabase
      .from("ipd_admissions")
      .select(`
        *,
        patient:patients(full_name),
        doctor:doctors(full_name),
        bed:beds(name)
      `)
      .order("created_at", { ascending: false });
    if (data) setAdmissions(data as Admission[]);
  }

  async function fetchDropdownData() {
    const [p, d, s] = await Promise.all([
      supabase.from("patients").select("id, full_name").eq("status", "Active"),
      supabase.from("doctors").select("id, full_name").eq("status", "Active"),
      supabase.from("staff").select("id, full_name").eq("status", "Active")
    ]);
    if (p.data) setPatients(p.data);
    if (d.data) setDoctors(d.data);
    if (s.data) setStaff(s.data);
  }

  async function fetchNursingCharts(admissionId: string) {
    const { data } = await supabase
      .from("nursing_charts")
      .select(`
        *,
        staff:staff(full_name)
      `)
      .eq("admission_id", admissionId)
      .order("recorded_at", { ascending: false });
    if (data) setNursingCharts(data as NursingChart[]);
  }

  const [admissionForm, setAdmissionForm] = useState({
    patient_id: "",
    bed_id: "",
    doctor_id: "",
    diagnosis: "",
    notes: ""
  });

  async function handleAdmission(e: React.FormEvent) {
    e.preventDefault();
    const admissionId = `IPD-${Math.floor(10000 + Math.random() * 90000)}`;
    
    // 1. Create admission
    const { data: admission, error: admissionError } = await supabase
      .from("ipd_admissions")
      .insert([{
        ...admissionForm,
        admission_id: admissionId,
        status: "Admitted"
      }])
      .select();

    if (admissionError) {
      console.error(admissionError);
      return;
    }

    // 2. Update bed status
    await supabase
      .from("beds")
      .update({ status: "Occupied" })
      .eq("id", admissionForm.bed_id);

    setAdmissionForm({ patient_id: "", bed_id: "", doctor_id: "", diagnosis: "", notes: "" });
    fetchInitialData();
  }

  const [chartForm, setChartForm] = useState({
    type: "Vitals" as NursingChart['type'],
    vital_type: "BP",
    vital_value: "",
    medication_name: "",
    dosage: "",
    notes: "",
    recorded_by: ""
  });

  async function handleAddNursingEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAdmission) return;

    const { error } = await supabase
      .from("nursing_charts")
      .insert([{
        ...chartForm,
        admission_id: selectedAdmission.id
      }]);

    if (!error) {
      fetchNursingCharts(selectedAdmission.id);
      setChartForm({
        type: "Vitals",
        vital_type: "BP",
        vital_value: "",
        medication_name: "",
        dosage: "",
        notes: "",
        recorded_by: ""
      });
    }
  }

  async function handleDischarge(admission: Admission) {
    if (!confirm("Are you sure you want to discharge this patient?")) return;

    await supabase
      .from("ipd_admissions")
      .update({ 
        status: "Discharged",
        actual_discharge_date: new Date().toISOString()
      })
      .eq("id", admission.id);

    if (admission.bed_id) {
      await supabase
        .from("beds")
        .update({ status: "Available" })
        .eq("id", admission.bed_id);
    }

    fetchInitialData();
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-sans">IPD Management</h1>
          <p className="text-muted-foreground font-medium">Inpatient admissions, bed tracking, and nursing charts.</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger render={<Button className="bg-slate-900 border-none" />}>
              <BedIcon className="mr-2 h-4 w-4" />
              Add Bed
            </DialogTrigger>
            <DialogContent>
               <DialogHeader>
                <DialogTitle>Add New Bed/Cabin</DialogTitle>
                <DialogDescription>Add a new bed to the hospital ward.</DialogDescription>
              </DialogHeader>
              <AddBedForm onSuccess={fetchBeds} />
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger render={<Button variant="default" className="bg-blue-600 hover:bg-blue-700" />}>
              <UserPlus className="mr-2 h-4 w-4" />
              New Admission
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Patient Admission</DialogTitle>
                <DialogDescription>Assign a patient to an available bed.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdmission} className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select required onValueChange={(v) => setAdmissionForm({...admissionForm, patient_id: v as string})}>
                    <SelectTrigger><SelectValue placeholder="Select Patient" /></SelectTrigger>
                    <SelectContent>
                      {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bed</Label>
                  <Select required onValueChange={(v) => setAdmissionForm({...admissionForm, bed_id: v as string})}>
                    <SelectTrigger><SelectValue placeholder="Select Bed" /></SelectTrigger>
                    <SelectContent>
                      {beds.filter(b => b.status === 'Available').map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name} ({b.type} - {b.floor})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>In-charge Doctor</Label>
                  <Select required onValueChange={(v) => setAdmissionForm({...admissionForm, doctor_id: v as string})}>
                    <SelectTrigger><SelectValue placeholder="Select Doctor" /></SelectTrigger>
                    <SelectContent>
                      {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Diagnosis</Label>
                  <Input required placeholder="Initial Diagnosis" value={admissionForm.diagnosis} onChange={e => setAdmissionForm({...admissionForm, diagnosis: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Admission Notes</Label>
                  <Input placeholder="Additional notes..." value={admissionForm.notes} onChange={e => setAdmissionForm({...admissionForm, notes: e.target.value})} />
                </div>
                <Button type="submit" className="col-span-2 bg-blue-600 hover:bg-blue-700">Confirm Admission</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="beds" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 mb-4 p-1">
          <TabsTrigger value="beds">Beds & Occupancy</TabsTrigger>
          <TabsTrigger value="admissions">Current Admissions</TabsTrigger>
          <TabsTrigger value="history">Admission History</TabsTrigger>
        </TabsList>

        <TabsContent value="beds">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {beds.map(bed => (
              <Card key={bed.id} className={cn(
                "border-l-4",
                bed.status === 'Available' ? "border-l-green-500" : 
                bed.status === 'Occupied' ? "border-l-blue-500" : "border-l-amber-500"
              )}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold">{bed.name}</CardTitle>
                    <Badge variant={bed.status === 'Available' ? 'default' : bed.status === 'Occupied' ? 'secondary' : 'destructive'}>
                      {bed.status}
                    </Badge>
                  </div>
                  <CardDescription>{bed.type} • Floor {bed.floor}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm font-semibold text-slate-600 mb-4">${bed.price_per_day} / day</p>
                  {bed.status === 'Occupied' && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      <Clock className="w-3 h-3" />
                      Patient Admitted
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="admissions">
          <Card>
             <CardHeader className="py-4">
              <CardTitle className="text-lg">Currently Admitted Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-bold">ID</TableHead>
                    <TableHead className="font-bold">Patient</TableHead>
                    <TableHead className="font-bold">Bed</TableHead>
                    <TableHead className="font-bold">Doctor</TableHead>
                    <TableHead className="font-bold">Admitted On</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admissions.filter(a => a.status === 'Admitted').map(adm => (
                    <TableRow key={adm.id} className="hover:bg-slate-50">
                      <TableCell className="font-mono text-xs">{adm.admission_id}</TableCell>
                      <TableCell className="font-bold">{adm.patient?.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {adm.bed?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>{adm.doctor?.full_name}</TableCell>
                      <TableCell>{format(new Date(adm.admission_date), "MMM d, yyyy HH:mm")}</TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setSelectedAdmission(adm);
                            fetchNursingCharts(adm.id);
                            setIsChartOpen(true);
                          }}
                        >
                          <ClipboardList className="w-4 h-4 mr-1" />
                          Nursing Chart
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDischarge(adm)}
                        >
                          Discharge
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {admissions.filter(a => a.status === 'Admitted').length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8">No patients currently admitted.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
           <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-lg">Discharge History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-bold">Admission ID</TableHead>
                    <TableHead className="font-bold">Patient</TableHead>
                    <TableHead className="font-bold">Stay Duration</TableHead>
                    <TableHead className="font-bold">Admission Date</TableHead>
                    <TableHead className="font-bold">Discharge Date</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admissions.filter(a => a.status === 'Discharged').map(adm => (
                    <TableRow key={adm.id}>
                      <TableCell className="font-mono text-xs">{adm.admission_id}</TableCell>
                      <TableCell className="font-bold">{adm.patient?.full_name}</TableCell>
                      <TableCell>
                        {adm.admission_date && adm.actual_discharge_date ? 
                          Math.ceil((new Date(adm.actual_discharge_date).getTime() - new Date(adm.admission_date).getTime()) / (1000 * 3600 * 24)) + " Days" : "-"
                        }
                      </TableCell>
                      <TableCell>{format(new Date(adm.admission_date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-slate-500">
                        {adm.actual_discharge_date ? format(new Date(adm.actual_discharge_date), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell><Badge variant="outline">Discharged</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Nursing Chart Dialog */}
      <Dialog open={isChartOpen} onOpenChange={setIsChartOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Nursing Chart: {selectedAdmission?.patient?.full_name}</DialogTitle>
            <DialogDescription>
              Review vitals, medication, and clinical observations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="md:col-span-1 space-y-4">
              <form onSubmit={handleAddNursingEntry} className="space-y-4 border p-4 rounded-lg bg-slate-50">
                <h3 className="font-semibold text-sm">Add New Entry</h3>
                <div className="space-y-2">
                  <Label>Entry Type</Label>
                  <Select value={chartForm.type} onValueChange={(v: any) => setChartForm({...chartForm, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vitals">Vitals</SelectItem>
                      <SelectItem value="Medication">Medication</SelectItem>
                      <SelectItem value="Observation">Observation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {chartForm.type === 'Vitals' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Vital Type</Label>
                      <Select value={chartForm.vital_type} onValueChange={(v: any) => setChartForm({...chartForm, vital_type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BP">BP (mmHg)</SelectItem>
                          <SelectItem value="Temp">Temp (°F)</SelectItem>
                          <SelectItem value="Pulse">Pulse (bpm)</SelectItem>
                          <SelectItem value="SpO2">SpO2 (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Value</Label>
                      <Input required value={chartForm.vital_value} onChange={e => setChartForm({...chartForm, vital_value: e.target.value})} placeholder="e.g. 120/80" />
                    </div>
                  </div>
                )}

                {chartForm.type === 'Medication' && (
                   <div className="space-y-2">
                    <Label>Medication & Dosage</Label>
                    <Input required placeholder="Name" value={chartForm.medication_name} onChange={e => setChartForm({...chartForm, medication_name: e.target.value})} />
                    <Input required placeholder="Dosage (e.g. 500mg)" value={chartForm.dosage} onChange={e => setChartForm({...chartForm, dosage: e.target.value})} />
                  </div>
                )}

                {chartForm.type === 'Observation' && (
                   <div className="space-y-2">
                    <Label>Observation Notes</Label>
                    <Input required placeholder="Clinical observations..." value={chartForm.notes} onChange={e => setChartForm({...chartForm, notes: e.target.value})} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Recorded By</Label>
                  <Select required onValueChange={(v) => setChartForm({...chartForm, recorded_by: v as string})}>
                    <SelectTrigger><SelectValue placeholder="Select Staff" /></SelectTrigger>
                    <SelectContent>
                      {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full">Save Entry</Button>
              </form>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Patient Info</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Admission ID:</strong> {selectedAdmission?.admission_id}</p>
                  <p><strong>Doctor:</strong> {selectedAdmission?.doctor?.full_name}</p>
                  <p><strong>Diagnosis:</strong> {selectedAdmission?.diagnosis}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <ScrollArea className="h-[500px] border rounded-lg">
                <div className="p-4 space-y-4">
                  {nursingCharts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No records found for this admission.</div>
                  ) : nursingCharts.map(entry => (
                    <div key={entry.id} className="relative pl-6 border-l-2 border-slate-200 pb-4 last:pb-0">
                      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-slate-100 border-2 border-slate-300" />
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant={entry.type === 'Vitals' ? 'default' : entry.type === 'Medication' ? 'secondary' : 'outline'}>
                          {entry.type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {format(new Date(entry.recorded_at), "MMM d, HH:mm")}
                        </span>
                      </div>
                      <div className="text-sm">
                        {entry.type === 'Vitals' && (
                          <p><span className="font-semibold">{entry.vital_type}:</span> {entry.vital_value}</p>
                        )}
                        {entry.type === 'Medication' && (
                          <p><span className="font-semibold">{entry.medication_name}:</span> {entry.dosage}</p>
                        )}
                        {entry.type === 'Observation' && (
                          <p>{entry.notes}</p>
                        )}
                        <p className="text-[10px] mt-2 text-slate-500 italic">Recorded by: {entry.staff?.full_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddBedForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "General",
    floor: "1",
    price_per_day: "500"
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("beds").insert([form]);
    if (!error) {
      onSuccess();
      setForm({ name: "", type: "General", floor: "1", price_per_day: "500" });
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Bed Name/Number</Label>
        <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Bed 101" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm({...form, type: v as any})}>
             <SelectTrigger><SelectValue /></SelectTrigger>
             <SelectContent>
               <SelectItem value="General">General</SelectItem>
               <SelectItem value="Semi-Private">Semi-Private</SelectItem>
               <SelectItem value="Private">Private</SelectItem>
               <SelectItem value="ICU">ICU</SelectItem>
             </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Floor</Label>
          <Input required value={form.floor} onChange={e => setForm({...form, floor: e.target.value})} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Price per Day (BDT)</Label>
        <Input type="number" required value={form.price_per_day} onChange={e => setForm({...form, price_per_day: e.target.value})} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Bed"}
      </Button>
    </form>
  );
}
