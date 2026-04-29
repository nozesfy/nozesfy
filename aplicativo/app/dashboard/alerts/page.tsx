'use client';

import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Bell, AlertTriangle, Clock, Package, TrendingDown, RefreshCw, CheckCircle2, Search, Filter, Lock } from 'lucide-react';
import Link from 'next/link';
import { getAlerts } from '@/lib/actions/inventory';

interface Alert {
  id: string;
  type: 'LOW_STOCK' | 'EXPIRING_SOON' | 'EXPIRED' | 'STAGNANT';
  productId: string;
  productName: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export default function AlertsPage() {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const isPro = true;

  const fetchAlerts = useCallback(async () => {
    if (!isPro || !profile?.organization_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await getAlerts(profile.organization_id);
      if (error) throw new Error(error);
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [isPro, profile?.organization_id]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts, isPro]);

  const handleSync = async () => {
    setIsSyncing(true);
    await fetchAlerts();
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || alert.type === filter;
    return matchesSearch && matchesFilter;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'LOW_STOCK': return <Package className="w-5 h-5" />;
      case 'EXPIRING_SOON': return <Clock className="w-5 h-5" />;
      case 'EXPIRED': return <AlertTriangle className="w-5 h-5" />;
      case 'STAGNANT': return <TrendingDown className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  if (!isPro) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-primary-900" />
        </div>
        <h1 className="text-3xl font-bold text-primary-950 mb-4">Recurso Exclusivo Pro</h1>
        <p className="text-primary-500 max-w-md mb-8">
          A Central de Alertas Inteligentes está disponível apenas para assinantes dos planos Pro e Enterprise. 
          Monitore vencimentos, estoque baixo e produtos parados automaticamente.
        </p>
        <Link href="/dashboard/settings" className="corporate-button-primary">
          Ver Planos de Assinatura
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-950">Central de Alertas</h1>
          <p className="text-primary-500 mt-1">Monitoramento automático de estoque, giro e validade.</p>
        </div>
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="corporate-button-primary flex items-center space-x-2 self-start"
        >
          <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>Sincronizar Alertas</span>
        </button>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-300" />
          <input 
            type="text"
            placeholder="Buscar por produto ou mensagem..."
            className="corporate-input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-300" />
          <select 
            className="corporate-input pl-10 appearance-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todos os Tipos</option>
            <option value="LOW_STOCK">Estoque Baixo</option>
            <option value="EXPIRING_SOON">Próximo ao Vencimento</option>
            <option value="EXPIRED">Vencidos</option>
            <option value="STAGNANT">Sem Giro</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-900 rounded-full animate-spin" />
            <p className="text-primary-500 font-medium">Analisando estoque...</p>
          </div>
        ) : filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert, index) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={alert.id}
              className={`corporate-card p-4 border-l-4 flex items-start space-x-4 ${
                alert.severity === 'critical' ? 'border-l-red-600' : 
                alert.severity === 'high' ? 'border-l-orange-500' :
                alert.severity === 'medium' ? 'border-l-amber-500' : 'border-l-blue-500'
              }`}
            >
              <div className={`p-3 ${alert.severity === 'critical' ? 'text-red-800' : alert.severity === 'high' ? 'text-orange-800' : alert.severity === 'medium' ? 'text-amber-800' : 'text-blue-800'}`}>
                {getIcon(alert.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-primary-900 truncate">{alert.productName}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-primary-600">{alert.message}</p>
                <div className="mt-3 flex items-center space-x-3">
                  <Link href={`/dashboard/inventory?search=${alert.productName}`} className="text-xs font-bold text-primary-900 hover:underline">Ver Produto</Link>
                  <span className="text-primary-200">|</span>
                  <button className="text-xs font-bold text-primary-900 hover:underline">Resolver Alerta</button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="corporate-card p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-primary-900 mb-2">Tudo sob controle!</h3>
            <p className="text-primary-500 max-w-md mx-auto">
              Não foram encontrados alertas críticos no momento. Seu estoque está saudável e dentro dos parâmetros definidos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
