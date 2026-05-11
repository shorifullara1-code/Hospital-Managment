'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  LayoutDashboard, 
  IdCard, 
  Settings, 
  Activity,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Patients', icon: Users, href: '/patients' },
  { name: 'ID Cards', icon: IdCard, href: '/id-cards' },
  { name: 'Appointments', icon: ClipboardList, href: '/appointments' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 h-screen fixed left-0 top-0 text-slate-300 flex flex-col no-print">
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <Activity size={20} />
        </div>
        <span className="font-black text-white tracking-tighter text-xl">MEDCORE</span>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={20} className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
              <span className="font-bold text-sm">{item.name}</span>
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Status</p>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            System Live
          </div>
        </div>
      </div>
    </aside>
  );
}
