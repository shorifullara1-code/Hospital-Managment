'use client';

import React from 'react';
import { UserRound, Plus, Stethoscope, Mail, Phone, MoreVertical } from 'lucide-react';

export default function DoctorsPage() {
  const doctors = [
    { name: 'Dr. Sarah Collins', specialty: 'Cardiologist', status: 'Available', email: 'sarah.c@medcore.com' },
    { name: 'Dr. James Wilson', specialty: 'Neurologist', status: 'On Leave', email: 'james.w@medcore.com' },
    { name: 'Dr. Michael Chen', specialty: 'Pediatrician', status: 'Available', email: 'm.chen@medcore.com' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <UserRound size={28} className="text-primary" />
            <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic">Medical Staff</h1>
          </div>
          <p className="text-slate-500 font-medium">Manage hospital doctors, specialists and on-duty staff</p>
        </div>
        <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
          <Plus size={20} />
          <span>Add New Doctor</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map(doc => (
          <div key={doc.name} className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
            
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <Stethoscope size={32} />
              </div>
              <button className="text-slate-300 hover:text-slate-600">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{doc.name}</h3>
              <p className="text-sm text-primary font-bold">{doc.specialty}</p>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 text-slate-500 hover:text-primary transition-colors cursor-pointer">
                <Mail size={14} />
                <span className="text-xs font-medium">{doc.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <div className={`w-2 h-2 rounded-full ${doc.status === 'Available' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-xs font-bold uppercase tracking-widest">{doc.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
