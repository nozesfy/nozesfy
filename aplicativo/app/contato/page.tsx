'use client';

import { motion } from 'motion/react';
import { Mail, Phone, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function ContatoPage() {
  const { user } = useAuth();
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sending
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="max-w-7xl mx-auto px-6 py-8">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center text-primary-500 hover:text-primary-900 transition-colors font-bold text-sm uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Início
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl font-extrabold text-primary-950 tracking-tight"
            >
              Vamos conversar?
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-primary-500 mt-6 leading-relaxed"
            >
              Nossa equipe está pronta para tirar suas dúvidas e ajudar você a encontrar a melhor solução para seu estoque.
            </motion.p>

            <div className="mt-12 space-y-8">
              <div className="flex items-start space-x-4">
                <div className="bg-primary-50 p-3 rounded-md">
                  <Mail className="w-6 h-6 text-primary-900" />
                </div>
                <div>
                  <h3 className="font-bold text-primary-900">E-mail</h3>
                  <p className="text-primary-500">sac@nozesfy.com</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-primary-50 p-3 rounded-md">
                  <Phone className="w-6 h-6 text-primary-900" />
                </div>
                <div>
                  <h3 className="font-bold text-primary-900">Telefone</h3>
                  <p className="text-primary-500">+55 (71) 9999-9999</p>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-primary-50 p-8 rounded-md border border-primary-100"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Nome</label>
                  <input 
                    required
                    type="text" 
                    className="corporate-input" 
                    placeholder="Seu nome"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">E-mail</label>
                  <input 
                    required
                    type="email" 
                    className="corporate-input" 
                    placeholder="seu@email.com"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Assunto</label>
                <input 
                  required
                  type="text" 
                  className="corporate-input" 
                  placeholder="Como podemos ajudar?"
                  value={formState.subject}
                  onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Mensagem</label>
                <textarea 
                  required
                  rows={5}
                  className="corporate-input resize-none" 
                  placeholder="Sua mensagem..."
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-primary-900 text-white py-4 rounded-md font-bold flex items-center justify-center space-x-2 hover:bg-primary-950 transition-all"
              >
                <span>Enviar Mensagem</span>
                <Send className="w-4 h-4" />
              </button>

              {sent && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-emerald-600 font-bold text-sm"
                >
                  Mensagem enviada com sucesso!
                </motion.p>
              )}
            </form>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
