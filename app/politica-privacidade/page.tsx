'use client';

import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';

export default function PoliticaPrivacidadePage() {
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
          Política de Privacidade
        </motion.h1>
        
        <div className="prose prose-primary max-w-none text-primary-600 space-y-6">
          <p>Sua privacidade é importante para nós. É política do Nozesfy respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site Nozesfy, e outros sites que possuímos e operamos.</p>
          
          <h2 className="text-2xl font-bold text-primary-900 mt-8">1. Coleta de Dados</h2>
          <p>Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento.</p>
          
          <h2 className="text-2xl font-bold text-primary-900 mt-8">2. Uso das Informações</h2>
          <p>Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.</p>
          
          <h2 className="text-2xl font-bold text-primary-900 mt-8">3. Cookies</h2>
          <p>Utilizamos cookies para melhorar sua experiência em nossa plataforma. Você pode optar por desativar os cookies nas configurações do seu navegador.</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
