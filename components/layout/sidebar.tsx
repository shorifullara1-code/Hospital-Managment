"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  Activity,
  FileText,
  Settings,
  CreditCard,
  Building2,
  LogOut,
  Cross
} from "lucide-react";

const sidebarLinks = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Doctors", href: "/doctors", icon: Stethoscope },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Pharmacy", href: "/pharmacy", icon: Activity },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Lab Tests", href: "/diagnostics", icon: Activity },
  { name: "IPD Patients", href: "/ipd", icon: Building2 }, // Changed from Wards to IPD Patients
  { name: "Activity Logs", href: "/billing?tab=logs", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [hospitalName, setHospitalName] = useState("CityGeneral");
  const [hospitalLogo, setHospitalLogo] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('hospital_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.name) setHospitalName(parsed.name);
        if (parsed.logo) setHospitalLogo(parsed.logo);
      } catch (e) {}
    }
    
    // Also fetch from supabase to be sure
    const fetchSettings = async () => {
      const { data } = await supabase.from('hospital_settings').select('name, logo').eq('id', 1).single();
      if (data) {
        if (data.name) setHospitalName(data.name);
        if (data.logo) setHospitalLogo(data.logo);
      }
    };
    fetchSettings();
  }, []);

  return (
    <aside className={cn("w-64 flex flex-col bg-[#052A24] text-white", className)}>
      <div className="flex h-16 items-center px-6 gap-3">
        <div className="bg-[#15D1A6] p-1.5 rounded-lg overflow-hidden flex items-center justify-center min-w-8 min-h-8">
          {hospitalLogo ? (
            <img src={hospitalLogo} alt="Logo" className="h-6 w-6 object-contain" />
          ) : (
            <Cross className="h-5 w-5 text-[#052A24]" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm leading-none">{hospitalName}</span>
          <span className="text-[10px] text-teal-200 opacity-70">Hospital System</span>
        </div>
      </div>
      
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-4">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                  isActive
                    ? "bg-[#15D1A6]/10 text-white"
                    : "text-teal-100/60 hover:bg-[#15D1A6]/5 hover:text-white"
                )}
              >
                <link.icon className={cn("h-4 w-4 mr-3", isActive ? "text-[#15D1A6]" : "text-inherit")} />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-teal-900/50">
        <button 
          className="flex items-center px-3 py-2 w-full text-sm font-medium text-teal-100/60 hover:text-white transition-colors"
          onClick={() => console.log("Logout")}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Logout
        </button>
      </div>
    </aside>
  );
}
