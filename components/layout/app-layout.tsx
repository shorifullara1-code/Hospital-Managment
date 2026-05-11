'use client'

import React, { useState, useEffect } from 'react';
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30 print:bg-white text-foreground print:text-black">
      <div className="flex flex-1 overflow-hidden print:overflow-visible">
        <Sidebar className="hidden md:flex" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 print:p-0 print:overflow-visible">
          <Header />
          <div className="mt-6 print:mt-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
