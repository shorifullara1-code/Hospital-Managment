'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'cancelled' | 'completed' | 'no-show';
  reason?: string;
  patients?: {
    given_name: string;
    family_name: string;
  };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*, patients(given_name, family_name)')
      .order('appointment_date', { ascending: true });

    if (data) setAppointments(data);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-500 bg-blue-50 border-blue-100';
      case 'completed': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'cancelled': return 'text-rose-500 bg-rose-50 border-rose-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock size={14} />;
      case 'completed': return <CheckCircle2 size={14} />;
      case 'cancelled': return <XCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <ClipboardList size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic leading-none">Appointments</h1>
              <p className="text-slate-500 font-medium mt-1">Schedule and manage medical consultations</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search appointments..."
              className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all w-64 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95">
            <Plus size={20} />
            <span>New Appointment</span>
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
            <p className="text-slate-400 font-bold animate-pulse">Loading schedule...</p>
          </div>
        ) : appointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Patient</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Time</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Specialist</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 italic transition-all">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/50 group transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:scale-110 transition-transform">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 uppercase tracking-tighter">
                            {appt.patients?.given_name} {appt.patients?.family_name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono italic">{appt.patient_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          {appt.appointment_date}
                        </span>
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-2">
                          <Clock size={14} className="text-slate-300" />
                          {appt.appointment_time}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="font-bold text-slate-600 text-sm italic">General Physician</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={cn(
                        "px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit",
                        getStatusColor(appt.status)
                      )}>
                        {getStatusIcon(appt.status)}
                        {appt.status}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="text-slate-300 hover:text-slate-600 transition-colors p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200">
                        <MoreVertical size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center flex flex-col items-center gap-6">
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 rotate-12 group hover:rotate-0 transition-transform duration-500">
              <ClipboardList size={48} />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-black text-slate-800 uppercase tracking-tight">No appointments found</p>
              <p className="text-slate-400 font-medium italic">Schedule your first patient consultation today.</p>
            </div>
            <button className="mt-4 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all flex items-center gap-3">
              <Plus size={20} />
              CREATE APPOINTMENT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
