'use client';

import { motion } from 'motion/react';
import { Book, Package, ArrowRightLeft, BarChart3, Monitor, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

const sections = [
  {
    id: 'intro',
    title: 'Introdução',
    icon: <Book className="w-5 h-5" />,
    content: (
      <div className="space-y-4">
        <p>O <strong>Nozesfy</strong> é uma plataforma de gestão de estoque profissional projetada para oferecer precisão milimétrica e controle total sobre seu inventário.</p>
        <p>Nesta documentação, você aprenderá a configurar sua organização, gerenciar produtos e otimizar suas operações diárias.</p>
        <div className="bg-primary-50 p-4 border-l-4 border-primary-600 rounded-r-md">
          <p className="text-sm text-primary-800 font-medium"><strong>Dica:</strong> Utilize nossa versão Desktop para uma experiência mais fluida e acesso rápido pela barra de tarefas.</p>
        </div>
      </div>
    )
  },
  {
    id: 'inventory',
    title: 'Gestão de Inventário',
    icon: <Package className="w-5 h-5" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-primary-950">Cadastrando Produtos</h3>
        <p>Para adicionar um novo item, acesse a aba <strong>Estoque</strong> e clique em "Novo Produto".</p>
        <ul className="list-disc pl-5 space-y-2 text-primary-700">
          <li><strong>Locais de Estoque:</strong> Antes de cadastrar produtos, você deve ter pelo menos um local definido (ex: Depósito, Loja 1).</li>
          <li><strong>Estoque Mínimo:</strong> Defina um limite para receber alertas automáticos de "Estoque Baixo".</li>
        </ul>
      </div>
    )
  },
  {
    id: 'movements',
    title: 'Movimentações',
    icon: <ArrowRightLeft className="w-5 h-5" />,
    content: (
      <div className="space-y-4">
        <p>As movimentações são o coração do Nozesfy. Elas garantem que seu histórico seja impecável.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-primary-100 rounded-lg bg-white shadow-sm">
            <h4 className="font-bold text-emerald-600 mb-1">Entrada</h4>
            <p className="text-sm text-primary-600">Aumenta o saldo do produto. Ideal para reposições de fornecedores.</p>
          </div>
          <div className="p-4 border border-primary-100 rounded-lg bg-white shadow-sm">
            <h4 className="font-bold text-blue-600 mb-1">Saída</h4>
            <p className="text-sm text-primary-600">Registra vendas ou perdas. Requer uma justificativa para auditoria.</p>
          </div>
          <div className="p-4 border border-primary-100 rounded-lg bg-white shadow-sm">
            <h4 className="font-bold text-amber-600 mb-1">Transferência</h4>
            <p className="text-sm text-primary-600">Move o estoque entre locais (ex: do Depósito para a Loja) sem alterar o saldo total da empresa.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'dashboard',
    title: 'Dashboard e Estatísticas',
    icon: <BarChart3 className="w-5 h-5" />,
    content: (
      <div className="space-y-4">
        <p>O Dashboard oferece uma visão macro da sua operação em tempo real.</p>
        <ul className="space-y-3">
          <li className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-primary-600 mt-0.5" />
            <span><strong>Valor Total:</strong> Calculado automaticamente com base no preço de custo e quantidade.</span>
          </li>
          <li className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-primary-600 mt-0.5" />
            <span><strong>Itens Críticos:</strong> Lista automática de tudo que está abaixo do estoque mínimo.</span>
          </li>
          <li className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-primary-600 mt-0.5" />
            <span><strong>Atividade Recente:</strong> Histórico das últimas 5 operações para auditoria rápida.</span>
          </li>
        </ul>
      </div>
    )
  },
  {
    id: 'desktop',
    title: 'Aplicativo Desktop',
    icon: <Monitor className="w-5 h-5" />,
    content: (
      <div className="space-y-4">
        <p>A versão Desktop é recomendada para operadores de estoque que precisam de foco total.</p>
        <div className="bg-black text-white p-6 rounded-xl space-y-4 shadow-2xl">
          <h4 className="text-lg font-bold">Vantagens do App:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
              <span>Sem distrações de abas do navegador</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
              <span>Maior performance de carregamento</span>
            </div>
          </div>
          <Link 
            href="/download" 
            className="inline-flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-md font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            Ir para Downloads <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }
];

export default function DocsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('intro');

  return (
    <div className="min-h-screen bg-white text-primary-950 font-sans">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-primary-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2 text-primary-900 hover:text-primary-600 transition-all group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">Voltar</span>
          </Link>
          <div className="flex items-center">
             <Image src="/logo.webp" alt="Nozesfy" width={100} height={40} className="object-contain" />
          </div>
          <div className="w-20 hidden md:block"></div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <aside className="md:w-72 flex-shrink-0 space-y-2 h-fit md:sticky md:top-32">
          <div className="pb-4">
            <h2 className="text-xs font-bold text-primary-400 uppercase tracking-[0.2em] mb-4">Documentação</h2>
          </div>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-left ${
                activeSection === section.id 
                  ? 'bg-primary-950 text-white shadow-lg' 
                  : 'text-primary-600 hover:bg-primary-50 hover:text-primary-950'
              }`}
            >
              {section.icon}
              <span className="font-semibold text-sm">{section.title}</span>
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-3xl">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="prose prose-primary max-w-none"
          >
            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-black text-primary-950 tracking-tight mb-2">
                {sections.find(s => s.id === activeSection)?.title}
              </h1>
              <div className="w-20 h-1.5 bg-primary-600 rounded-full"></div>
            </div>
            
            <div className="text-lg text-primary-800 leading-relaxed">
              {sections.find(s => s.id === activeSection)?.content}
            </div>
          </motion.div>

          <footer className="mt-24 pt-8 border-t border-primary-50 text-center md:text-left">
          </footer>
        </main>
      </div>
    </div>
  );
}
