'use client';

import React, { useState } from 'react';
import { FlaskConical, Search, Plus, TestTube2, Microscope, Dna, FileText, CheckCircle2, AlertCircle, X, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarcodeScanner } from '@/components/BarcodeScanner';

interface LabTest {
  id: string;
  patient_id: string;
  test_name: string;
  category: string;
  status: 'pending' | 'completed';
  amount: number;
  date: string;
}

export default function DiagnosticsPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  const [tests, setTests] = useState<LabTest[]>([
    { id: 'LAB-9001', patient_id: 'P-1002', test_name: 'Complete Blood Count', category: 'Blood Tests', status: 'completed', amount: 500, date: '2026-05-12' },
    { id: 'LAB-9002', patient_id: 'P-1005', test_name: 'Chest X-Ray', category: 'Radiology', status: 'pending', amount: 1500, date: '2026-05-13' }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [formData, setFormData] = useState({ patient_id: '', test_name: '', category: 'Blood Tests', amount: '' });

  const categories = [
    { name: 'Blood Tests', icon: TestTube2, count: tests.filter(t => t.category === 'Blood Tests').length },
    { name: 'Radiology', icon: Microscope, count: tests.filter(t => t.category === 'Radiology').length },
    { name: 'Genetic', icon: Dna, count: tests.filter(t => t.category === 'Genetic').length },
  ];

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.test_name && formData.patient_id) {
      const newTest: LabTest = {
        id: 'LAB-' + Math.floor(Math.random() * 9000 + 1000),
        patient_id: formData.patient_id,
        test_name: formData.test_name,
        category: formData.category,
        status: 'pending',
        amount: Number(formData.amount),
        date: new Date().toISOString().split('T')[0]
      };
      setTests([newTest, ...tests]);
      setShowForm(false);
      setFormData({ patient_id: '', test_name: '', category: 'Blood Tests', amount: '' });
    }
  };

  const filteredTests = tests.filter(t => {
    if (activeCategory && t.category !== activeCategory) return false;
    if (search && !t.id.toLowerCase().includes(search.toLowerCase()) && !t.patient_id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen relative">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical size={28} className="text-primary" />
            <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic">Diagnostics Lab</h1>
          </div>
          <p className="text-slate-500 font-medium">Laboratory tests, radiology reports and diagnostic management</p>
        </div>
        <button 
          onClick={handleAddTest}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          <Plus size={20} />
          <span>New Lab Test</span>
        </button>
      </header>

      {showScanner && (
        <BarcodeScanner 
          onResult={(result) => {
            setFormData({...formData, patient_id: result});
            setShowScanner(false);
          }} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowForm(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase mb-6">New Lab Test</h2>
            <form onSubmit={handleAddTest} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Patient ID / Scan Barcode</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" required
                    className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.patient_id} onChange={e => setFormData({...formData, patient_id: e.target.value})}
                    placeholder="Scan barcode or type ID"
                    autoFocus
                  />
                  <button 
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors p-1"
                  >
                    <Camera size={20} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Test Name</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.test_name} onChange={e => setFormData({...formData, test_name: e.target.value})}
                  placeholder="e.g. Complete Blood Count"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Category</label>
                  <select 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="Blood Tests">Blood Tests</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Genetic">Genetic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Fees (₹)</label>
                  <input 
                    type="number" required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-4 hover:bg-slate-800 transition-colors">
                Save & Generate Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-800 block uppercase tracking-widest text-xs">Categories</h3>
               {activeCategory && <button onClick={() => setActiveCategory(null)} className="text-[10px] text-primary font-bold">Clear</button>}
             </div>
             <nav className="space-y-1">
                {categories.map(cat => (
                  <button 
                    key={cat.name} 
                    onClick={() => setActiveCategory(cat.name)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 group",
                      activeCategory === cat.name ? "bg-primary/5 text-primary" : "hover:text-primary"
                    )}
                  >
                    <div className="flex items-center gap-3 font-bold text-sm italic">
                      <cat.icon size={16} className={cn(activeCategory === cat.name ? "text-primary" : "text-slate-400 group-hover:text-primary")} />
                      {cat.name}
                    </div>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-black text-slate-400">{cat.count}</span>
                  </button>
                ))}
             </nav>
           </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col p-8">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Clinical Laboratory</h2>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search Test ID or Patient ID..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
            </div>

            {filteredTests.length > 0 ? (
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Test ID</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Patient ID</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Test Name</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Fees (₹)</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 italic transition-all">
                      {filteredTests.map((test) => (
                        <tr key={test.id} className="hover:bg-slate-50/50 group transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600 flex items-center gap-2">
                             <FileText size={14} className="text-slate-400" /> {test.id}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{test.patient_id}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{test.test_name}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 font-medium">{test.date}</td>
                          <td className="px-6 py-4 font-black tracking-tighter text-slate-700">₹{test.amount}</td>
                          <td className="px-6 py-4">
                            <div className={cn(
                              "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit border",
                              test.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                            )}>
                              {test.status === 'completed' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                              {test.status}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                 <FlaskConical size={64} className="mb-4 opacity-10 text-slate-500" />
                 <p className="text-slate-400 font-bold italic mb-2">No tests found matching your criteria.</p>
                 <button onClick={handleAddTest} className="text-primary font-bold hover:underline text-sm">Add a new test record</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
