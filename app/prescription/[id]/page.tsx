"use client";

import { use, useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import Barcode from "react-barcode";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PrescriptionPage(props: PageProps) {
  const params = use(props.params);
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hospitalInfo, setHospitalInfo] = useState({
    name: "MedCore Hospital",
    phone: "+1 234 567 8900",
    email: "contact@medcore.com",
    address: "123 Health Avenue, Medical District, Cityville, State 12345"
  });
  
  useEffect(() => {
    // Load hospital info
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hospital_settings');
      if (stored) {
        setHospitalInfo({ ...hospitalInfo, ...JSON.parse(stored) });
      }
    }

    async function fetchAppointment() {
      // First get the appointment
      const { data: aptData, error: aptError } = await supabase
        .from('appointments')
        .select('*, patients(*), doctors(*)')
        .eq('id', params.id)
        .single();
        
      console.log("Appointment Data:", aptData);
      console.log("Appointment Error:", aptError);
        
      if (!aptError && aptData) {
        setAppointment({
          id: aptData.appointment_id,
          // Handle object or array formats of patients/doctors properly
          patientName: Array.isArray(aptData.patients) ? aptData.patients[0]?.full_name : aptData.patients?.full_name,
          patientAge: (Array.isArray(aptData.patients) ? aptData.patients[0]?.age : aptData.patients?.age) || "-",
          patientGender: (Array.isArray(aptData.patients) ? aptData.patients[0]?.gender : aptData.patients?.gender) || "-",
          patientReg: (Array.isArray(aptData.patients) ? aptData.patients[0]?.patient_id : aptData.patients?.patient_id),
          date: aptData.appointment_date,
          doctorName: Array.isArray(aptData.doctors) ? aptData.doctors[0]?.full_name : aptData.doctors?.full_name,
          doctorQualification: (Array.isArray(aptData.doctors) ? aptData.doctors[0]?.qualifications : aptData.doctors?.qualifications) || "MBBS",
          doctorSpeciality: (Array.isArray(aptData.doctors) ? aptData.doctors[0]?.speciality : aptData.doctors?.speciality),
          fee: (Array.isArray(aptData.doctors) ? aptData.doctors[0]?.fee : aptData.doctors?.fee) || 50,
        });
      } else {
         console.error("Error fetching appointment from supabase:", aptError);
      }
      setLoading(false);
    }
    fetchAppointment();
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>Appointment not found.</p>
        <Link href="/appointments" className={cn(buttonVariants())}>Return to Appointments</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white pb-12">
      <div className="max-w-[21cm] mx-auto pt-6 px-4 mb-4 flex justify-between items-center print:hidden">
        <Link href="/appointments" className={cn(buttonVariants({ variant: "ghost" }))}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Appointments
        </Link>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Prescription
        </Button>
      </div>

      <div className="p-8 max-w-[21cm] mx-auto bg-white min-h-[29.7cm] border shadow-sm print:border-none print:shadow-none print:m-0 flex flex-col relative text-black">
        {/* Header Region */}
        <div className="flex justify-between items-start border-b-2 border-primary pb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-primary">{hospitalInfo.name}</h1>
            <p className="text-sm mt-1 text-gray-600 whitespace-pre-wrap">{hospitalInfo.address}</p>
            <p className="text-sm text-gray-600">Phone: {hospitalInfo.phone}</p>
            <p className="text-sm text-gray-600">{hospitalInfo.email}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">{appointment.doctorName}</h2>
            <p className="text-sm font-semibold text-gray-700">{appointment.doctorQualification}</p>
            <p className="text-sm text-gray-600">{appointment.doctorSpeciality}</p>
          </div>
        </div>
        
        {/* Patient Details Region */}
        <div className="flex justify-between items-center py-4 border-b border-gray-200 shrink-0">
          <div className="flex gap-8">
            <p className="text-sm"><span className="font-semibold text-gray-500">Patient:</span> {appointment.patientName}</p>
            <p className="text-sm"><span className="font-semibold text-gray-500">Age/Sex:</span> {appointment.patientAge} Y / {appointment.patientGender}</p>
          </div>
          <div className="flex gap-8">
            <p className="text-sm"><span className="font-semibold text-gray-500">Reg No:</span> {appointment.patientReg}</p>
            <p className="text-sm"><span className="font-semibold text-gray-500">Date:</span> {appointment.date}</p>
          </div>
        </div>

        {/* Barcode Region */}
        <div className="flex justify-center py-2 shrink-0">
           {appointment.patientReg && (
             <Barcode 
               value={appointment.patientReg} 
               width={1.5} 
               height={40} 
               fontSize={14} 
               margin={0} 
               displayValue={true} 
             />
           )}
        </div>

        {/* Doctor Note Section (White area) */}
        <div className="mt-4 flex gap-6 flex-1 relative min-h-[500px]">
          <div className="w-1/3 border-r border-gray-200 pr-6 shrink-0 pt-2">
            <h3 className="font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-6">Patient Vitals</h3>
            <div className="space-y-6">
              <div>
                <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">BP</p>
                <div className="border-b border-dashed border-gray-300 mt-4 h-4"></div>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">Pulse</p>
                <div className="border-b border-dashed border-gray-300 mt-4 h-4"></div>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">Weight (kg)</p>
                <div className="border-b border-dashed border-gray-300 mt-4 h-4"></div>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">Temp (°F)</p>
                <div className="border-b border-dashed border-gray-300 mt-4 h-4"></div>
              </div>
            </div>

            <h3 className="font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-6 mt-12">Complaints / Hx</h3>
            <div className="space-y-6">
              <div className="border-b border-dashed border-gray-300 mt-4 h-4"></div>
              <div className="border-b border-dashed border-gray-300 mt-4 h-4"></div>
              <div className="border-b border-dashed border-gray-300 mt-4 h-4"></div>
            </div>
          </div>
          
          <div className="w-2/3 pl-2 pt-2 relative">
            <div className="absolute top-2 left-2 text-6xl font-serif text-gray-200 pointer-events-none select-none">
              ℞
            </div>
            {/* Blank space for handwritten notes */}
            <div className="pt-20 space-y-12">
               {/* Just leaving empty space */}
            </div>
          </div>
        </div>
        
        {/* Footer Area */}
        <div className="mt-8 pt-8 border-t border-gray-200 flex justify-between items-end text-sm text-gray-500 shrink-0">
          <div>
             <p className="mb-2">Appointment ID: {appointment.id}</p>
             <p>Consultation Fee: <span className="font-medium text-gray-700">${appointment.fee}</span> (Paid)</p>
          </div>
          <div className="text-center w-48">
            <div className="border-b border-gray-400 h-10 mb-2"></div>
            <p>Doctor's Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
