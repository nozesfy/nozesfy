'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  return (
    <footer className={`fixed bottom-0 left-0 right-0 z-[40] ${isDashboard ? 'md:left-20' : ''} bg-white/80 backdrop-blur-md border-t border-primary-100 py-3 px-6`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-primary-400 text-center md:text-left">
        <div className="flex items-center space-x-3 md:space-x-4">
          <span className="text-primary-900 font-extrabold">Nozesfy</span>
          <span className="hidden sm:inline opacity-60">© 2026 Nozesfy. Todos os direitos reservados.</span>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 md:gap-x-6">
          <Link href="/politica-privacidade" className="hover:text-primary-900 transition-colors">Privacidade</Link>
          <Link href="/termos-uso" className="hover:text-primary-900 transition-colors">Termos</Link>
          <a href="mailto:sac@nozesfy.com" className="hover:text-primary-900 transition-colors lowercase font-medium">sac@nozesfy.com</a>
          <span className="text-primary-600 font-black">+55 (71) 9999-9999</span>
        </div>
      </div>
    </footer>
  );
}
