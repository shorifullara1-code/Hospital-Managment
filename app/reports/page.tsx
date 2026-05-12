'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, Activity, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const data = [
  { name: 'Jan', patients: 400 },
  { name: 'Feb', patients: 300 },
  { name: 'Mar', patients: 550 },
  { name: 'Apr', patients: 450 },
  { name: 'May', patients: 700 },
  { name: 'Jun', patients: 650 },
];

export default function ReportsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 size={28} className="text-primary" />
            <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic">Analytics & Reports</h1>
          </div>
          <p className="text-slate-500 font-medium">Visualized hospital data, performance metrics and growth statistics</p>
        </div>
        <button 
          onClick={() => alert("Report Exported!")}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
        >
          <Download size={20} />
          <span>Export Stats</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden min-h-[400px] flex flex-col">
              <div className="absolute top-0 right-0 p-8">
                <TrendingUp className="text-emerald-500" size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8">Patient Growth</h2>
              <div className="flex-1 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                    <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="patients" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100">
                 <Users className="mb-4 opacity-50" size={32} />
                 <p className="text-4xl font-black tracking-tighter">1,284</p>
                 <p className="text-xs font-black uppercase tracking-widest opacity-70">Total Active Patients</p>
              </div>
              <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl shadow-slate-200">
                 <Activity className="mb-4 opacity-50" size={32} />
                 <p className="text-4xl font-black tracking-tighter">98.2%</p>
                 <p className="text-xs font-black uppercase tracking-widest opacity-70">Bed Occupancy Rate</p>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-6 rounded-[40px] border border-slate-200 shadow-sm">
             <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">Department Performance</h3>
             <div className="space-y-6">
                {[
                  { name: 'Outpatient', value: 85, color: 'bg-blue-500' },
                  { name: 'Surgery', value: 42, color: 'bg-purple-500' },
                  { name: 'Pediatrics', value: 68, color: 'bg-emerald-500' },
                  { name: 'Emergency', value: 94, color: 'bg-rose-500' },
                ].map(dept => (
                  <div key={dept.name} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <span>{dept.name}</span>
                      <span>{dept.value}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${dept.color}`} style={{ width: `${dept.value}%` }} />
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
