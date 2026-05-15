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
import { Building2, Plus, UserPlus, BedIcon, Activity } from "lucide-react";

export default function IPDPage() {
  const [beds, setBeds] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: bedData } = await supabase.from("beds").select("*").order("name");
    const { data: admData } = await supabase.from("admissions").select("*, patients(full_name), beds(name)").order("created_at", { ascending: false });
    
    if (bedData) setBeds(bedData);
    if (admData) setAdmissions(admData);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inpatient Department (IPD)</h1>
          <p className="text-sm text-slate-500">Manage bed occupancy and inpatient admissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#15807D] text-[#15807D]">
             <BedIcon className="mr-2 h-4 w-4" /> Add Bed
          </Button>
          <Button className="bg-[#15807D] hover:bg-[#0E5C59]">
            <UserPlus className="mr-2 h-4 w-4" /> New Admission
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {beds.map((bed) => (
          <Card key={bed.id} className={cn("border-l-4", bed.status === 'Available' ? "border-l-green-500" : "border-l-red-500")}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-bold">{bed.name}</CardTitle>
                <Badge variant={bed.status === 'Available' ? "secondary" : "destructive"}>
                  {bed.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{bed.type} Ward</p>
              {bed.status === 'Occupied' && (
                <div className="mt-2 text-xs">
                  <p className="font-medium">Patient: John Doe</p>
                  <p className="text-slate-400">Adm Date: 12 May 2024</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
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
