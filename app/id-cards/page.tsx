'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  IdCard, 
  Printer, 
  X, 
  CreditCard, 
  User,
  Filter
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
  blood_group?: string;
}

export default function IDCardsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [hospitalName, setHospitalName] = useState('MEDCORE');

  useEffect(() => {
    fetchHospitalName();
  }, []);

  const fetchHospitalName = async () => {
    const { data } = await supabase.from('hospital_settings').select('name').single();
    if (data?.name) setHospitalName(data.name);
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    const { data } = await supabase
      .from('patients')
      .select('*')
      .or(`given_name.ilike.%${search}%,family_name.ilike.%${search}%,patient_id.ilike.%${search}%`)
      .limit(10);
    
    if (data) setPatients(data);
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <IdCard size={28} className="text-primary" />
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">ID Card Management</h1>
        </div>
        <p className="text-slate-500">Search patients and generate official hospital identification cards</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Search Section */}
        <section className="space-y-6 no-print">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <label className="text-sm font-bold text-slate-600 mb-2 block">Search Patient</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Enter name or Patient ID..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button 
                onClick={handleSearch}
                className="bg-primary text-white p-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                <Search size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Search Results</p>
            {loading ? (
              <div className="p-8 text-center text-slate-400 italic">Searching database...</div>
            ) : patients.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
                {patients.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setSelectedPatient(p)}
                    className={cn(
                      "w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors group",
                      selectedPatient?.id === p.id && "bg-primary/5 border-l-4 border-primary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:scale-110 transition-transform">
                        {p.given_name?.[0]}{p.family_name?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 uppercase tracking-tighter">{p.given_name} {p.family_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono italic">{p.patient_id}</p>
                      </div>
                    </div>
                    <IdCard size={18} className="text-slate-300 group-hover:text-primary" />
                  </button>
                ))}
              </div>
            ) : search && !loading ? (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                No patients found matching your search.
              </div>
            ) : (
              <div className="p-12 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center gap-4">
                <Filter size={48} className="opacity-20" />
                <p className="text-sm font-medium">Search for a patient to begin</p>
              </div>
            )}
          </div>
        </section>

        {/* Card Section */}
        <section className="flex flex-col items-center">
          <AnimatePresence mode="wait">
            {selectedPatient ? (
              <motion.div 
                key={selectedPatient.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm sticky top-8"
              >
                <div id="patient-id-card-final" className="relative w-full aspect-[1.586/1] bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl overflow-hidden shadow-2xl text-white p-8 border-4 border-white/10 card-shadow">
                  {/* Patterns */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16" />
                  
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30">
                        <CreditCard size={18} />
                      </div>
                      <span className="font-black tracking-tighter text-lg uppercase">{hospitalName}</span>
                    </div>
                    <div className="text-[10px] bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest font-black backdrop-blur-sm border border-white/20">
                      ID CARD
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="w-24 h-28 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex flex-col items-center justify-center shrink-0">
                      <User size={48} className="text-white/40" />
                    </div>
                    <div className="flex-1 space-y-4 pt-1">
                      <div>
                        <p className="text-[8px] opacity-60 uppercase font-black tracking-widest leading-none mb-1">Full Name</p>
                        <p className="text-base font-black uppercase tracking-tight leading-tight">
                          {selectedPatient.given_name} {selectedPatient.family_name}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-[8px] opacity-60 uppercase font-black tracking-widest leading-none mb-1">Gender</p>
                          <p className="text-[10px] font-black">{selectedPatient.gender}</p>
                        </div>
                        <div>
                          <p className="text-[8px] opacity-60 uppercase font-black tracking-widest leading-none mb-1">Birth</p>
                          <p className="text-[10px] font-black">{selectedPatient.birth_date}</p>
                        </div>
                        <div>
                          <p className="text-[8px] opacity-60 uppercase font-black tracking-widest leading-none mb-1">Blood</p>
                          <p className="text-[10px] font-black text-amber-300">{selectedPatient.blood_group || 'N/A'}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[8px] opacity-60 uppercase font-black tracking-widest leading-none mb-1">Patient ID</p>
                        <p className="text-sm font-mono font-black tracking-[4px]">{selectedPatient.patient_id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end">
                    <div className="bg-white p-1 rounded-sm scale-90 origin-left">
                      <Barcode value={selectedPatient.patient_id} width={1} height={20} displayValue={false} margin={0} />
                    </div>
                    <div className="text-right">
                       <p className="text-[6px] opacity-40 uppercase tracking-widest mb-1 italic">Scan for verification</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-4 no-print">
                   <button 
                    onClick={() => window.print()}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98]"
                  >
                    <Printer size={20} />
                    PRINT PHYSICAL CARD
                  </button>
                  <p className="text-center text-xs text-slate-400 font-medium">Standard CR80 size Recommended</p>
                </div>
              </motion.div>
            ) : (
              <div className="w-full aspect-[1/1.2] rounded-3xl border-4 border-dashed border-slate-100 flex flex-col items-center justify-center p-8 text-center text-slate-300">
                <IdCard size={64} className="mb-4 opacity-10" />
                <p className="font-bold">Preview Area</p>
                <p className="text-sm">Card will appear here once a patient is selected</p>
              </div>
            )}
          </AnimatePresence>
        </section>
      </div>

       <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #patient-id-card-final, #patient-id-card-final * {
            visibility: visible;
          }
          #patient-id-card-final {
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
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
        .card-shadow {
          box-shadow: 0 25px 50px -12px rgba(79, 70, 229, 0.25);
        }
      `}</style>
    </div>
  );
}
