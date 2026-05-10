"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Users, DollarSign, CalendarCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ReportsView() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalIncome: 0,
    activeDoctors: 0,
  });

  const [dailyDoctorStats, setDailyDoctorStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      // Fetch totals
      const [ptsRes, aptsRes, docsRes] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*, doctors(full_name, fee)'),
        supabase.from('doctors').select('*', { count: 'exact', head: true })
      ]);

      let income = 0;
      const breakdown: Record<string, any> = {};

      if (aptsRes.data) {
        aptsRes.data.forEach((apt: any) => {
           // Income calculation
           const fee = apt.fee_amount || apt.doctors?.fee || 50;
           income += fee; // Including all scheduled/completed for simplified report

           // Daily breakdown calculation
           const date = apt.appointment_date;
           const doctorId = apt.doctor_id;
           const doctorName = apt.doctors?.full_name || "Unknown Doctor";
           const key = `${date}_${doctorId}`;

           if (!breakdown[key]) {
             breakdown[key] = {
               date,
               doctorName,
               count: 0,
               totalFees: 0
             };
           }
           breakdown[key].count += 1;
           breakdown[key].totalFees += fee;
        });
      }

      // Convert breakdown map to sorted array
      const sortedBreakdown = Object.values(breakdown).sort((a: any, b: any) => {
        // Sort by date descending, then doctor name
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.doctorName.localeCompare(b.doctorName);
      });

      setDailyDoctorStats(sortedBreakdown);
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daily Doctor Financial Breakdown</CardTitle>
              <CardDescription>
                Appointments count and fees collected per doctor, per day.
              </CardDescription>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Doctor Name</TableHead>
                    <TableHead className="text-center">Appointments</TableHead>
                    <TableHead className="text-right">Total Fees</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">Loading stats...</TableCell>
                    </TableRow>
                  ) : dailyDoctorStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">No data available</TableCell>
                    </TableRow>
                  ) : dailyDoctorStats.map((stat, i) => (
                    <TableRow key={i}>
                      <TableCell>{stat.date}</TableCell>
                      <TableCell className="font-medium">{stat.doctorName}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{stat.count}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        ${stat.totalFees.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
