'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { motion } from 'motion/react';
import { TrendingUp, AlertTriangle, Package, ArrowUpRight, ArrowDownRight, Activity, Loader2, Lock, RefreshCw } from 'lucide-react';
import { getDashboardStats } from '@/lib/actions/inventory';

import CreateOrganization from '@/components/CreateOrganization';

export default function Dashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'manager';
    const [stats, setStats] = useState([
      { label: 'Total em Estoque', value: '0', icon: Package, color: 'text-blue-600' },
      { label: 'Valorização Total', value: 'R$ 0', icon: TrendingUp, color: 'text-emerald-600' },
      { label: 'Alertas Críticos', value: '0', icon: AlertTriangle, color: 'text-red-600' },
      { label: 'Perdas em Ajustes', value: 'R$ 0', icon: ArrowDownRight, color: 'text-amber-600' },
    ]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);



  const fetchData = async () => {
    if (!profile?.organization_id) return;
    setLoading(true);
    try {
      const { data, error } = await getDashboardStats(profile.organization_id);
      if (error) throw new Error(error);

      if (data) {
        setAlerts(data.alerts);
        setTopProducts(data.topProducts);
        setRecentActivity(data.movements.map((m: any) => ({
          ...m,
          productName: m.product?.name,
          userName: (m as any).user?.full_name || (m as any).user?.email || 'Sistema',
          timestamp: m.created_at
        })));

        setStats(prev => [
          { ...prev[0], value: data.stats.totalStock.toLocaleString() },
          { ...prev[1], value: `R$ ${data.stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
          { ...prev[2], value: data.stats.criticalCount.toString() },
          { ...prev[3], value: `R$ 0,00` } // Ajuste opcional se houver campo de perdas
        ]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.organization_id) {
      fetchData();
    }
  }, [profile?.organization_id]);

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '---';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return date.toLocaleDateString();
  };

  if (!profile?.organization_id) {
    return <CreateOrganization />;
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-950">Olá, {profile?.name?.split(' ')[0]}</h1>
          <p className="text-primary-500 mt-1">Aqui está o resumo operacional do seu estoque hoje.</p>
        </div>

      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          // RN-06: Operador não pode ver custos/preços (confidencial)
          if (!isAdmin && (stat.label === 'Valorização Total' || stat.label === 'Perdas em Ajustes')) {
            return null;
          }
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="corporate-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="flex items-center text-sm font-bold text-emerald-600">
                  Tempo Real
                  <Activity className="w-4 h-4 ml-1" />
                </div>
              </div>
              <p className="text-sm font-medium text-primary-500">{stat.label}</p>
              <p className="text-3xl font-bold text-primary-900 mt-1">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="corporate-card"
        >
          <div className="p-6 border-b border-primary-100 flex items-center justify-between">
            <h2 className="font-bold text-primary-900 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-primary-400" />
              <span>Atividade Recente</span>
            </h2>
            <button 
              onClick={() => router.push('/dashboard/history')}
              className="text-xs font-bold text-primary-500 hover:text-primary-900 transition-colors"
            >
              Ver Tudo
            </button>
          </div>
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-primary-200 animate-spin" />
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-center text-primary-400 py-8">Nenhuma atividade registrada.</p>
            ) : (
              recentActivity.map((activity, i) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${activity.type === 'ENTRY' ? 'bg-emerald-500' : activity.type === 'EXIT' ? 'bg-blue-500' : activity.type === 'TRANSFER' ? 'bg-amber-500' : 'bg-amber-500'}`} />
                    <div>
                      <p className="text-sm font-bold text-primary-900">{activity.productName || 'Produto'}</p>
                      <p className="text-xs text-primary-400">
                        {activity.type === 'ENTRY' ? 'Entrada' : activity.type === 'EXIT' ? 'Saída' : activity.type === 'TRANSFER' ? 'Transferência' : 'Ajuste'} de {activity.quantity} por {activity.userName || 'Usuário'}
                      </p>
                      <p className="text-[10px] text-primary-300 flex items-center mt-0.5">
                        <Package className="w-2 h-2 mr-1" />
                        {activity.type === 'TRANSFER' ? (
                          <> {activity.location?.name} → {activity.target_location?.name} </>
                        ) : (
                          activity.location?.name || 'Geral'
                        )}
                      </p>
                      {activity.reason && (
                        <p className="text-[9px] text-primary-400 mt-0.5 italic line-clamp-1">
                          "{activity.reason}"
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-primary-400 font-medium">{formatTime(activity.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="corporate-card"
        >
          <div className="p-6 border-b border-primary-100 flex items-center justify-between">
            <h2 className="font-bold text-primary-900 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Central de Alertas Inteligentes</span>
            </h2>
            <span className="text-xs font-bold bg-primary-100 text-primary-600 px-2 py-1 rounded-full">
              {alerts.length} Notificações
            </span>
          </div>
          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-center text-primary-400 py-8">Nenhum alerta pendente.</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border flex items-start space-x-3 ${
                  alert.type === 'CRITICAL' ? 'bg-red-50 border-red-100' : 
                  alert.type === 'WARNING' ? 'bg-amber-50 border-amber-100' : 
                  'bg-blue-50 border-blue-100'
                }`}>
                  <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    alert.type === 'CRITICAL' ? 'text-red-500' : 
                    alert.type === 'WARNING' ? 'text-amber-500' : 
                    'text-blue-500'
                  }`} />
                  <div>
                    <p className={`text-sm font-bold ${
                      alert.type === 'CRITICAL' ? 'text-red-900' : 
                      alert.type === 'WARNING' ? 'text-amber-900' : 
                      'text-blue-900'
                    }`}>{alert.title}</p>
                    <p className="text-xs text-primary-600 mt-0.5">{alert.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
          className="corporate-card"
        >
          <div className="p-6 border-b border-primary-100 flex items-center justify-between">
            <h2 className="font-bold text-primary-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span>Top 5 Produtos (Mais Vendidos)</span>
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-center text-primary-400 py-8">Dados insuficientes.</p>
            ) : (
              topProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-primary-300 w-4">{i + 1}.</span>
                    <p className="text-sm font-bold text-primary-900">{product.name}</p>
                  </div>
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">
                    {product.qty} vendidos
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="corporate-card bg-primary-900 text-white overflow-hidden relative"
        >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Package className="w-32 h-32" />
        </div>
        <div className="p-8 relative z-10 h-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold leading-tight">
              Otimize sua logística com relatórios avançados.
            </h2>
            <p className="text-primary-300 mt-4 leading-relaxed">
              Acesse insights profundos sobre o comportamento do seu estoque e evite perdas por validade ou falta de produto.
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/history')}
            className="bg-white text-primary-900 hover:bg-primary-50 px-8 py-4 rounded-sm font-bold transition-colors whitespace-nowrap flex items-center space-x-2"
          >
            <span>Acessar BI Corporativo</span>
          </button>
        </div>
      </motion.div>
      </div>
    </div>
  );
}

