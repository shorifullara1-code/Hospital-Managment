"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Printer, Loader2, QrCode } from "lucide-react";
import Barcode from 'react-barcode';
import { useReactToPrint } from "react-to-print";

type Patient = {
  id: string;
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  blood_group: string;
  phone: string;
  address: string;
};

function IdCardContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState("MedCore Hospital");
  const [hospitalAddress, setHospitalAddress] = useState("123 Health Ave, Medical City.");
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: patient ? `ID_Card_${patient.patient_id}` : 'ID_Card',
  });

  useEffect(() => {
     // Load hospital settings
     const stored = localStorage.getItem('hospital_settings');
     if (stored) {
       try {
         const parsed = JSON.parse(stored);
         if (parsed.name) setHospitalName(parsed.name);
         if (parsed.address) setHospitalAddress(parsed.address);
       } catch (e) {}
     }
     
     const fetchSettings = async () => {
        const { data } = await supabase.from('hospital_settings').select('name, address').eq('id', 1).single();
        if (data) {
           if (data.name) setHospitalName(data.name);
           if (data.address) setHospitalAddress(data.address);
        }
     };
     fetchSettings();
  }, []);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setErrorInfo(null);
    setPatient(null);

    // Search by patient_id or phone
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .or(`patient_id.eq.${query},phone.eq.${query},full_name.ilike.%${query}%`)
      .limit(1)
      .single();

    if (error || !data) {
      setErrorInfo(error?.message || "No patient found with this ID, Phone, or Name.");
    } else {
      setPatient(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    performSearch(searchQuery);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto align-middle justify-center p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate ID Card</h1>
          <p className="text-muted-foreground">
            Search patient by ID, Phone Number or Name to generate and print ID Card.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Patient</CardTitle>
          <CardDescription>Enter patient details or scan barcode to retrieve information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter Patient ID (e.g. PT-12345) or Phone Number..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <Button type="submit" disabled={loading || !searchQuery.trim()}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </form>
          {errorInfo && (
            <div className="mt-4 p-4 text-sm text-red-600 bg-red-50 rounded-md">
              {errorInfo}
            </div>
          )}
        </CardContent>
      </Card>

      {patient && (
        <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-end w-full max-w-[350px]">
             <Button onClick={() => handlePrint()} className="w-full">
               <Printer className="mr-2 h-4 w-4" />
               Print ID Card
             </Button>
          </div>

          {/* ID Card Print Component */}
          <div className="border rounded-xl shadow-lg bg-white overflow-hidden" style={{ width: "350px", minHeight: "500px" }} ref={componentRef}>
            {/* Header */}
            <div className="bg-primary p-4 text-center text-primary-foreground border-b-4 border-primary/20">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-bold text-xl tracking-tight">{hospitalName}</h2>
              <p className="text-xs opacity-90 uppercase tracking-widest mt-1">Patient Identity Card</p>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col items-center">
               <div className="w-24 h-24 bg-muted rounded-md mb-4 border-2 border-muted overflow-hidden flex items-center justify-center shadow-inner">
                  <span className="text-muted-foreground text-xs uppercase font-medium">No Photo</span>
               </div>
               
               <h3 className="font-bold text-2xl text-center text-gray-900 mb-1">{patient.full_name}</h3>
               <p className="text-primary font-bold tracking-widest mb-6">ID: {patient.patient_id}</p>

               <div className="w-full grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                 <div>
                   <p className="text-gray-500 text-xs uppercase font-semibold">Age</p>
                   <p className="font-medium text-gray-900">{patient.age ? `${patient.age} Yrs` : "N/A"}</p>
                 </div>
                 <div>
                   <p className="text-gray-500 text-xs uppercase font-semibold">Gender</p>
                   <p className="font-medium text-gray-900">{patient.gender || "N/A"}</p>
                 </div>
                 <div>
                   <p className="text-gray-500 text-xs uppercase font-semibold">Blood Group</p>
                   <p className="font-bold text-red-600">{patient.blood_group || "N/A"}</p>
                 </div>
                 <div>
                   <p className="text-gray-500 text-xs uppercase font-semibold">Phone</p>
                   <p className="font-medium text-gray-900">{patient.phone || "N/A"}</p>
                 </div>
                 <div className="col-span-2">
                   <p className="text-gray-500 text-xs uppercase font-semibold">Address</p>
                   <p className="font-medium text-gray-900 truncate">{patient.address || "- -"}</p>
                 </div>
               </div>

               <div className="mt-8 gap-0 mb-4 w-full flex flex-col justify-center items-center">
                  <Barcode value={patient.patient_id} format="CODE128" width={2.0} height={40} displayValue={true} background="transparent" />
               </div>
               <p className="text-[10px] text-gray-500 text-center w-full mt-2">
                 If found, please return to {hospitalName}. <br/>
                 {hospitalAddress}
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IdCardPage() {
  return (
    <Suspense fallback={<div className="flex w-full h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <IdCardContent />
    </Suspense>
  )
}
