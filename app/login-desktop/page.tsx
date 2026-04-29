'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, AlertCircle, X, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { login, signup, setDesktopMode } from '@/lib/actions/auth';

export default function LoginDesktopPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      
      if (authMode === 'login') {
        const result = await login(formData);
        if (result.error) throw new Error(result.error);
      } else {
        const result = await signup(formData);
        if (result.error) throw new Error(result.error);
      }
      
      // Ativar modo desktop
      await setDesktopMode(true);
      
      // Se chegou aqui, logou com sucesso
      window.location.href = '/dashboard';
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = () => {
    alert('Recuperação de senha não disponível em modo 100% SQLite local. Entre em contato com o administrador do sistema.');
  };

  const handleGoogleLogin = async () => {
    alert('Login social não disponível em modo 100% SQLite local.');
  };

  return (
    <>
      {loading || user ? (
        <div className="min-h-screen flex items-center justify-center bg-black">
          <Image src="/favicon.webp" alt="Loading" width={64} height={64} className="animate-pulse" referrerPolicy="no-referrer" />
        </div>
      ) : (
        <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative corporate-card w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-primary-50 flex items-center justify-center bg-white">
          <div className="flex flex-col items-center">
            <div className="w-40 h-24 relative mb-1">
              <Image 
                src="/logo.webp" 
                alt="nozesfy logo" 
                fill
                className="object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">
              {authMode === 'login' ? 'Acesso Desktop' : 'Cadastro Desktop'}
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                <input 
                  required
                  type="email" 
                  className="corporate-input pl-10 py-2.5" 
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                <input 
                  required
                  type="password" 
                  className="corporate-input pl-10 py-2.5" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {authError && (
              <div className="flex items-start space-x-2 text-red-600 bg-red-50 p-2 rounded-sm border border-red-100">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] font-medium">{authError}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full corporate-button-primary text-sm py-3 mt-2"
            >
              {authLoading ? 'Processando...' : authMode === 'login' ? 'ACESSAR SISTEMA' : 'CRIAR CONTA'}
            </button>
          </form>

          <div className="space-y-3 text-center">
            {authMode === 'login' && (
              <button 
                onClick={handleResetPassword}
                className="text-[10px] font-bold text-primary-400 hover:text-primary-900 transition-colors uppercase tracking-widest"
              >
                Esqueceu a senha?
              </button>
            )}

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-primary-100"></div></div>
              <div className="relative flex justify-center text-[9px] uppercase"><span className="bg-white px-2 text-primary-400 font-bold">Ou continue com</span></div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center space-x-2 border border-primary-100 py-2 rounded-sm hover:bg-primary-50 transition-all font-bold text-primary-900 text-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google</span>
            </button>

            <div className="pt-1">
              <button 
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  setAuthError(null);
                }}
                className="text-xs font-bold text-primary-600 hover:text-primary-950 transition-colors"
              >
                {authMode === 'login' ? 'Cadastre-se' : 'Fazer login'}
              </button>
            </div>
          </div>

        </div>
      </motion.div>
        </div>
      )}
    </>
  );
}
