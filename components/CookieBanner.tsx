'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X } from 'lucide-react';

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [accepted, setAccepted] = useState(true); // Default to true so it doesn't show during SSR

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      const consent = localStorage.getItem('cookie-consent');
      setAccepted(!!consent);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setAccepted(true);
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {!accepted && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[400px] bg-black text-white p-6 rounded-lg shadow-2xl z-[300] border border-gray-800"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="bg-gray-900 p-2 rounded-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <button onClick={() => setAccepted(true)} className="text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <h3 className="font-bold text-lg mb-2">Privacidade & Cookies</h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            Utilizamos cookies para personalizar conteúdos e melhorar sua experiência. Ao continuar navegando, você concorda com nossa <Link href="/politica-privacidade" className="text-white underline underline-offset-4 font-medium">Política de Privacidade</Link>.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={accept} 
              className="flex-1 bg-white text-black px-4 py-2.5 rounded-md font-bold text-sm hover:bg-gray-200 transition-colors"
            >
              Aceitar Tudo
            </button>
            <button 
              onClick={() => setAccepted(true)}
              className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-md font-bold text-sm border border-gray-800 hover:bg-gray-800 transition-colors"
            >
              Recusar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
