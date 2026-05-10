"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Users, DollarSign, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsView() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalIncome: 0,
    activeDoctors: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      // Fetch totals
      const [ptsRes, aptsRes, docsRes] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*, doctors(fee)'),
        supabase.from('doctors').select('*', { count: 'exact', head: true })
      ]);

      let income = 0;
      if (aptsRes.data) {
        aptsRes.data.forEach((apt: any) => {
           if (apt.status === "Completed") {
             income += apt.doctors?.fee || 50;
           }
        });
      }

      setStats({
        totalPatients: ptsRes.count || 0,
        totalAppointments: aptsRes.data?.length || 0,
        totalIncome: income,
        activeDoctors: docsRes.count || 0,
      });

      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Overview of hospital performance, patient statistics, and revenue.
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline">Export Full Report</Button>
           <Button>Generate Tax Statement</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${loading ? "..." : stats.totalIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">+180 new this quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">+19% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Doctors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.activeDoctors}</div>
            <p className="text-xs text-muted-foreground">+2 joined recently</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>System Activity Trends</CardTitle>
            <CardDescription>
               In a production environment, this chart would render daily appointment flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2 flex justify-center items-center h-[300px] border border-dashed rounded-lg bg-muted/10 m-4 mt-0">
            <p className="text-muted-foreground text-sm">Revenue/Appointment Chart Visualization Area</p>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
             <CardTitle>Recent Feedback</CardTitle>
             <CardDescription>
               Latest satisfaction surveys from patients.
             </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-8">
               <div className="flex items-center">
                 <div className="ml-4 space-y-1">
                   <p className="text-sm font-medium leading-none">Emily R.</p>
                   <p className="text-sm text-muted-foreground">"Dr. Smith was amazing. Very detailed!"</p>
                 </div>
                 <div className="ml-auto font-medium text-amber-500">★★★★★</div>
               </div>
               <div className="flex items-center">
                 <div className="ml-4 space-y-1">
                   <p className="text-sm font-medium leading-none">Michael B.</p>
                   <p className="text-sm text-muted-foreground">"Wait times were a bit long today."</p>
                 </div>
                 <div className="ml-auto font-medium text-amber-500">★★★☆☆</div>
               </div>
               <div className="flex items-center">
                 <div className="ml-4 space-y-1">
                   <p className="text-sm font-medium leading-none">Sarah L.</p>
                   <p className="text-sm text-muted-foreground">"Prescription process was seamless."</p>
                 </div>
                 <div className="ml-auto font-medium text-amber-500">★★★★★</div>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
