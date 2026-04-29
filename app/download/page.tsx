'use client';

import { motion } from 'motion/react';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import Footer from '@/components/Footer';

export default function DownloadPage() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header Simples */}
      <nav className="max-w-7xl w-full mx-auto px-6 py-8 flex items-center justify-between">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2 text-primary-900 hover:text-primary-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold">Voltar</span>
        </Link>
        <Image src="/logo.webp" alt="Nozesfy" width={100} height={40} className="object-contain" />
        <div className="w-20"></div> {/* Spacer */}
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-6 text-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold text-primary-950 tracking-tight">
              Nozesfy para <span className="text-primary-600">Desktop</span>
            </h1>
            
            <p className="text-xl text-primary-600 max-w-2xl mx-auto leading-relaxed">
              Tenha uma experiência mais rápida e focada com o nosso aplicativo dedicado para Windows. 
              Acesso direto da sua barra de tarefas.
            </p>
          </div>

          <div>
            <a
              href="/nozesfy.exe"
              download="nozesfy.exe"
              className="bg-black text-white px-12 py-5 rounded-md font-bold text-xl shadow-2xl flex items-center justify-center space-x-3 mx-auto max-w-fit hover:scale-105 transition-transform"
            >
              <Download className="w-6 h-6" />
              <span>Baixar para Windows</span>
            </a>
            <p className="text-sm text-primary-400 mt-4 font-medium">Versão 1.0.0 • Windows 10/11</p>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
