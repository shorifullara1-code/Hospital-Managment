'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Printer, 
  ArrowLeft, 
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { motion } from 'motion/react';

interface AppointmentData {
  id: string;
  appointment_date: string;
  status: string;
  fee?: number;
  patients?: {
    given_name: string;
    family_name: string;
    birth_date: string;
    gender: string;
    patient_id: string;
  };
  doctors?: {
    name: string;
    speciality: string;
    qualification: string;
  };
}

export default function PrescriptionPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const [appointment, setAppointment] = useState<null | AppointmentData>(null);
  const [hospital, setHospital] = useState<Record<string, string>>({
    name: "MedCore Hospital",
    address: "123 Health Ave, Medical City",
    phone: "+1 234 567 890",
    email: "contact@medcore.com"
  });
  const [loading, setLoading] = useState(true);

  const fetchData = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    
    // Fetch appointment and patient info
    const { data: appt } = await supabase
      .from('appointments')
      .select(`
        *,
        patients (
          given_name,
          family_name,
          birth_date,
          gender,
          patient_id
        ),
        doctors (
          name,
          speciality,
          qualification
        )
      `)
      .eq('id', id)
      .single();

    if (appt) setAppointment(appt);

    // Fetch hospital settings
    const { data: settings } = await supabase
      .from('hospital_settings')
      .select('*')
      .single();
    
    if (settings) {
      setHospital({
        name: settings.name || "MedCore Hospital",
        address: settings.address || "123 Health Ave, Medical City",
        phone: settings.phone || "+1 234 567 890",
        email: settings.email || "contact@medcore.com"
      });
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="p-8 text-center">Loading prescription...</div>;
  if (!appointment) return <div className="p-8 text-center text-rose-500">Prescription not found.</div>;

  const patient = appointment.patients;
  const doctor = appointment.doctors;
  const age = patient ? new Date().getFullYear() - new Date(patient.birth_date).getFullYear() : 'N/A';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto mb-8 no-print flex justify-between items-center">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={20} /> Back
        </button>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
        >
          <Printer size={20} /> Print Prescription
        </button>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-2xl rounded-sm mx-auto p-12 border-t-[12px] border-primary min-h-[1050px] relative font-serif"
        id="prescription-document"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tighter mb-2">{hospital.name}</h1>
            <div className="text-slate-500 text-xs space-y-1 font-sans not-italic uppercase tracking-wider font-semibold">
              <p className="flex items-center gap-2"><MapPin size={12} /> {hospital.address}</p>
              <p className="flex items-center gap-2"><Phone size={12} /> {hospital.phone}</p>
              <p className="flex items-center gap-2"><Mail size={12} /> {hospital.email}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-black text-slate-800 mb-1">{doctor?.name}</h2>
            <p className="text-primary font-bold text-sm tracking-tight">{doctor?.speciality}</p>
            <p className="text-slate-500 text-xs font-sans mt-1">{doctor?.qualification}</p>
          </div>
        </div>

        {/* Patient Details Stripe */}
        <div className="bg-slate-50 grid grid-cols-4 gap-4 p-4 rounded-lg mb-10 font-sans">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Patient Name</p>
            <p className="font-bold text-slate-800 text-sm">{patient?.given_name} {patient?.family_name}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">ID / Gender / Age</p>
            <p className="font-bold text-slate-800 text-sm">{patient?.patient_id} / {patient?.gender} / {age} yrs</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Date</p>
            <p className="font-bold text-slate-800 text-sm">{new Date(appointment.appointment_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Status</p>
            <p className="text-primary font-black text-sm uppercase">{appointment.status}</p>
          </div>
        </div>

        {/* Prescription Content */}
        <div className="flex gap-12 flex-1 relative min-h-[600px]">
          {/* Right Column - Prescription (Now taking full width because vitals were removed) */}
          <div className="w-full pl-2 pt-2 relative">
            <div className="absolute top-0 left-0 text-7xl font-serif text-slate-100 italic pointer-events-none select-none">
              ℞
            </div>
            
            {/* Vitals and Complaints sections removed as per user request */}
            
            <div className="pt-24 space-y-12">
               <div className="border-b border-dashed border-slate-100 h-1"></div>
               <div className="border-b border-dashed border-slate-100 h-1"></div>
               <div className="border-b border-dashed border-slate-100 h-1"></div>
               <div className="border-b border-dashed border-slate-100 h-1"></div>
               <div className="border-b border-dashed border-slate-100 h-1"></div>
               <div className="border-b border-dashed border-slate-100 h-1"></div>
               <div className="border-b border-dashed border-slate-100 h-1"></div>
               <div className="border-b border-dashed border-slate-100 h-1"></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end border-t-2 border-slate-100 pt-8 font-sans">
          <div>
             <p className="text-xs text-slate-400 mb-1">Appointment Reference</p>
             <p className="text-sm font-bold text-slate-800">#{appointment.id.substring(0, 8).toUpperCase()}</p>
             <p className="text-xs text-slate-500 mt-2 italic font-serif">Consultation Fee: ${appointment.fee} (Paid)</p>
          </div>
          <div className="text-center w-56">
            <div className="border-b-2 border-slate-200 h-10 mb-2"></div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Doctor&apos;s Signature</p>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body {
            background: white !important;
            padding: 0 !important;
          }
          .min-h-screen {
            min-height: 0 !important;
          }
          .py-12 {
            padding: 0 !important;
          }
          #prescription-document {
            box-shadow: none !important;
            border-radius: 0 !important;
            border-top: none !important;
            min-height: 100vh;
            width: 100vw;
            padding: 2cm !important;
          }
        }
      `}</style>
    </div>
  );
}
