'use client';

import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  X
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
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    given_name: '',
    family_name: '',
    appointment_date: '',
    appointment_time: '',
    status: 'scheduled' as const,
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setTimeout(() => {
      const mockData: Appointment[] = [
        {
          id: '1',
          patient_id: 'P-1002',
          doctor_id: 'D-001',
          appointment_date: '2026-05-13',
          appointment_time: '10:00 AM',
          status: 'scheduled',
          patients: { given_name: 'John', family_name: 'Doe' }
        },
        {
          id: '2',
          patient_id: 'P-1005',
          doctor_id: 'D-002',
          appointment_date: '2026-05-13',
          appointment_time: '11:30 AM',
          status: 'completed',
          patients: { given_name: 'Mary', family_name: 'Smith' }
        }
      ];
      setAppointments(mockData);
      setLoading(false);
    }, 500);
  };

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const newAppointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      patient_id: 'P-' + Math.floor(Math.random() * 9000 + 1000),
      doctor_id: 'D-001',
      appointment_date: formData.appointment_date,
      appointment_time: formData.appointment_time,
      status: formData.status,
      patients: {
        given_name: formData.given_name,
        family_name: formData.family_name
      }
    };
    setAppointments([newAppointment, ...appointments]);
    setShowForm(false);
    setFormData({ given_name: '', family_name: '', appointment_date: '', appointment_time: '', status: 'scheduled' });
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

  const filteredAppointments = appointments.filter(appt => 
    appt.patients?.given_name.toLowerCase().includes(search.toLowerCase()) || 
    appt.patients?.family_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen relative">
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
          <button 
            onClick={() => setShowForm(true)}
            className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95"
          >
            <Plus size={20} />
            <span>New Appointment</span>
          </button>
        </div>
      </header>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowForm(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase mb-6">New Appointment</h2>
            <form onSubmit={handleAddAppointment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">First Name</label>
                  <input 
                    type="text" required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.given_name} onChange={e => setFormData({...formData, given_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Last Name</label>
                  <input 
                    type="text" required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.family_name} onChange={e => setFormData({...formData, family_name: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Date</label>
                  <input 
                    type="date" required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.appointment_date} onChange={e => setFormData({...formData, appointment_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Time</label>
                  <input 
                    type="time" required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.appointment_time} onChange={e => setFormData({...formData, appointment_time: e.target.value})}
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-4 hover:bg-slate-800 transition-colors">
                Book Appointment
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
            <p className="text-slate-400 font-bold animate-pulse">Loading schedule...</p>
          </div>
        ) : filteredAppointments.length > 0 ? (
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
                {filteredAppointments.map((appt) => (
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
                      <button 
                        onClick={() => setAppointments(appointments.filter(a => a.id !== appt.id))}
                        className="text-rose-300 hover:text-rose-600 transition-colors p-2 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200"
                        title="Delete Appointment"
                      >
                        <X size={20} />
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
            <button 
              onClick={() => setShowForm(true)}
              className="mt-4 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all flex items-center gap-3">
              <Plus size={20} />
              CREATE APPOINTMENT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
