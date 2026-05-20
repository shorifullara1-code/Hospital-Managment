"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, UserPlus, BedIcon, Activity, Scan, Calendar } from "lucide-react";
import { BarcodeScanner } from "@/components/ipd/barcode-scanner";

export default function IPDPage() {
  const [beds, setBeds] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBedDialogOpen, setIsBedDialogOpen] = useState(false);
  const [isAdmissionDialogOpen, setIsAdmissionDialogOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Form states
  const [newBed, setNewBed] = useState({ name: "", type: "General" });
  const [newAdmission, setNewAdmission] = useState({ patient_id: "", bed_id: "", admission_date: new Date().toISOString().split('T')[0] });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: bedData } = await supabase.from("beds").select("*").order("name");
    const { data: admData } = await supabase.from("admissions").select("*, patients(full_name), beds(name)").order("created_at", { ascending: false });
    const { data: patientData } = await supabase.from("patients").select("id, full_name, patient_id");
    
    if (bedData) setBeds(bedData);
    if (admData) setAdmissions(admData);
    if (patientData) setPatients(patientData);
    setLoading(false);
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveBed = async () => {
    if (!newBed.name) {
      alert("Please enter a bed name.");
      return;
    }
    
    console.log("Attempting to save bed:", newBed);
    const { error } = await supabase.from("beds").insert([{ ...newBed, status: "Available" }]);
    
    if (error) {
      console.error("Supabase Error saving bed:", error);
      alert(`Error saving bed: ${error.message}`);
    } else {
      setIsBedDialogOpen(false);
      setNewBed({ name: "", type: "General" });
      fetchData();
    }
  };

  const handleSaveAdmission = async () => {
    if (!newAdmission.patient_id || !newAdmission.bed_id) {
      alert("Please select both a patient and an available bed.");
      return;
    }
    
    console.log("Attempting to save admission:", newAdmission);
    
    // 1. Create admission
    const { error: admError } = await supabase.from("admissions").insert([newAdmission]);
    
    if (admError) {
      console.error("Supabase Error saving admission:", admError);
      alert(`Error saving admission: ${admError.message}`);
      return;
    }

    // Log admission
    const patient = patients.find(p => p.id.toString() === newAdmission.patient_id);
    const bed = beds.find(b => b.id.toString() === newAdmission.bed_id);
    addLog({
      patient_id: patient?.patient_id || 'N/A',
      patient_name: patient?.full_name || 'Unknown',
      service_name: `Admitted to ${bed?.name} (${bed?.type})`,
      amount: 0,
      type: 'Admission'
    });

    // 2. Update bed status to Occupied
    const { error: bedError } = await supabase
      .from("beds")
      .update({ status: "Occupied" })
      .eq("id", newAdmission.bed_id);
    
    if (bedError) {
      console.error("Error updating bed status:", bedError);
    }
      
    setIsAdmissionDialogOpen(false);
    setNewAdmission({ patient_id: "", bed_id: "", admission_date: new Date().toISOString().split('T')[0] });
    fetchData();
  };

  const handleScan = (decodedText: string) => {
    console.log("Scanned:", decodedText);
    setIsScanning(false);
    
    // Find patient by ID or identifier string
    const patient = patients.find(p => 
      p.patient_id?.toLowerCase() === decodedText.toLowerCase() || 
      p.id.toString() === decodedText
    );

    if (patient) {
      setNewAdmission(prev => ({ ...prev, patient_id: patient.id.toString() }));
    } else {
      alert(`Patient "${decodedText}" not found in registry.`);
    }
  };

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      {isScanning && (
        <BarcodeScanner 
          onScan={handleScan} 
          onClose={() => setIsScanning(false)} 
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inpatient Department (IPD)</h1>
          <p className="text-sm text-slate-500">Manage bed occupancy and inpatient admissions</p>
        </div>
        <div className="flex gap-2">
          {/* Add Bed Dialog */}
          <Dialog open={isBedDialogOpen} onOpenChange={setIsBedDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#15807D] text-[#15807D]">
                <BedIcon className="mr-2 h-4 w-4" /> Add Bed
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Bed</DialogTitle>
                <DialogDescription>Enter the bed details to add it to the system.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Bed Name/Number</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Bed-101" 
                    value={newBed.name}
                    onChange={(e) => setNewBed({ ...newBed, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Ward Type</Label>
                  <Select 
                    value={newBed.type} 
                    onValueChange={(value) => setNewBed({ ...newBed, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General Ward</SelectItem>
                      <SelectItem value="ICU">ICU</SelectItem>
                      <SelectItem value="CCU">CCU</SelectItem>
                      <SelectItem value="Cabin">Private Cabin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveBed} className="bg-[#15807D] hover:bg-[#0E5C59]">Save Bed</Button>
            </DialogContent>
          </Dialog>

          {/* New Admission Dialog */}
          <Dialog open={isAdmissionDialogOpen} onOpenChange={setIsAdmissionDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#15807D] hover:bg-[#0E5C59]">
                <UserPlus className="mr-2 h-4 w-4" /> New Admission
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Patient Admission</DialogTitle>
                <DialogDescription>Admit a patient to an available bed.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-end gap-2">
                  <div className="grid gap-2 flex-1">
                    <Label>Select Patient</Label>
                    <Select 
                      value={newAdmission.patient_id} 
                      onValueChange={(val) => setNewAdmission({ ...newAdmission, patient_id: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose Patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map(p => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.full_name} ({p.patient_id})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="button"
                    variant="outline"
                    size="icon"
                    className="mb-0.5 border-teal-200 text-teal-600 hover:bg-teal-50"
                    onClick={() => setIsScanning(true)}
                    title="Scan Patient Barcode"
                  >
                    <Scan className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-2">
                  <Label>Available Beds</Label>
                  <Select 
                    value={newAdmission.bed_id} 
                    onValueChange={(val) => setNewAdmission({ ...newAdmission, bed_id: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose Bed" />
                    </SelectTrigger>
                    <SelectContent>
                      {beds.filter(b => b.status === 'Available').map(b => (
                        <SelectItem key={b.id} value={b.id.toString()}>{b.name} - {b.type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Admission Date</Label>
                  <Input 
                    type="date" 
                    value={newAdmission.admission_date}
                    onChange={(e) => setNewAdmission({ ...newAdmission, admission_date: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleSaveAdmission} className="bg-[#15807D] hover:bg-[#0E5C59]">Confirm Admission</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {beds.map((bed) => {
          const activeAdmission = admissions.find(adm => adm.bed_id === bed.id && adm.status === 'Active');
          return (
            <Card key={bed.id} className={cn("border-l-4", bed.status === 'Available' ? "border-l-green-500" : "border-l-red-500")}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-bold text-slate-700">{bed.name}</CardTitle>
                  <Badge variant={bed.status === 'Available' ? "secondary" : "destructive"}>
                    {bed.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-3 w-3 text-slate-400" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{bed.type} Ward</p>
                </div>
                {bed.status === 'Occupied' && activeAdmission ? (
                  <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-sm font-bold text-slate-900">{activeAdmission.patients?.full_name}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(activeAdmission.admission_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ) : bed.status === 'Occupied' ? (
                  <div className="mt-2 text-xs italic text-slate-400">
                    Occupied (Details loading...)
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                    <Activity className="h-3 w-3" /> Ready for patient
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Active Admissions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Bed</TableHead>
                <TableHead>Admission Date</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admissions.map((adm) => (
                <TableRow key={adm.id}>
                  <TableCell className="font-bold">{adm.patients?.full_name}</TableCell>
                  <TableCell>{adm.beds?.name}</TableCell>
                  <TableCell>{new Date(adm.admission_date).toLocaleDateString()}</TableCell>
                  <TableCell>Dr. Smith</TableCell>
                  <TableCell><Badge>{adm.status}</Badge></TableCell>
                </TableRow>
              ))}
              {admissions.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8">No active admissions</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
