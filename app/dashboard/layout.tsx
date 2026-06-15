'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Package, History, Settings, LogOut, Users, Truck, Bell, RefreshCw, Download, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { updateProfile } from '@/lib/actions/inventory';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);
  const [onboardingData, setOnboardingData] = useState({ firstName: '', lastName: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
    // RN-01: Onboarding para novos usuários (pedir nome se estiver vazio)
    if (!loading && user && profile && !profile.full_name) {
      setShowOnboarding(true);
    }
  }, [user, loading, router, profile]);

  const handleSaveOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingData.firstName || !onboardingData.lastName) return;

    setIsSaving(true);
    try {
      const fullName = `${onboardingData.firstName} ${onboardingData.lastName}`.trim();
      const { success, error } = await updateProfile(user?.id, { full_name: fullName });

      if (!success) throw new Error(error);
      setShowOnboarding(false);
      window.location.reload(); // Recarregar para atualizar o profile em todo o app
    } catch (error) {
      console.error('Error saving onboarding:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Image src="/favicon.webp" alt="Loading" width={64} height={64} className="animate-pulse" referrerPolicy="no-referrer" />
      </div>
    );
  }

  // Pegar apenas o primeiro nome para exibição
  const firstNameDisplay = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Usuário';

  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    // Detectar se estamos rodando dentro do PyWebView
    if (typeof window !== 'undefined' && (window as any).pywebview) {
      setIsDesktop(true);
    }
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Package, label: 'Estoque', href: '/dashboard/inventory' },
    { icon: History, label: 'Histórico', href: '/dashboard/history' },
    { icon: Bell, label: 'Alertas', href: '/dashboard/alerts' },
    { icon: Users, label: 'Clientes', href: '/dashboard/customers' },
    { icon: Truck, label: 'Fornecedores', href: '/dashboard/suppliers' },
    { icon: Settings, label: 'Ajustes', href: '/dashboard/settings' },
    { icon: Book, label: 'Ajuda', href: '/docs' },
    { icon: Download, label: 'Download', href: '/download' },
  ].filter(item => {
    // Esconder link de download se já estiver no desktop
    if (isDesktop && item.label === 'Download') {
      return false;
    }

    // Se não tem organização, não vê nada exceto o Dashboard (que mostrará o CreateOrganization)
    if (!profile?.organization_id) {
      return item.label === 'Dashboard';
    }

    const isOperator = profile?.role === 'operator';
    if (isOperator) {
      // Operadores não vêem Clientes, Fornecedores ou Ajustes
      return !['Clientes', 'Fornecedores', 'Ajustes'].includes(item.label);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-primary-50 flex">
      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-primary-950/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full border border-primary-100"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-primary-900">Bem-vindo ao Nozesfy!</h2>
              <p className="text-primary-500 mt-2">Como podemos chamar você?</p>
            </div>

            <form onSubmit={handleSaveOnboarding} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Nome</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-3 bg-primary-50 rounded-lg border border-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-900" 
                    placeholder="Ex: William"
                    value={onboardingData.firstName}
                    onChange={(e) => setOnboardingData({...onboardingData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Sobrenome</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-3 bg-primary-50 rounded-lg border border-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-900" 
                    placeholder="Ex: Monteiro"
                    value={onboardingData.lastName}
                    onChange={(e) => setOnboardingData({...onboardingData, lastName: e.target.value})}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-primary-900 text-white py-4 rounded-lg font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isSaving ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Começar agora</span>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-20 bg-white border-r border-primary-100 fixed h-full">
        <div className="p-2 border-b border-primary-100 flex items-center justify-center">
          {!logoError && (
            <div className="w-14 h-14 flex-shrink-0 relative">
              <Image 
                src="/logo.webp" 
                alt="nozesfy logo" 
                fill
                className="object-contain"
                onError={() => setLogoError(true)}
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center justify-center w-12 h-12 rounded-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary-900 text-white border border-primary-900' 
                    : 'text-primary-500 hover:bg-primary-100 hover:text-primary-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            );
          })}
        </nav>

        <div className="py-6 border-t border-primary-100 flex flex-col items-center space-y-4">
          <div 
            title={profile?.full_name || user.email || 'Usuário'}
            className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm border-2 border-white shadow-sm"
          >
            {firstNameDisplay[0].toUpperCase()}
          </div>
          <button 
            onClick={() => logout()}
            title="Sair do Sistema"
            className="flex items-center justify-center w-12 h-12 rounded-sm text-primary-400 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 md:pl-20">
        <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-32 md:pb-10">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-primary-100 px-6 py-3 flex justify-between items-center z-50">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center flex-1 ${
                isActive ? 'text-primary-900' : 'text-primary-400'
              }`}
            >
              <item.icon className={`w-6 h-6 ${isActive ? 'fill-primary-900/10' : ''}`} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

