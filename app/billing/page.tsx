'use client';

import React, { useState } from 'react';
import { CreditCard, Plus, Receipt, Clock, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Invoice {
  id: string;
  patientName: string;
  amount: number;
  status: 'paid' | 'pending';
  date: string;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: 'INV-1001', patientName: 'John Doe', amount: 4500, status: 'paid', date: '2026-05-12' },
    { id: 'INV-1002', patientName: 'Mary Smith', amount: 12000, status: 'pending', date: '2026-05-13' }
  ]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ patientName: '', amount: '', status: 'pending' as const, date: '' });

  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if(formData.patientName && formData.amount) {
      const newInvoice: Invoice = {
        id: 'INV-' + Math.floor(Math.random() * 9000 + 1000),
        patientName: formData.patientName,
        amount: Number(formData.amount),
        status: formData.status,
        date: formData.date || new Date().toISOString().split('T')[0]
      };
      setInvoices([newInvoice, ...invoices]);
      setShowForm(false);
      setFormData({ patientName: '', amount: '', status: 'pending', date: '' });
    }
  };

  const markPaid = (id: string) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: 'paid' } : inv));
  };

  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((acc, inv) => acc + inv.amount, 0);
  const pendingDues = invoices.filter(inv => inv.status === 'pending').reduce((acc, inv) => acc + inv.amount, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen relative">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <CreditCard size={28} className="text-primary" />
            <h1 className="text-3xl font-black text-slate-800 tracking-tight text-shadow-sm uppercase italic">Billing & Payments</h1>
          </div>
          <p className="text-slate-500 font-medium">Manage invoices, insurance claims, and hospital accounts</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          <Plus size={20} />
          <span>New Invoice</span>
        </button>
      </header>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowForm(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase mb-6">Create Invoice</h2>
            <form onSubmit={handleAddInvoice} className="space-y-4">
               <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Patient Name</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Amount (₹)</label>
                <input 
                  type="number" required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Status</label>
                <select 
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'paid' | 'pending'})}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Date</label>
                <input 
                  type="date"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-4 hover:bg-slate-800 transition-colors">
                Generate Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-3xl font-black text-slate-800 tracking-tighter">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pending Dues</p>
          <p className="text-3xl font-black text-slate-800 tracking-tighter">₹{pendingDues.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Invoices</p>
          <p className="text-3xl font-black text-slate-800 tracking-tighter">{invoices.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Receipt size={18} className="text-slate-400" />
            Recent Invoices
          </h2>
        </div>
        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice ID</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Patient</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount (₹)</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 italic transition-all">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 group transition-colors">
                    <td className="px-8 py-5 font-mono text-xs font-bold text-slate-600">{inv.id}</td>
                    <td className="px-8 py-5 font-bold text-slate-800">{inv.patientName}</td>
                    <td className="px-8 py-5 text-sm text-slate-500 font-medium">{inv.date}</td>
                    <td className="px-8 py-5 font-black tracking-tighter">₹{inv.amount.toLocaleString()}</td>
                    <td className="px-8 py-5">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit border",
                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                      )}>
                        {inv.status}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {inv.status === 'pending' && (
                        <button 
                          onClick={() => markPaid(inv.id)}
                          className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 justify-end ml-auto"
                        >
                          <Check size={14} /> Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-300">
            <div className="flex flex-col items-center gap-4">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                  <Clock size={32} />
               </div>
               <p className="font-bold text-slate-400">Bill records will appear here after patients are discharged.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
