"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, Activity, Calendar, Heart, Wallet, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { deptData, revenueData, weeklyVisits } from "@/lib/data";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { DeptChart } from "@/components/dashboard/dept-chart";
import { VisitsChart } from "@/components/dashboard/visits-chart";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    revenue: 0,
    loading: true
  });

  useEffect(() => {
    async function fetchStats() {
      const [pts, docs, apts] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('doctors').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('*')
      ]);

      const rev = (apts.data || []).reduce((acc: number, curr: any) => acc + (Number(curr.fee_amount) || 0), 0);

      setStats({
        patients: pts.count || 0,
        doctors: docs.count || 0,
        appointments: apts.count || (apts.data?.length || 0),
        revenue: rev,
        loading: false
      });
    }
    fetchStats();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to patients page with search query
      router.push(`/patients?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 bg-slate-50 min-h-screen">
      {/* Prominent Patient Quick Lookup Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#15807D] to-[#0E5C59] rounded-3xl p-8 md:p-12 text-white shadow-2xl shadow-teal-900/20 mb-2">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full -ml-32 -mb-32 blur-3xl" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/10">
              <Users className="h-6 w-6 text-teal-50" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">Patient Registry</h2>
              <p className="text-teal-100/70 text-sm font-medium">Instantly access medical records & history</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-teal-400 group-focus-within:text-teal-600 transition-colors z-20" />
            <Input 
              className="bg-white text-slate-900 border-none h-16 pl-14 pr-32 rounded-2xl placeholder:text-slate-400 text-lg shadow-2xl focus-visible:ring-4 focus-visible:ring-teal-500/20 w-full transition-all"
              placeholder="Search by ID, Name, or Phone Number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              type="submit" 
              className="absolute right-2 top-2 bottom-2 bg-[#15807D] hover:bg-[#0E5C59] text-white rounded-xl px-6 font-bold shadow-lg transition-transform active:scale-95"
            >
              Lookup
            </Button>
          </form>
          
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-teal-100/50">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Quick Searches:
            </div>
            {['P-101', 'John Doe', '017...'].map((tag) => (
              <button 
                key={tag}
                onClick={() => {
                  setSearchQuery(tag);
                  router.push(`/patients?q=${encodeURIComponent(tag)}`);
                }}
                className="text-[11px] font-bold px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full border border-white/5 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.loading ? (
           <div className="col-span-full h-24 flex items-center justify-center bg-white rounded-2xl border shadow-sm">
             <Loader2 className="h-6 w-6 animate-spin text-teal-600 mr-2" />
             <span className="text-slate-500 font-medium">Loading statistics...</span>
           </div>
        ) : (
          <>
            <StatCard 
              title="TOTAL PATIENTS" 
              value={stats.patients.toString()} 
              subValue="Registered patients" 
              icon={<Users className="h-5 w-5" />} 
              color="bg-[#15807D]" 
            />
            <StatCard 
              title="DOCTORS" 
              value={stats.doctors.toString()} 
              subValue="In registry" 
              icon={<Heart className="h-5 w-5" />} 
              color="bg-blue-600" 
            />
            <StatCard 
              title="APPOINTMENTS" 
              value={stats.appointments.toString()} 
              subValue="Total booked" 
              icon={<Calendar className="h-5 w-5" />} 
              color="bg-purple-600" 
            />
            <StatCard 
              title="TOTAL INCOME" 
              value={`৳${(stats.revenue / 100000).toFixed(2)}L`} 
              subValue="From appointments" 
              icon={<Wallet className="h-5 w-5" />} 
              color="bg-green-600" 
            />
          </>
        )}
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">Revenue vs Expenses</CardTitle>
            <div className="text-[10px] text-slate-400 font-bold tracking-wider">JAN - JUN 2024</div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <RevenueChart data={revenueData} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-700">Dept. Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <DeptChart data={deptData} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Visits Row */}
      <Card className="border-none shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-700">Weekly Patient Visits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4">
            <VisitsChart data={weeklyVisits} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, subValue, icon, color }: { title: string, value: string, subValue: string, icon: React.ReactNode, color: string }) {
  return (
    <Card className="border-none shadow-sm rounded-2xl hover:shadow-md transition-all cursor-default overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`${color} p-2.5 rounded-xl text-white shadow-lg shadow-opacity-30 group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 tracking-tight">{value}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-wide">{subValue}</p>
        </div>
      </CardContent>
    </Card>
  );
}
