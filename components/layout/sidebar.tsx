"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  BadgeIcon
} from "lucide-react";

const sidebarLinks = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Doctors", href: "/doctors", icon: Stethoscope },
  { name: "Diagnostics", href: "/diagnostics", icon: Activity },
  { name: "ID Cards", href: "/id-cards", icon: BadgeIcon },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside className={cn("w-64 border-r bg-muted/30", className)}>
      <div className="flex h-16 items-center px-6 border-b">
        <Activity className="h-6 w-6 text-primary mr-2" />
        <span className="font-bold text-lg">MedCore</span>
      </div>
      <div className="py-4">
        <nav className="space-y-1 px-2">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <link.icon className="h-4 w-4 mr-3" />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
