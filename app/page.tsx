'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Users, 
  Calendar, 
  Settings, 
  Activity, 
  ClipboardList,
  ArrowRight,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const cards = [
    { 
      title: 'Patients', 
      desc: 'Register and manage patient records', 
      icon: Users, 
      color: 'bg-blue-500', 
      href: '/patients',
      count: '1,280'
    },
    { 
      title: 'Appointments', 
      desc: 'Schedule and track consultations', 
      icon: Calendar, 
      color: 'bg-indigo-500', 
      href: '/appointments',
      count: '42 Today'
    },
    { 
      title: 'Prescriptions', 
      desc: 'View and print prescriptions', 
      icon: ClipboardList, 
      color: 'bg-emerald-500', 
      href: '/reports',
      count: '15 Pending'
    },
    { 
      title: 'Settings', 
      desc: 'Configure hospital profile & data', 
      icon: Settings, 
      color: 'bg-slate-700', 
      href: '/settings',
      count: 'Live Sync'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8 pt-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <Activity size={24} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">MedCore Pro</h1>
          </div>
          <p className="text-slate-500">Welcome back, Dr. Sarah Collins</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={card.href} className="block group">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg", card.color)}>
                    <card.icon size={24} />
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-800">{card.title}</h3>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{card.count}</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">{card.desc}</p>
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    Open Dashboard <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Recent Patient Registrations
              <Link href="/patients" className="text-xs text-primary ml-auto font-bold uppercase tracking-widest hover:underline">View All</Link>
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
               <div className="p-8 text-center text-slate-400">
                  <Link href="/patients" className="flex flex-col items-center gap-4 hover:text-primary transition-colors">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                      <Plus size={32} />
                    </div>
                    <p className="font-semibold">Start with Patient Registration</p>
                  </Link>
               </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Quick Actions</h2>
            <div className="space-y-4">
              <button className="w-full bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 hover:border-primary/50 transition-all text-left shadow-sm hover:shadow-md group">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">New Appointment</p>
                  <p className="text-xs text-slate-500">Book a slot for a patient</p>
                </div>
              </button>
              <button className="w-full bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 hover:border-indigo-500/50 transition-all text-left shadow-sm hover:shadow-md group">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Settings size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Hospital Profile</p>
                  <p className="text-xs text-slate-500">Update contact and address</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
