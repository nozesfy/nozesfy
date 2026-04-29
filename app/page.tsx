'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronDown, X, Mail, Lock, AlertCircle, PlayCircle, Menu, User, Download } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { login, signup } from '@/lib/actions/auth';
import Navbar from '@/components/Navbar';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'signup' }>({ open: false, mode: 'login' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).pywebview) {
      setIsDesktop(true);
    }
  }, []);

  const handleGoogleLogin = async () => {
    alert('Login social não disponível em modo 100% SQLite local.');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      
      if (authModal.mode === 'login') {
        const result = await login(formData);
        if (result.error) throw new Error(result.error);
      } else {
        const result = await signup(formData);
        if (result.error) throw new Error(result.error);
      }
      
      // Se chegou aqui, logou com sucesso
      setAuthModal({ ...authModal, open: false });
      window.location.href = '/dashboard';
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async () => {
    alert('Recuperação de senha não disponível em modo 100% SQLite local. Entre em contato com o administrador do sistema.');
  };

  return (
    <>
      {(loading || user) ? (
        <div className="min-h-screen flex items-center justify-center bg-black">
          <Image src="/favicon.webp" alt="Loading" width={64} height={64} className="animate-pulse" referrerPolicy="no-referrer" />
        </div>
      ) : (
        <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navbar onAuthClick={() => setAuthModal({ open: true, mode: 'login' })} />

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 pt-0 pb-32 text-center">
        <div className="space-y-6 flex flex-col items-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl lg:text-7xl font-extrabold text-primary-950 leading-[1.1] tracking-tight"
          >
            Controle seu estoque com <span className="text-primary-600">precisão.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-primary-600 max-w-2xl leading-relaxed"
          >
            Nozesfy é uma plataforma de gestão de estoque profissional, focada em pequenos comércios, supermercados e grandes redes.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-6 w-full max-w-sm"
          >
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ 
                boxShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 0px 20px rgba(0,0,0,0.2)", "0px 0px 0px rgba(0,0,0,0)"]
              }}
              transition={{ 
                boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              onClick={() => setAuthModal({ open: true, mode: 'signup' })}
              className="bg-black text-white flex items-center justify-center space-x-2 text-xl px-10 py-5 w-full rounded-md font-bold transition-all shadow-xl"
            >
              <span>Começar Agora</span>
              <ArrowRight className="w-6 h-6" />
            </motion.button>

            {!isDesktop && (
              <Link 
                href="/download"
                className="flex items-center justify-center space-x-2 text-primary-600 hover:text-primary-950 font-bold transition-colors py-2"
              >
                <Download className="w-5 h-5" />
                <span>Baixar para Windows</span>
              </Link>
            )}
          </motion.div>
        </div>
      </main>

      {/* FAQ Section */}
      <section className="bg-primary-50 py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-extrabold text-primary-950 text-center mb-16 tracking-tight">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {[
              { q: 'O que é o Nozesfy?', a: 'O Nozesfy é uma plataforma profissional de gestão de estoque projetada para oferecer precisão, velocidade e controle total sobre seu inventário em tempo real.' },
              { q: 'Como funciona o controle de estoque?', a: 'Você pode cadastrar produtos, registrar entradas e saídas, e monitorar níveis críticos. O sistema atualiza automaticamente as estatísticas e gera alertas de estoque baixo.' },
              { q: 'Meus dados estão seguros?', a: 'Sim. Utilizamos a infraestrutura do Supabase e PostgreSQL para garantir que seus dados estejam protegidos com os mais altos padrões de segurança e criptografia.' },
              { q: 'Posso acessar de qualquer dispositivo?', a: 'Sim, o Nozesfy é uma aplicação web responsiva que funciona perfeitamente em computadores, tablets e smartphones.' }
            ].map((faq, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-md border border-primary-100 overflow-hidden"
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-primary-50/50 transition-colors"
                >
                  <h3 className="text-lg font-bold text-primary-900">{faq.q}</h3>
                  <ChevronDown className={`w-5 h-5 text-primary-400 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 text-primary-600 leading-relaxed border-t border-primary-50 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AnimatePresence>
        {authModal.open && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAuthModal({ ...authModal, open: false })}
              className="absolute inset-0 bg-primary-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-black w-full max-w-md rounded-md border border-gray-800 overflow-hidden text-white"
            >
              <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                  {authModal.mode === 'login' ? 'Log-in' : 'Sign-up'}
                </h2>
                <button onClick={() => setAuthModal({ ...authModal, open: false })} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        required
                        type="email" 
                        className="w-full bg-gray-900 border border-gray-800 rounded-md py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all" 
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        required
                        type="password" 
                        className="w-full bg-gray-900 border border-gray-800 rounded-md py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {authError && (
                    <div className="flex items-start space-x-2 text-red-400 bg-red-950/30 p-3 rounded-sm border border-red-900/50">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="text-xs font-medium">{authError}</p>
                    </div>
                  )}

                  {resetSent && (
                    <div className="text-emerald-400 bg-emerald-950/30 p-3 rounded-sm border border-emerald-900/50 text-xs font-medium">
                      E-mail de recuperação enviado! Verifique sua caixa de entrada.
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={authLoading}
                    className="w-full bg-white text-black hover:bg-gray-200 py-4 rounded-md font-bold text-lg transition-colors"
                  >
                    {authLoading ? 'Processando...' : authModal.mode === 'login' ? 'ACESSAR' : 'CADASTRAR'}
                  </button>
                </form>

                {authModal.mode === 'login' && (
                  <button 
                    onClick={handleResetPassword}
                    className="w-full text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
                  >
                    RECUPERAR SENHA
                  </button>
                )}

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-black px-2 text-gray-500 font-bold">Ou continue com</span></div>
                </div>

                <button 
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center space-x-3 border border-gray-800 py-3 rounded-md hover:bg-gray-900 transition-all font-bold text-white"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Google</span>
                </button>

                <div className="text-center">
                  <button 
                    onClick={() => {
                      setAuthModal({ ...authModal, mode: authModal.mode === 'login' ? 'signup' : 'login' });
                      setAuthError(null);
                      setResetSent(false);
                    }}
                    className="text-sm font-bold text-gray-400 hover:text-white transition-colors"
                  >
                    {authModal.mode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </div>
      )}
    </>
  );
}

