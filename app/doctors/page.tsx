'use client';

import React, { useState } from 'react';
import { UserRound, Plus, Stethoscope, Mail, MoreVertical, X } from 'lucide-react';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([
    { name: 'Dr. Sarah Collins', specialty: 'Cardiologist', status: 'Available', email: 'sarah.c@medcore.com' },
    { name: 'Dr. James Wilson', specialty: 'Neurologist', status: 'On Leave', email: 'james.w@medcore.com' },
    { name: 'Dr. Michael Chen', specialty: 'Pediatrician', status: 'Available', email: 'm.chen@medcore.com' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', specialty: '', status: 'Available', email: '' });

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name) {
      setDoctors([...doctors, formData]);
      setShowForm(false);
      setFormData({ name: '', specialty: '', status: 'Available', email: '' });
    }
  };

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
        <button 
          onClick={() => setShowForm(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          <span>Add New Doctor</span>
        </button>
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
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase mb-6">Add Doctor</h2>
            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Name</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Dr. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Specialty</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})}
                  placeholder="e.g. Cardiologist"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Email</label>
                <input 
                  type="email" required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="doctor@hospital.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Status</label>
                <select 
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option>Available</option>
                  <option>On Leave</option>
                  <option>Busy</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-4 hover:bg-slate-800 transition-colors">
                Save Doctor Profile
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map(doc => (
          <div key={doc.name} className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
            
            <div className="flex justify-between items-start mb-6 relative">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <Stethoscope size={32} />
              </div>
              <button 
                onClick={() => setDoctors(doctors.filter(d => d.name !== doc.name))}
                className="text-rose-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors"
                title="Remove Doctor"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6 relative">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{doc.name}</h3>
              <p className="text-sm text-primary font-bold">{doc.specialty}</p>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-100 relative">
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
