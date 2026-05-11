'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from './supabase';

interface StaffUser {
  id: string;
  username: string;
  full_name: string;
  role: 'Admin' | 'Staff';
  permissions: string[];
}

interface AuthContextType {
  user: StaffUser | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (section: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const dummyAdmin: StaffUser = {
  id: 'mock-admin-id',
  username: 'admin',
  full_name: 'Administrator',
  role: 'Admin',
  permissions: ['diagnostics', 'billing', 'settings']
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(dummyAdmin);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // No-op since we removed login
  }, [pathname, router]);

  const login = async (username: string, password: string) => {
    setUser(dummyAdmin);
    router.push('/');
    return { success: true };
  };

  const logout = () => {
    // Normally would clear state, but we are bypassing login
    router.push('/');
  };

  const hasPermission = (section: string) => {
    return true; // Grant all permissions
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
