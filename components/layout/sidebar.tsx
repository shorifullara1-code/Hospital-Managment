"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  Activity,
  Settings,
  FileText,
  CreditCard
} from "lucide-react";

const sidebarLinks = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, section: "dashboard" },
  { name: "Patients", href: "/patients", icon: Users, section: "patients" },
  { name: "Appointments", href: "/appointments", icon: Calendar, section: "appointments" },
  { name: "Doctors", href: "/doctors", icon: Stethoscope, section: "doctors" },
  { name: "Diagnostics", href: "/diagnostics", icon: Activity, section: "diagnostics" },
  { name: "Billing", href: "/billing", icon: CreditCard, section: "billing" },
  { name: "Reports", href: "/reports", icon: FileText, section: "reports" },
  { name: "Settings", href: "/settings", icon: Settings, section: "settings" },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const [hospitalName, setHospitalName] = useState("MedCore");

  useEffect(() => {
    async function fetchName() {
      try {
        const { data, error } = await supabase.from('hospital_settings').select('name').eq('id', 1).single();
        if (data?.name && !error) {
          setHospitalName(data.name);
        }
      } catch (err) {
        console.error("Error fetching hospital name", err);
      }
    }
    fetchName();

    const channel = supabase
      .channel('sidebar_settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'hospital_settings', filter: 'id=eq.1' }, (payload) => {
        if (payload.new.name) setHospitalName(payload.new.name);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <aside className={cn("w-64 border-r bg-muted/30", className)}>
      <div className="flex h-16 items-center border-b px-6">
        <Activity className="h-6 w-6 text-primary mr-2" />
        <span className="font-bold text-lg truncate" title={hospitalName}>{hospitalName}</span>
      </div>
      <div className="py-4">
        <nav className="space-y-1 px-2">
          {sidebarLinks.map((link) => {
            if (!hasPermission(link.section)) return null;
            
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <link.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
