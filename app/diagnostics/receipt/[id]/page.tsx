"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReceiptView(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [labData, setLabData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testPrice, setTestPrice] = useState(0);
  const [hospitalInfo, setHospitalInfo] = useState({
    name: "MedCore Hospital",
    phone: "+1 234 567 8900",
    email: "contact@medcore.com",
    address: "123 Health Avenue, Medical District, Cityville, State 12345",
    logo: ""
  });
  
  useEffect(() => {
    const fetchHospitalInfo = async () => {
      const { data, error } = await supabase.from('hospital_settings').select('*').eq('id', 1).single();
      if (data) {
        setHospitalInfo(prev => ({ ...prev, ...data }));
        // Cache locally
        if (typeof window !== 'undefined') localStorage.setItem('hospital_settings', JSON.stringify(data));
      } else {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('hospital_settings');
          if (stored) {
            try {
              setHospitalInfo(prev => ({ ...prev, ...JSON.parse(stored) }));
            } catch (e) {}
          }
        }
      }
    };
    fetchHospitalInfo();

    const fetchReceipt = async () => {
      const { data, error } = await supabase
        .from("diagnostics_labs")
        .select("*, patients(*), doctors(*)")
        .eq("id", params.id)
        .single();
        
      if (data) {
        setLabData(data);
        
        // Find price
        let price = 50; // Default
        const storedCatalog = localStorage.getItem('diag_catalog');
        if (storedCatalog) {
           const catalog = JSON.parse(storedCatalog);
           const test = catalog.find((t: any) => t.name === data.test_name);
           if (test) {
              price = test.price;
           }
        }
        setTestPrice(price);
      }
      setLoading(false);
    };
    
    fetchReceipt();
  }, [params.id]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!labData) {
    return <div className="p-8 text-center text-red-500 font-medium">Receipt not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 print:py-0 print:bg-white text-black">
      <div className="w-full max-w-[21cm] flex justify-end mb-4 print:hidden">
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> Print Receipt
        </Button>
      </div>

      <div className="p-8 max-w-[21cm] w-full bg-white border shadow-sm print:border-none print:shadow-none print:m-0 flex flex-col relative text-black">
        {/* Header Region */}
        <div className="flex justify-between items-start border-b-2 border-primary pb-6 shrink-0">
          <div className="flex gap-4 items-start">
            {hospitalInfo.logo && (
              <img src={hospitalInfo.logo} alt="Logo" className="w-20 h-20 object-contain" />
            )}
            <div>
              <h1 className="text-3xl font-bold text-primary">{hospitalInfo.name}</h1>
              <p className="text-sm mt-1 text-gray-600 whitespace-pre-wrap">{hospitalInfo.address}</p>
              <p className="text-sm text-gray-600">Phone: {hospitalInfo.phone}</p>
              <p className="text-sm text-gray-600">{hospitalInfo.email}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest">RECEIPT</h2>
            <p className="text-sm font-bold text-gray-600 mt-2">Date: {new Date().toLocaleDateString()}</p>
             <p className="text-sm text-gray-600">Receipt No: RCPT-{labData.test_id}</p>
          </div>
        </div>

        {/* Info Region */}
        <div className="flex justify-between border-b border-gray-200 py-6 mb-6 shrink-0 text-sm">
          <div className="space-y-1">
            <p className="font-bold text-gray-500 uppercase tracking-wider text-xs mb-2">Billed To</p>
            <p className="font-bold text-gray-900 text-lg">{labData.patients?.full_name}</p>
            <p className="text-gray-700">Patient ID: {labData.patients?.patient_id}</p>
            <p className="text-gray-700">Age/Gender: {labData.patients?.age} / {labData.patients?.gender}</p>
            <p className="text-gray-700">Phone: {labData.patients?.phone}</p>
          </div>
          <div className="space-y-1 text-right">
             <p className="font-bold text-gray-500 uppercase tracking-wider text-xs mb-2">Referred By</p>
             <p className="font-bold text-gray-900 text-lg">{labData.doctors?.full_name}</p>
             <p className="text-gray-700">{labData.doctors?.speciality}</p>
          </div>
        </div>

        {/* Content Region */}
        <div className="flex-grow">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="border-b border-gray-300">
                 <th className="py-3 font-semibold text-gray-700 uppercase tracking-wider text-xs">Description</th>
                 <th className="py-3 font-semibold text-gray-700 uppercase tracking-wider text-xs">Category</th>
                 <th className="py-3 font-semibold text-gray-700 uppercase tracking-wider text-xs text-right">Amount</th>
               </tr>
             </thead>
             <tbody>
               <tr className="border-b border-gray-100">
                 <td className="py-4 font-medium text-gray-900">
                    {labData.test_name}
                    <div className="text-xs text-gray-500 mt-1">Test Date: {labData.test_date}</div>
                 </td>
                 <td className="py-4 text-gray-700">{labData.category}</td>
                 <td className="py-4 text-right font-medium text-gray-900">${testPrice}</td>
               </tr>
             </tbody>
           </table>
           
           <div className="flex justify-end mt-8 border-t border-gray-200 pt-6">
              <div className="w-1/2">
                 <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Subtotal</span>
                    <span className="font-medium text-gray-900">${testPrice}</span>
                 </div>
                 <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Discount</span>
                    <span className="font-medium text-gray-900">$0</span>
                 </div>
                 <div className="flex justify-between py-4 mt-2">
                    <span className="text-xl font-bold text-gray-900 tracking-tight">Total Paid</span>
                    <span className="text-xl font-bold text-primary">${testPrice}</span>
                 </div>
              </div>
           </div>
        </div>
        
        {/* Footer Area */}
        <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between items-end text-sm text-gray-500 shrink-0">
          <div>
             <p className="mb-2">Payment Method: Cash/Card</p>
             <p>Thank you for choosing {hospitalInfo.name}.</p>
          </div>
          <div className="text-center w-48">
            <div className="border-b border-gray-400 h-10 mb-2"></div>
            <p>Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
