'use client';

import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';

export default function TermosUsoPage() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      <nav className="max-w-7xl mx-auto px-6 py-8">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center text-primary-500 hover:text-primary-900 transition-colors font-bold text-sm uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Início
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold text-primary-950 tracking-tight mb-8"
        >
          Termos de Uso
        </motion.h1>
        
        <div className="prose prose-primary max-w-none text-primary-600 space-y-6">
          <p>Ao acessar ao site Nozesfy, concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis.</p>
          
          <h2 className="text-2xl font-bold text-primary-900 mt-8">1. Licença de Uso</h2>
          <p>É concedida permissão para baixar temporariamente uma cópia dos materiais no site Nozesfy , apenas para visualização transitória pessoal e não comercial.</p>
          
          <h2 className="text-2xl font-bold text-primary-900 mt-8">2. Isenção de Responsabilidade</h2>
          <p>Os materiais no site da Nozesfy são fornecidos &apos;como estão&apos;. Nozesfy não oferece garantias, expressas ou implícitas, e por este meio isenta e nega todas as outras garantias.</p>
          
          <h2 className="text-2xl font-bold text-primary-900 mt-8">3. Limitações</h2>
          <p>Em nenhum caso o Nozesfy ou seus fornecedores serão responsáveis ​​por quaisquer danos decorrentes do uso ou da incapacidade de usar os materiais em Nozesfy.</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
