'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  UserPlus, 
  Search, 
  Printer, 
  IdCard, 
  Trash2, 
  MoreVertical,
  X,
  CreditCard,
  MapPin,
  Phone,
  User,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Barcode from 'react-barcode';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  patient_id: string;
  family_name: string;
  given_name: string;
  gender: string;
  birth_date: string;
  phone: string;
  address: string;
  blood_group?: string;
  created_at: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showIDCard, setShowIDCard] = useState(false);
  const [hospitalName, setHospitalName] = useState('MEDCORE');

  const [formData, setFormData] = useState({
    family_name: '',
    given_name: '',
    gender: 'Male',
    birth_date: '',
    phone: '',
    address: '',
    blood_group: 'A+'
  });

  useEffect(() => {
    fetchPatients();
    fetchHospitalSettings();
  }, []);

  const fetchHospitalSettings = async () => {
    const { data } = await supabase
      .from('hospital_settings')
      .select('name')
      .single();
    if (data?.name) setHospitalName(data.name);
  };

  const fetchPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setPatients(data);
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const patient_id = `P-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const { data, error } = await supabase
      .from('patients')
      .insert([{ ...formData, patient_id }])
      .select()
      .single();

    if (data) {
      setPatients([data, ...patients]);
      setShowAddModal(false);
      setFormData({
        family_name: '',
        given_name: '',
        gender: 'Male',
        birth_date: '',
        phone: '',
        address: '',
        blood_group: 'A+'
      });
      // Automatically show ID card for new patient
      setSelectedPatient(data);
      setShowIDCard(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (!error) setPatients(patients.filter(p => p.id !== id));
  };

  const filteredPatients = patients.filter(p => 
    `${p.given_name} ${p.family_name}`.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Patient Registry</h1>
          <p className="text-slate-500">Manage hospital patients and identification</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
        >
          <UserPlus size={20} />
          Register Patient
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by name or ID..." 
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Info</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender/Age</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPatients.map(patient => (
              <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {(patient.given_name?.[0] || '')}{(patient.family_name?.[0] || '')}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{patient.given_name} {patient.family_name}</p>
                      <p className="text-xs text-slate-500 font-mono">{patient.patient_id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {patient.gender} • {new Date().getFullYear() - new Date(patient.birth_date).getFullYear()} yrs
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1"><Phone size={12} className="text-slate-400" /> {patient.phone}</span>
                    <span className="flex items-center gap-1 truncate max-w-[200px]"><MapPin size={12} className="text-slate-400" /> {patient.address}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => { setSelectedPatient(patient); setShowIDCard(true); }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg transition-all border border-emerald-100 hover:bg-emerald-100 hover:shadow-sm"
                      title="Print ID Card"
                    >
                      <IdCard size={16} />
                      <span className="text-xs font-bold">Print ID</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(patient.id)}
                      className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                      title="Delete Patient"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPatients.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500">
            No patients found matching your search.
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-xl relative shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">New Patient Registration</h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X />
                </button>
              </div>

              <form onSubmit={handleRegister} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Given Name</label>
                    <input 
                      required
                      className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      value={formData.given_name}
                      onChange={e => setFormData({...formData, given_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Family Name</label>
                    <input 
                      required
                      className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      value={formData.family_name}
                      onChange={e => setFormData({...formData, family_name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Gender</label>
                    <select 
                      className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                      value={formData.gender}
                      onChange={e => setFormData({...formData, gender: e.target.value})}
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Blood Group</label>
                    <select 
                      className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                      value={formData.blood_group}
                      onChange={e => setFormData({...formData, blood_group: e.target.value})}
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Date of Birth</label>
                    <input 
                      type="date"
                      required
                      className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      value={formData.birth_date}
                      onChange={e => setFormData({...formData, birth_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                    <input 
                      type="tel"
                      required
                      className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Address</label>
                  <textarea 
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[80px]"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                  Complete Registration
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ID Card Display & Printer Modal */}
      <AnimatePresence>
        {showIDCard && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md no-print"
              onClick={() => setShowIDCard(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 relative shadow-2xl max-w-md w-full print:p-0 print:shadow-none print:rounded-none overflow-visible"
            >
              <div className="flex justify-between items-center mb-8 no-print">
                <h3 className="text-xl font-bold text-slate-800">Patient ID Card</h3>
                <button onClick={() => setShowIDCard(false)} className="text-slate-400 hover:text-slate-600">
                  <X />
                </button>
              </div>

              {/* Card Visualization */}
              <div id="patient-id-card" className="relative w-full aspect-[1.586/1] bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl overflow-hidden shadow-2xl text-white p-6 border-4 border-white/10 print:border-0 print:shadow-none print:rounded-none">
                {/* Background Patterns */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16" />
                
                {/* Logo Area */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30">
                      <CreditCard size={18} />
                    </div>
                    <span className="font-black tracking-tighter text-lg uppercase">{hospitalName}</span>
                  </div>
                  <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold backdrop-blur-sm border border-white/20">
                    Hospital ID
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-20 h-24 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex flex-col items-center justify-center shrink-0">
                    <User size={40} className="text-white/40" />
                    <div className="text-[8px] mt-2 opacity-50 uppercase font-bold tracking-widest">Photo</div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-[8px] opacity-60 uppercase font-bold tracking-widest leading-none mb-1">Full Name</p>
                      <p className="text-sm font-black uppercase tracking-tight leading-none whitespace-nowrap overflow-hidden text-ellipsis">
                        {selectedPatient.given_name} {selectedPatient.family_name}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[8px] opacity-60 uppercase font-bold tracking-widest leading-none mb-1">Gender</p>
                        <p className="text-[10px] font-bold">{selectedPatient.gender}</p>
                      </div>
                      <div>
                        <p className="text-[8px] opacity-60 uppercase font-bold tracking-widest leading-none mb-1">Birth Date</p>
                        <p className="text-[10px] font-bold">{selectedPatient.birth_date}</p>
                      </div>
                      <div>
                        <p className="text-[8px] opacity-60 uppercase font-bold tracking-widest leading-none mb-1">Blood</p>
                        <p className="text-[10px] font-bold text-amber-300">{selectedPatient.blood_group || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="pt-1">
                      <p className="text-[8px] opacity-60 uppercase font-bold tracking-widest leading-none mb-1">Patient ID</p>
                      <p className="text-sm font-mono font-black tracking-widest">{selectedPatient.patient_id}</p>
                    </div>
                  </div>
                </div>

                {/* Footer / Barcode */}
                <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                   <div className="bg-white p-1 rounded-sm">
                      <Barcode 
                        value={selectedPatient.patient_id} 
                        width={1} 
                        height={20} 
                        fontSize={8}
                        margin={0}
                        displayValue={false}
                        background="transparent"
                      />
                   </div>
                   <div className="text-right">
                      <p className="text-[6px] opacity-40 uppercase tracking-widest mb-1 italic">Authorized Card</p>
                      <div className="h-4 border-b border-white/30" />
                   </div>
                </div>
              </div>

              <div className="mt-8 space-y-3 no-print">
                <button 
                  onClick={() => window.print()}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]"
                >
                  <Printer size={20} />
                  Print Physical Card
                </button>
                <div className="text-center text-xs text-slate-400 p-2 border border-dashed border-slate-200 rounded-lg">
                  Standard CR80 size Recommended (85.6mm x 53.98mm)
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Styles for ID Card */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #patient-id-card, #patient-id-card * {
            visibility: visible;
          }
          #patient-id-card {
            position: fixed;
            left: 0;
            top: 0;
            width: 85.6mm !important;
            height: 53.98mm !important;
            margin: 0;
            border-radius: 4mm;
            -webkit-print-color-adjust: exact;
            background: linear-gradient(to bottom right, #4f46e5, #1d4ed8) !important;
            color: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
