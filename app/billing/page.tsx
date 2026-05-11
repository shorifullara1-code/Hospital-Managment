'use client';

import React from 'react';
import { CreditCard, Plus, Receipt, Clock } from 'lucide-react';

export default function BillingPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <CreditCard size={28} className="text-primary" />
            <h1 className="text-3xl font-black text-slate-800 tracking-tight text-shadow-sm uppercase italic">Billing & Payments</h1>
          </div>
          <p className="text-slate-500 font-medium">Manage invoices, insurance claims, and hospital accounts</p>
        </div>
        <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
          <Plus size={20} />
          <span>New Invoice</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-3xl font-black text-slate-800 tracking-tighter">₹4,25,000</p>
          <p className="text-[10px] text-emerald-500 font-bold mt-2">+12.5% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pending Dues</p>
          <p className="text-3xl font-black text-slate-800 tracking-tighter">₹84,200</p>
          <p className="text-[10px] text-amber-500 font-bold mt-2">12 Invoices Overdue</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Insurance Claims</p>
          <p className="text-3xl font-black text-slate-800 tracking-tighter">42 Active</p>
          <p className="text-[10px] text-slate-400 font-bold mt-2">8 processed today</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Receipt size={18} className="text-slate-400" />
            Recent Invoices
          </h2>
        </div>
        <div className="p-12 text-center text-slate-300">
          <div className="flex flex-col items-center gap-4">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <Clock size={32} />
             </div>
             <p className="font-bold text-slate-400">Bill records will appear here after patients are discharged.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
