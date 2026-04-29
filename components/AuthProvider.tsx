'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSession, logout as logoutAction } from '@/lib/actions/auth';
import Image from 'next/image';

interface AuthContextType {
  user: any | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  isDesktop: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isDesktop: false,
  logout: async () => {},
  refresh: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const session = await getSession();
      setProfile(session);
    } catch (error) {
      console.error('Error fetching session:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    // Verificar modo desktop via cookie
    const mode = document.cookie
      .split('; ')
      .find(row => row.startsWith('nozesfy_mode='))
      ?.split('=')[1];
    
    setIsDesktop(mode === 'desktop');
  }, []);

  const logout = async () => {
    await logoutAction();
    
    // Se estiver em modo desktop, limpar o modo e redirecionar para login-desktop
    if (isDesktop) {
      document.cookie = 'nozesfy_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      setProfile(null);
      window.location.href = '/login-desktop';
    } else {
      setProfile(null);
      window.location.href = '/';
    }
  };

  const value = {
    user: profile, // Map profile to user for compatibility
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || profile?.role === 'owner',
    isDesktop,
    logout,
    refresh: fetchSession,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-16 mb-6 animate-pulse">
            <Image 
              src="/logo.webp" 
              alt="Nozesfy" 
              fill 
              className="object-contain"
              priority
            />
          </div>
          <p className="text-primary-500 font-medium tracking-wide">Carregando Sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
