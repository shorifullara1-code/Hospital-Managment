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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const storedUser = localStorage.getItem('hospital_staff_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
        } catch (e) {
          localStorage.removeItem('hospital_staff_user');
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/');
      } else if (user && pathname !== '/' && pathname !== '/login') {
        const section = pathname.split('/')[1];
        if (section && !hasPermission(section)) {
          router.push('/');
        }
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (username: string, password: string) => {
    try {
      console.log("Attempting login for:", username);
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('username', username)
        .eq('password', password);

      if (error) {
        console.error("Supabase Error during login:", error.message);
        return { success: false, error: `Database error: ${error.message}` };
      }

      if (!data || data.length === 0) {
        console.error("Login failed: User not found");
        return { success: false, error: "Invalid username or password." };
      }

      const userData = data[0];
      let perms: string[] = [];
      
      try {
        if (Array.isArray(userData.permissions)) {
          perms = userData.permissions;
        } else if (typeof userData.permissions === 'string') {
          perms = JSON.parse(userData.permissions);
        }
      } catch (e) {
        console.error("Error parsing permissions:", e);
      }

      const staffUser: StaffUser = {
        id: userData.id,
        username: userData.username,
        full_name: userData.full_name,
        role: userData.role,
        permissions: Array.isArray(perms) ? perms : []
      };

      setUser(staffUser);
      localStorage.setItem('hospital_staff_user', JSON.stringify(staffUser));
      router.push('/');
      return { success: true };
    } catch (err: any) {
      console.error("Login exception:", err);
      return { success: false, error: err.message || "An unexpected error occurred." };
    }
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
