'use client';

import React from 'react';
import { FlaskConical, Search, Plus, TestTube2, Microscope, Dna } from 'lucide-react';

export default function DiagnosticsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical size={28} className="text-primary" />
            <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic">Diagnostics Lab</h1>
          </div>
          <p className="text-slate-500 font-medium">Laboratory tests, radiology reports and diagnostic management</p>
        </div>
        <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all">
          <Plus size={20} />
          <span>New Lab Test</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-4 block uppercase tracking-widest text-xs">Categories</h3>
             <nav className="space-y-1">
                {[
                  { name: 'Blood Tests', icon: TestTube2, count: 12 },
                  { name: 'Radiology', icon: Microscope, count: 5 },
                  { name: 'Genetic', icon: Dna, count: 2 },
                ].map(cat => (
                  <button key={cat.name} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 hover:text-primary group">
                    <div className="flex items-center gap-3 font-bold text-sm italic">
                      <cat.icon size={16} className="text-slate-400 group-hover:text-primary" />
                      {cat.name}
                    </div>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-black text-slate-400">{cat.count}</span>
                  </button>
                ))}
             </nav>
           </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col items-center justify-center text-slate-300 p-12 text-center">
            <FlaskConical size={64} className="mb-4 opacity-10" />
            <h2 className="text-xl font-black text-slate-400 uppercase tracking-tight">Clinical Laboratory</h2>
            <p className="max-w-xs mt-2 font-medium text-slate-400">Search for a patient or test ID to view clinical diagnostic reports.</p>
            <div className="mt-8 w-full max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" 
                  placeholder="Test ID or Patient ID..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
