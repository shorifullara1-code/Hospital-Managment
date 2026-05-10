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
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (section: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('hospital_staff_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('hospital_staff_user');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Basic redirect if not logged in
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
    
    // Check permission for current route
    if (!isLoading && user && pathname !== '/login' && pathname !== '/') {
      const section = pathname.split('/')[1];
      if (section && !hasPermission(section)) {
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (username: string, password: string) => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      return false;
    }

    const staffUser: StaffUser = {
      id: data.id,
      username: data.username,
      full_name: data.full_name,
      role: data.role,
      permissions: Array.isArray(data.permissions) ? data.permissions : JSON.parse(data.permissions || '[]')
    };

    setUser(staffUser);
    localStorage.setItem('hospital_staff_user', JSON.stringify(staffUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hospital_staff_user');
    router.push('/login');
  };

  const hasPermission = (section: string) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return user.permissions.includes(section);
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
