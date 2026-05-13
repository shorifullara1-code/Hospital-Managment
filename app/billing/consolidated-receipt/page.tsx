"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

function ReceiptContent() {
  const [labDataList, setLabDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hospitalInfo, setHospitalInfo] = useState({
    name: "MedCore Hospital",
    phone: "+1 234 567 8900",
    email: "contact@medcore.com",
    address: "123 Health Avenue, Medical District, Cityville, State 12345",
    logo: ""
  });
  
  const searchParams = useSearchParams();

  useEffect(() => {
    let isCancelled = false;
    
    const fetchHospitalInfo = async () => {
      const { data, error } = await supabase.from('hospital_settings').select('*').eq('id', 1).single();
      if (!isCancelled) {
        if (data) {
          setHospitalInfo(prev => ({ ...prev, ...data }));
          try { localStorage.setItem('hospital_settings', JSON.stringify(data)); } catch (e) {}
        } else {
          try {
            const stored = localStorage.getItem('hospital_settings');
            if (stored) setHospitalInfo(prev => ({ ...prev, ...JSON.parse(stored) }));
          } catch(e) {}
        }
      }
    };
    fetchHospitalInfo();

    const fetchReceipts = async () => {
      const idsParam = searchParams.get("ids");
      if (!idsParam) {
        setLoading(false);
        return;
      }
      
      const idsArray = idsParam.split(",").filter(id => id.trim().length > 0);
      if (idsArray.length === 0) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("diagnostics_labs")
        .select("*, patients(*), doctors(*)")
        .in("id", idsArray);
        
      if (data && !isCancelled) {
        const storedCatalog = localStorage.getItem('diag_catalog');
        const catalog = storedCatalog ? JSON.parse(storedCatalog) : [];
        const paidStorage = localStorage.getItem('diag_paid_labs');
        const parsedPaid = paidStorage ? JSON.parse(paidStorage) : {};
        
        const enhancedData = data.map(lab => {
          // Find price
          let price = 50; // Default
          const test = catalog.find((t: any) => t.name === lab.test_name);
          if (test) {
            price = test.price;
          }
          
          let pAmount = price;
          if (parsedPaid[lab.id] === true) {
             pAmount = price;
          } else if (parsedPaid[lab.id] !== undefined) {
             pAmount = Number(parsedPaid[lab.id]);
          } else {
             pAmount = 0;
          }
          
          return {
             ...lab,
             testPrice: price,
             paidAmount: pAmount,
          };
        });
        
        setLabDataList(enhancedData);
      }
      if (!isCancelled) {
        setLoading(false);
      }
    };
    
    fetchReceipts();
    return () => { isCancelled = true; };
  }, [searchParams]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (labDataList.length === 0) {
    return <div className="p-8 text-center text-red-500 font-medium">Receipts not found</div>;
  }

  const patient = labDataList[0].patients;
  const primaryDoctor = labDataList[0].doctors;
  const totalSubtotal = labDataList.reduce((sum, item) => sum + item.testPrice, 0);
  const totalPaid = labDataList.reduce((sum, item) => sum + item.paidAmount, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 print:py-0 print:bg-white text-black">
      <div className="w-full max-w-[21cm] flex justify-end mb-4 print:hidden">
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> Print Consolidate Receipt
        </Button>
      </div>

      <div className="p-8 max-w-[21cm] w-full bg-white border shadow-sm print:border-none print:shadow-none print:m-0 flex flex-col relative text-black">
        {/* Header Region */}
        <div className="flex justify-between items-start border-b-2 border-primary pb-6 shrink-0">
          <div className="flex gap-4 items-start">
            {hospitalInfo.logo && (
              // eslint-disable-next-line @next/next/no-img-element
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
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest leading-tight">CONSOLIDATED<br/>RECEIPT</h2>
            <p className="text-sm font-bold text-gray-600 mt-2">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Info Region */}
        <div className="flex justify-between border-b border-gray-200 py-6 mb-6 shrink-0 text-sm">
          <div className="space-y-1">
            <p className="font-bold text-gray-500 uppercase tracking-wider text-xs mb-2">Billed To</p>
            <p className="font-bold text-gray-900 text-lg">{patient?.full_name || 'N/A'}</p>
            <p className="text-gray-700">Patient ID: {patient?.patient_id || 'N/A'}</p>
            <p className="text-gray-700">Age/Gender: {patient?.age || 'N/A'} / {patient?.gender || 'N/A'}</p>
            <p className="text-gray-700">Phone: {patient?.phone || 'N/A'}</p>
          </div>
          <div className="space-y-1 text-right">
             <p className="font-bold text-gray-500 uppercase tracking-wider text-xs mb-2">Primary Referrer</p>
             <p className="font-bold text-gray-900 text-lg">{primaryDoctor?.full_name || 'Walk-in'}</p>
             <p className="text-gray-700">{primaryDoctor?.speciality || ''}</p>
          </div>
        </div>

        {/* Content Region */}
        <div className="flex-grow">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="border-b border-gray-300">
                 <th className="py-3 font-semibold text-gray-700 uppercase tracking-wider text-xs">Description</th>
                 <th className="py-3 font-semibold text-gray-700 uppercase tracking-wider text-xs">Category</th>
                 <th className="py-3 font-semibold text-gray-700 uppercase tracking-wider text-xs text-right">Price</th>
                 <th className="py-3 font-semibold text-gray-700 uppercase tracking-wider text-xs text-right">Paid</th>
               </tr>
             </thead>
             <tbody>
               {labDataList.map((lab, index) => (
                 <tr key={index} className="border-b border-gray-100">
                   <td className="py-4 font-medium text-gray-900">
                      {lab.test_name}
                      <div className="text-xs text-gray-500 mt-1">Test Date: {lab.test_date} | RCPT-{lab.test_id}</div>
                   </td>
                   <td className="py-4 text-gray-700">{lab.category}</td>
                   <td className="py-4 text-right font-medium text-gray-900">${lab.testPrice}</td>
                   <td className="py-4 text-right text-green-600 font-medium">${lab.paidAmount}</td>
                 </tr>
               ))}
             </tbody>
           </table>
           
           <div className="flex justify-end mt-8 border-t border-gray-200 pt-6">
              <div className="w-1/2">
                 <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Subtotal</span>
                    <span className="font-medium text-gray-900">${totalSubtotal}</span>
                 </div>
                 <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Discount</span>
                    <span className="font-medium text-gray-900">$0</span>
                 </div>
                 <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-bold">Total Paid</span>
                    <span className="font-bold text-green-600">${totalPaid}</span>
                 </div>
                 <div className="flex justify-between py-4 mt-2">
                    <span className="text-xl font-bold text-gray-900 tracking-tight">Remaining Due</span>
                    <span className="text-xl font-bold text-primary">${Math.max(0, totalSubtotal - totalPaid)}</span>
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

export default function ConsolidatedReceiptPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ReceiptContent />
    </Suspense>
  );
}
