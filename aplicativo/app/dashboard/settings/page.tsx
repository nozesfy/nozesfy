'use client';

import { useAuth } from '@/components/AuthProvider';
import { motion } from 'motion/react';
import { User, Mail, Shield, LogOut, Bell, Smartphone, HelpCircle, Save, CreditCard, Key, Copy, RefreshCw, Check, Zap, Star, Crown, Plus, Users, Trash2, Building2, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import CreateOrganization from '@/components/CreateOrganization';
import { updateProfile, getTeamData, resetBusinessData, sendInvite, deleteInvite, updateMemberRole, updateProfileApiKey } from '@/lib/actions/inventory';
import { createCheckoutSession, createPortalSession } from '@/lib/actions/stripe';
import { deleteAccount } from '@/lib/actions/auth';

export default function SettingsPage() {
  const { profile, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('perfil');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('operator');
  const [inviteLocation, setInviteLocation] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    if (profile) {
      const names = (profile.full_name || '').split(' ');
      const firstName = names[0] || '';
      const lastName = names.slice(1).join(' ') || '';
      
      setProfileData({
        firstName,
        lastName,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'equipe' && profile?.organization_id) {
      fetchTeamData();
    }
  }, [activeTab, profile?.organization_id]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    
    setIsUpdating(true);
    try {
      const full_name = `${profileData.firstName} ${profileData.lastName}`.trim();
      const { success, error } = await updateProfile(profile.id, {
        full_name,
      });

      if (!success) throw new Error(error);
      alert('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.message || 'Erro ao atualizar perfil.');
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchTeamData = async () => {
    setLoadingTeam(true);
    try {
      const { data, error } = await getTeamData(profile.organization_id);
      if (error) throw new Error(error);

      setMembers(data?.members || []);
      setLocations(data?.locations || []);
      if (data?.locations && data.locations.length > 0) {
        setInviteLocation(data.locations[0].id);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id || !inviteEmail) return;

    // Validação de limite de plano básico
    if (profile.plan === 'basic' && members.length >= 1) {
      alert('O plano básico permite apenas um membro. Faça o upgrade para convidar sua equipe!');
      return;
    }

    setIsInviting(true);
    try {
      const { success, error } = await sendInvite(
        profile.organization_id,
        inviteEmail,
        inviteRole,
        inviteLocation || undefined
      );

      if (!success) throw new Error(error);

      setInviteEmail('');
      fetchTeamData();
      alert('Convite enviado com sucesso! (Simulado no local)');
    } catch (error: any) {
      console.error('Error sending invite:', error);
      alert(error.message || 'Erro ao enviar convite.');
    } finally {
      setIsInviting(false);
    }
  };

  const cancelInvite = async (id: string) => {
    try {
      const { success, error } = await deleteInvite(id);
      if (!success) throw new Error(error);
      fetchTeamData();
    } catch (error) {
      console.error('Error cancelling invite:', error);
    }
  };

  const isPro = true;

  const generateApiKey = async () => {
    if (!profile?.id) return;
    setIsGenerating(true);
    try {
      const newKey = `nz_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const { success, error } = await updateProfileApiKey(profile.id, newKey);
      
      if (!success) throw new Error(error);
      window.location.reload();
    } catch (error) {
      console.error('Error generating API Key:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  const handleResetData = async () => {
    if (!profile?.organization_id) return;
    
    const confirm1 = confirm('ATENÇÃO: Esta ação é IRREVERSÍVEL. Todos os seus produtos, históricos de movimentação, locais de estoque, clientes e fornecedores serão excluídos permanentemente.');
    if (!confirm1) return;
    
    const confirm2 = confirm('Você tem certeza absoluta? Sua conta e organização serão mantidas, mas todos os dados de negócio serão zerados.');
    if (!confirm2) return;

    try {
      const { success, error } = await resetBusinessData(profile.organization_id);
      if (!success) throw new Error(error);

      alert('Dados resetados com sucesso! Sua conta está limpa para novos testes.');
      window.location.reload();
    } catch (error: any) {
      console.error('Error resetting data:', error);
      alert('Erro ao resetar dados: ' + error.message);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm1 = confirm('PERIGO: Esta ação excluirá permanentemente sua conta e TODOS os dados da sua organização. Isso não pode ser desfeito.');
    if (!confirm1) return;

    const confirm2 = confirm('Você tem certeza absoluta? Digite seu e-mail para confirmar a exclusão.');
    if (!confirm2) return;

    const emailConfirm = prompt(`Por favor, digite seu e-mail (${profile?.email}) para confirmar:`);
    if (emailConfirm !== profile?.email) {
      alert('E-mail incorreto. Exclusão cancelada.');
      return;
    }

    setIsDeleting(true);
    try {
      const { success, error } = await deleteAccount();
      if (!success) throw new Error(error);
      
      alert('Sua conta foi excluída com sucesso. Sentiremos sua falta!');
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error deleting account:', error);
      alert(error.message || 'Erro ao excluir conta.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-primary-950">Configurações</h1>
        <p className="text-primary-500 mt-1">Gerencie suas preferências de conta e do sistema.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation */}
        <div className="space-y-2">
          {[
            { id: 'perfil', icon: User, label: 'Perfil' },
            { id: 'assinatura', icon: CreditCard, label: 'Assinatura' },
            { id: 'equipe', icon: Users, label: 'Equipe' },
            { id: 'integracoes', icon: Key, label: 'Integrações' },
            { id: 'notificacoes', icon: Bell, label: 'Notificações' },
            { id: 'seguranca', icon: Shield, label: 'Segurança' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-sm font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-primary-900 text-white border border-primary-900' 
                  : 'text-primary-500 hover:bg-primary-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-2">
          {!profile?.organization_id && activeTab !== 'perfil' ? (
            <CreateOrganization />
          ) : (
            <>
              {activeTab === 'perfil' && (
                <form onSubmit={handleUpdateProfile} className="corporate-card p-8">
                  <h3 className="text-xl font-bold text-primary-900 mb-6">Informações Pessoais</h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-primary-900 mb-2">Primeiro Nome</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                          <input
                            type="text"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 rounded-sm border border-primary-100 focus:ring-2 focus:ring-primary-900 outline-none transition-all"
                            placeholder="Seu nome"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-primary-900 mb-2">Sobrenome</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                          <input
                            type="text"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 rounded-sm border border-primary-100 focus:ring-2 focus:ring-primary-900 outline-none transition-all"
                            placeholder="Seu sobrenome"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-primary-400 mb-2">E-mail (Não editável)</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-200" />
                          <input
                            type="email"
                            value={profile?.email}
                            disabled
                            className="w-full pl-10 pr-4 py-3 rounded-sm border border-primary-50 bg-primary-50 text-primary-400 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={isUpdating}
                      className="flex items-center space-x-2 bg-primary-900 text-white px-6 py-3 rounded-sm font-bold hover:bg-black transition-all disabled:opacity-50"
                    >
                      {isUpdating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      <span>{isUpdating ? 'Salvando...' : 'Salvar Alterações'}</span>
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'assinatura' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  {/* Current Plan Card */}
                  <div className="corporate-card p-8 bg-primary-900 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <CreditCard className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded">Plano Atual</span>
                      </div>
                      <h3 className="text-3xl font-bold capitalize">
                        {profile?.organization?.subscription_tier || 'Plano Básico'}
                      </h3>
                      <p className="text-primary-300 mt-2 max-w-md">
                        {profile?.organization?.subscription_tier === 'enterprise' 
                          ? 'Sua empresa possui acesso total e suporte prioritário.' 
                          : profile?.organization?.subscription_tier === 'pro'
                          ? 'Acesso a recursos avançados e maior capacidade de equipe.'
                          : 'Plano gratuito para uso individual e testes.'}
                      </p>
                      
                      {profile?.organization?.stripe_customer_id && (
                        <button 
                          onClick={async () => {
                            setIsCheckingOut('portal');
                            try {
                              const { url } = await createPortalSession();
                              if (url) window.location.href = url;
                            } catch (e: any) {
                              alert(e.message);
                            } finally {
                              setIsCheckingOut(null);
                            }
                          }}
                          className="mt-8 bg-white text-primary-900 px-6 py-3 rounded-sm font-bold hover:bg-primary-50 transition-all flex items-center space-x-2"
                        >
                          <Building2 className="w-5 h-5" />
                          <span>Gerenciar Faturamento</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Plans Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      {
                        id: 'pro',
                        name: 'Profissional',
                        price: 'R$ 97',
                        period: '/mês',
                        description: 'Ideal para empresas em crescimento com múltiplos usuários.',
                        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID,
                        features: ['Até 10 usuários', 'Multiestoque (Loja/Depósito)', 'Exportação Power BI / CSV', 'Relatórios avançados', 'Suporte via e-mail']
                      },
                      {
                        id: 'enterprise',
                        name: 'Enterprise',
                        price: 'R$ 297',
                        period: '/mês',
                        description: 'Solução completa para grandes redes e integração total.',
                        priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PLAN_PRICE_ID,
                        features: ['Usuários ilimitados', 'Locais ilimitados', 'API de integração', 'Suporte prioritário 24/7', 'SLA de disponibilidade']
                      }
                    ].map((plan) => (
                      <div 
                        key={plan.id} 
                        className={`relative p-8 rounded-md border flex flex-col transition-all ${
                          profile?.organization?.subscription_tier === plan.id 
                          ? 'border-primary-900 bg-white shadow-lg' 
                          : 'border-primary-100 bg-white hover:border-primary-200'
                        }`}
                      >
                        {profile?.organization?.subscription_tier === plan.id && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                            Plano Ativo
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
                          {plan.features.map(f => (
                            <li key={f} className="flex items-start space-x-3 text-sm text-primary-600">
                              <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>

                        <button
                          disabled={!!isCheckingOut || profile?.organization?.subscription_tier === plan.id}
                          onClick={async () => {
                            if (!plan.priceId) {
                              alert('ID de preço não configurado no .env');
                              return;
                            }
                            setIsCheckingOut(plan.id);
                            try {
                              const { url } = await createCheckoutSession(plan.priceId);
                              if (url) window.location.href = url;
                            } catch (e: any) {
                              alert(e.message);
                            } finally {
                              setIsCheckingOut(null);
                            }
                          }}
                          className={`w-full py-4 rounded-md font-bold transition-all active:scale-95 flex items-center justify-center space-x-2 ${
                            profile?.organization?.subscription_tier === plan.id
                              ? 'bg-emerald-50 text-emerald-600 cursor-default'
                              : 'bg-primary-900 text-white hover:bg-black shadow-md'
                          }`}
                        >
                          {isCheckingOut === plan.id ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : profile?.organization?.subscription_tier === plan.id ? (
                            <>
                              <Check className="w-5 h-5" />
                              <span>Plano Ativo</span>
                            </>
                          ) : (
                            <span>Fazer Upgrade</span>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'equipe' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  {/* Invite Member Section */}
                  <div className="corporate-card p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-primary-900">Convidar Membro</h3>

                    </div>
                    
                    <form onSubmit={handleSendInvite} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-primary-500 mb-1">E-mail</label>
                        <input
                          type="email"
                          required
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="exemplo@email.com"
                          className="w-full px-4 py-2 text-sm rounded-sm border border-primary-100 focus:ring-2 focus:ring-primary-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-primary-500 mb-1">Cargo</label>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="w-full px-4 py-2 text-sm rounded-sm border border-primary-100 focus:ring-2 focus:ring-primary-900 outline-none bg-white"
                        >
                          <option value="operator">Operador</option>
                          <option value="manager">Gerente de Unidade</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-primary-500 mb-1">Depósito / Unidade</label>
                        <select
                          value={inviteLocation}
                          onChange={(e) => setInviteLocation(e.target.value)}
                          className="w-full px-4 py-2 text-sm rounded-sm border border-primary-100 focus:ring-2 focus:ring-primary-900 outline-none bg-white"
                        >
                          <option value="">Acesso Global (Todos)</option>
                          {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={isInviting}
                        className="bg-primary-900 text-white px-4 py-2 rounded-sm font-bold text-sm hover:bg-black transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        {isInviting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        <span>Convidar</span>
                      </button>
                    </form>
                  </div>

                  {/* Team Members List */}
                  <div className="corporate-card overflow-hidden">
                    <div className="p-6 border-b border-primary-100">
                      <h3 className="font-bold text-primary-900">Membros Ativos</h3>
                    </div>
                    <div className="divide-y divide-primary-50">
                      {members.filter(m => m.id !== user?.id).map(member => (
                        <div key={member.id} className="p-6 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-700">
                              {member.full_name?.[0] || member.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-primary-900">{member.full_name || member.email?.split('@')[0] || 'Membro sem nome'}</p>
                              <p className="text-xs text-primary-400 capitalize">{member.role} • {member.home_location?.name || 'Acesso Global'}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Ativo</span>
                        </div>
                      ))}
                      
                      {invites.map(invite => (
                        <div key={invite.id} className="p-6 flex items-center justify-between bg-slate-50/50">
                          <div className="flex items-center space-x-4 opacity-60">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                              <Mail className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{invite.email}</p>
                              <p className="text-xs text-slate-500 capitalize">Convite: {invite.role} • {invite.inventory_locations?.name || 'Acesso Global'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Pendente</span>
                            <button 
                              onClick={() => cancelInvite(invite.id)}
                              className="text-primary-300 hover:text-red-500 pr-2"
                              title="Cancelar Convite"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {members.filter(m => m.id !== user?.id).length === 0 && invites.length === 0 && (
                        <div className="p-10 text-center text-primary-400">
                          Nenhum membro convidado ainda.
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}



              {activeTab === 'integracoes' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="corporate-card p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-primary-900">Configurações de API</h3>
                      <p className="text-sm text-primary-500 mt-1">Conecte seu estoque com outros sistemas.</p>
                    </div>
                    <Key className="w-8 h-8 text-primary-200" />
                  </div>
                  
                  {profile?.plan === 'enterprise' ? (
                    <div className="space-y-8">
                      <div className="p-6 bg-slate-50 rounded-xl border border-primary-50">
                        <label className="block text-sm font-bold text-primary-900 mb-3">API Key Privada</label>
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-1">
                            <input
                              type="password"
                              value={profile?.api_key || '••••••••••••••••••••••••'}
                              readOnly
                              className="w-full px-4 py-3 bg-white rounded-sm border border-primary-200 font-mono text-sm outline-none"
                            />
                          </div>
                          {profile?.api_key ? (
                            <>
                              <button
                                onClick={() => copyToClipboard(profile.api_key)}
                                className="p-3 bg-white border border-primary-100 rounded-sm hover:bg-primary-50 transition-all text-primary-600"
                                title="Copiar Key"
                              >
                                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                              </button>
                              <button
                                onClick={generateApiKey}
                                disabled={isGenerating}
                                className="p-3 bg-white border border-primary-100 rounded-sm hover:bg-primary-50 transition-all text-primary-600"
                                title="Regerar Key"
                              >
                                <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={generateApiKey}
                              disabled={isGenerating}
                              className="bg-primary-900 text-white px-6 py-3 rounded-sm font-bold hover:bg-black transition-all flex items-center space-x-2"
                            >
                              <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                              <span>Gerar API Key</span>
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-primary-400 mt-4">
                          <span className="font-bold text-amber-600">Atenção:</span> Nunca compartilhe sua chave de API. Ela dá acesso total aos seus dados.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
                        <div className="p-6 border border-primary-100 rounded-xl flex items-center space-x-4">
                          <div className="p-3">
                            <Smartphone className="w-6 h-6 text-primary-900" />
                          </div>
                          <div>
                            <h4 className="font-bold text-primary-900">App Mobile</h4>
                            <p className="text-sm text-primary-400">Em Breve</p>
                          </div>
                        </div>
                        <div className="p-6 border border-primary-100 rounded-xl flex items-center space-x-4">
                          <div className="p-3">
                            <HelpCircle className="w-6 h-6 text-primary-900" />
                          </div>
                          <div>
                            <h4 className="font-bold text-primary-900">Webhooks</h4>
                            <p className="text-sm text-primary-400">Em Breve</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-primary-50 rounded-xl border border-dashed border-primary-200">
                      <Lock className="w-12 h-12 text-primary-300 mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-primary-900">Recurso Enterprise</h4>
                      <p className="text-primary-500 mt-2 max-w-sm mx-auto">
                        A integração via API está disponível apenas para clientes do plano Enterprise.
                      </p>
                      <button 
                        onClick={() => setActiveTab('assinatura')}
                        className="mt-6 text-primary-900 font-bold hover:underline"
                      >
                        Ver Planos e Preços →
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="corporate-card p-8 border-red-100 mt-8"
          >
            <h2 className="text-xl font-bold text-red-600 mb-2">Zona de Perigo</h2>
            <p className="text-sm text-primary-500 mb-6">Ações irreversíveis para sua conta e dados.</p>
            <div className="flex flex-col md:flex-row gap-4">
              <button 
                onClick={() => logout()}
                className="text-sm font-bold text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-sm border border-primary-100 transition-colors flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair do Sistema</span>
              </button>
              <button 
                onClick={handleResetData}
                className="text-sm font-bold text-red-600 hover:bg-red-50 px-4 py-2 rounded-sm border border-red-200 transition-colors"
              >
                Resetar Dados do Negócio
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="text-sm font-bold text-red-100 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir Minha Conta'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
