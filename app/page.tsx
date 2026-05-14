"use client";

import { Users, Search, Activity, Calendar, Heart, Wallet, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deptData, revenueData, weeklyVisits } from "@/lib/data";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { DeptChart } from "@/components/dashboard/dept-chart";
import { VisitsChart } from "@/components/dashboard/visits-chart";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 bg-slate-50 min-h-screen">
      {/* Patient Quick Lookup Banner */}
      <div className="bg-[#15807D] rounded-2xl p-6 text-white shadow-lg shadow-teal-900/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/20 p-2 rounded-lg">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-none">Patient Quick Lookup</h2>
            <p className="text-[10px] text-teal-100 opacity-80 mt-1">Search by ID, Name, Phone, or NID</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 font-bold" />
          <Input 
            className="bg-white text-slate-900 border-none h-12 pl-12 rounded-xl placeholder:text-slate-400 text-sm shadow-inner"
            placeholder="Enter Patient ID (e.g. P001), name, or phone..."
          />
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="TOTAL PATIENTS" 
          value="8" 
          subValue="+3 this week" 
          icon={<Users className="h-5 w-5" />} 
          color="bg-[#15807D]" 
        />
        <StatCard 
          title="DOCTORS" 
          value="6" 
          subValue="5 available" 
          icon={<Heart className="h-5 w-5" />} 
          color="bg-blue-600" 
        />
        <StatCard 
          title="APPOINTMENTS" 
          value="5" 
          subValue="Total booked" 
          icon={<Calendar className="h-5 w-5" />} 
          color="bg-purple-600" 
        />
        <StatCard 
          title="REVENUE (MAR)" 
          value="৳2.98L" 
          subValue="+8% vs Feb" 
          icon={<Wallet className="h-5 w-5" />} 
          color="bg-green-600" 
        />
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
