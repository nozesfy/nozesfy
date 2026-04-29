'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

interface NavbarProps {
  onAuthClick?: () => void;
}

export default function Navbar({ onAuthClick }: NavbarProps) {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).pywebview) {
      setIsDesktop(true);
    }
  }, []);

  return (
    <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-50">
      <div className="flex items-center space-x-3">
        <Link href="/" className="block">
          {!logoError ? (
            <div className="w-28 h-20 flex-shrink-0 relative">
              <Image 
                src="/logo.webp" 
                alt="nozesfy logo" 
                fill
                className="object-contain"
                onError={() => setLogoError(true)}
                priority
              />
            </div>
          ) : (
            <span className="text-xl font-bold text-primary-900 px-4">Nozesfy</span>
          )}
        </Link>
      </div>

      <div className="relative">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-primary-900 hover:bg-primary-50 rounded-full transition-colors flex items-center justify-center"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        
        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-primary-100 rounded-md shadow-lg p-2 z-[60]">
            <Link href="/planos" className="block px-4 py-2 text-sm font-semibold text-primary-900 hover:bg-primary-50 rounded-sm" onClick={() => setIsMenuOpen(false)}>
              Planos
            </Link>
            <Link href="/contato" className="block px-4 py-2 text-sm font-semibold text-primary-900 hover:bg-primary-50 rounded-sm" onClick={() => setIsMenuOpen(false)}>
              Contato
            </Link>
            <Link href="/docs" className="block px-4 py-2 text-sm font-semibold text-primary-900 hover:bg-primary-50 rounded-sm" onClick={() => setIsMenuOpen(false)}>
              Documentação
            </Link>
            {!isDesktop && (
              <Link href="/download" className="block px-4 py-2 text-sm font-semibold text-primary-900 hover:bg-primary-50 rounded-sm" onClick={() => setIsMenuOpen(false)}>
                Download App
              </Link>
            )}
            <div className="h-px bg-primary-100 my-2 mx-2" />
            {user ? (
              <Link 
                href="/dashboard" 
                className="block px-4 py-2 text-sm font-bold text-white bg-black hover:bg-primary-900 rounded-sm text-center transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <button 
                onClick={() => {
                  if (onAuthClick) {
                    onAuthClick();
                  } else {
                    window.location.href = '/?auth=login';
                  }
                  setIsMenuOpen(false);
                }}
                className="w-full text-center px-4 py-2 text-sm font-bold text-white bg-black hover:bg-primary-900 rounded-sm transition-all"
              >
                Acessar
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
