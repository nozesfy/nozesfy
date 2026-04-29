'use client';

import { motion } from 'motion/react';
import { Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';

export default function PlanosPage() {
  const { user } = useAuth();
  const plans = [
    {
      name: 'Básico',
      price: 'R$ 0',
      period: '/mês',
      description: 'Plano gratuito para uso individual e testes iniciais.',
      features: [
        'Até 500 produtos',
        '1 usuário (Individual)',
        '1 local de estoque',
        'Controle em tempo real',
        'Suporte comunitário'
      ],
      button: user ? 'Plano Atual' : 'Começar Grátis',
      link: user ? '/dashboard' : '/',
      popular: false
    },
    {
      name: 'Profissional',
      price: 'R$ 97',
      period: '/mês',
      description: 'Ideal para empresas em crescimento com múltiplos usuários.',
      features: [
        'Até 10 usuários',
        'Multiestoque (Loja/Depósito)',
        'Exportação Power BI / CSV',
        'Relatórios avançados',
        'Suporte via e-mail'
      ],
      button: user ? 'Fazer Upgrade' : 'Escolher Pro',
      link: user ? '/dashboard/settings?tab=assinatura' : '/',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'R$ 297',
      period: '/mês',
      description: 'Solução completa para grandes redes e integração total.',
      features: [
        'Usuários ilimitados',
        'Locais ilimitados',
        'API de integração',
        'Suporte prioritário 24/7',
        'SLA de disponibilidade',
        'Gestão multi-empresa'
      ],
      button: user ? 'Fazer Upgrade' : 'Escolher Enterprise',
      link: user ? '/dashboard/settings?tab=assinatura' : '/',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar showBack={true} />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-extrabold text-primary-950 tracking-tight"
          >
            Planos que crescem com você
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-primary-500 mt-4 max-w-2xl mx-auto"
          >
            Escolha a melhor opção para a gestão do seu negócio. Transparência total, sem taxas escondidas.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className={`relative p-8 rounded-md border ${plan.popular ? 'border-primary-900 shadow-xl scale-105 z-10 bg-white' : 'border-primary-100'} flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Mais Popular
                </div>
              )}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-primary-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-primary-950">{plan.price}</span>
                  <span className="text-primary-400 ml-1">{plan.period}</span>
                </div>
                <p className="mt-4 text-sm text-primary-500 leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start space-x-3 text-sm text-primary-600">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link 
                href={plan.link}
                className={`w-full py-4 rounded-md font-bold transition-all flex items-center justify-center ${plan.popular ? 'bg-primary-900 text-white hover:bg-primary-950 shadow-lg' : 'bg-primary-50 text-primary-900 hover:bg-primary-100'}`}
              >
                {plan.button}
              </Link>
            </motion.div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
