'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { motion } from 'motion/react';
import { History, ArrowUpRight, ArrowDownRight, Package, Clock, User, Loader2, RefreshCw, Download, FileText, BarChart3 } from 'lucide-react';
import { getStockHistory } from '@/lib/actions/inventory';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function HistoryPage() {
  const { profile } = useAuth();
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await getStockHistory(profile?.organization_id);
      if (error) throw new Error(error);
      setMovements(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (movements.length === 0) return;

    const headers = ['Data', 'Produto', 'Tipo', 'Quantidade', 'Saldo Final', 'Local', 'Motivo'];
    const csvRows = movements.map(mov => [
      new Date(mov.created_at).toLocaleString('pt-BR'),
      mov.product?.name || 'N/A',
      mov.type === 'ENTRY' ? 'Entrada' : mov.type === 'EXIT' ? 'Saída' : mov.type === 'TRANSFER' ? 'Transferência' : 'Ajuste',
      mov.quantity,
      mov.new_quantity,
      mov.location?.name || 'Geral',
      mov.reason || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `nozesfy_movimentacoes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (movements.length === 0) return;

    const doc = new jsPDF();
    const tableColumn = ["Data", "Produto", "Tipo", "Qtd", "Saldo", "Local"];
    const tableRows: any[] = [];

    movements.forEach(mov => {
      const rowData = [
        new Date(mov.created_at).toLocaleDateString('pt-BR'),
        mov.product?.name || 'N/A',
        mov.type === 'ENTRY' ? 'Entrada' : mov.type === 'EXIT' ? 'Saída' : mov.type === 'TRANSFER' ? 'Transferência' : 'Ajuste',
        mov.quantity.toString(),
        mov.new_quantity?.toString() || '---',
        mov.location?.name || 'Geral'
      ];
      tableRows.push(rowData);
    });

    // Header styling
    doc.setFontSize(18);
    doc.setTextColor(17, 24, 39); // primary-950
    doc.text("Relatório de Movimentações de Estoque", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // primary-500
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    doc.text(`Organização: ${profile?.organizations?.name || 'Nozesfy'}`, 14, 35);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'striped',
      headStyles: { fillColor: [17, 24, 39], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      styles: { fontSize: 8, cellPadding: 3 }
    });

    doc.save(`relatorio_nozesfy_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'ENTRY': return { icon: ArrowUpRight, color: 'text-emerald-600', label: 'Entrada' };
      case 'EXIT': return { icon: ArrowDownRight, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Saída' };
      case 'TRANSFER': return { icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Transferência' };
      case 'ADJUST': return { icon: RefreshCw, color: 'text-slate-600', bg: 'bg-slate-50', label: 'Ajuste' };
      default: return { icon: Package, color: 'text-primary-600', bg: 'bg-primary-50', label: 'Outro' };
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-950">Histórico de Movimentações</h1>
          <p className="text-primary-500 mt-1">Rastreabilidade completa de todas as entradas e saídas do sistema.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              if (profile?.plan === 'basic') {
                alert('A exportação para Power BI está disponível nos planos Pro e Enterprise. Faça o upgrade para liberar!');
                return;
              }
              exportToCSV();
            }}
            disabled={loading || movements.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-primary-100 rounded-lg text-sm font-bold text-primary-600 hover:bg-primary-50 transition-all disabled:opacity-50"
          >
            <BarChart3 className="w-4 h-4" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[10px] font-bold text-emerald-600 mb-0.5">PRO</span>
              <span>Power BI / CSV</span>
            </div>
          </button>
          <button 
            onClick={exportToPDF}
            disabled={loading || movements.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>Baixar PDF</span>
          </button>
        </div>
      </header>

      <div className="corporate-card overflow-hidden">
        <div className="p-6 border-b border-primary-100 bg-primary-50/50">
          <h2 className="font-bold text-primary-900 flex items-center space-x-2">
            <History className="w-5 h-5 text-primary-400" />
            <span>Últimas 50 Operações</span>
          </h2>
        </div>
        
        <div className="divide-y divide-primary-50">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto" />
            </div>
          ) : movements.length === 0 ? (
            <div className="p-12 text-center text-primary-400">
              Nenhuma movimentação registrada ainda.
            </div>
          ) : (
            movements.map((mov, i) => {
              const config = getIcon(mov.type);
              const date = mov.created_at ? new Date(mov.created_at) : null;
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  key={mov.id} 
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-primary-50/30 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 ${config.color}`}>
                      <config.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-sm font-bold text-primary-900">
                          {mov.product?.name || `Produto (${mov.product_id?.slice(0, 5)})`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center text-xs text-primary-400">
                          <User className="w-3 h-3 mr-1" />
                          {(mov as any).user?.full_name || (mov as any).user?.email || 'Sistema'}
                        </div>
                        <div className="flex items-center text-xs text-primary-400">
                          <Package className="w-3 h-3 mr-1" />
                          {mov.type === 'TRANSFER' ? (
                            <span className="flex items-center">
                              {mov.location?.name || 'Origem'} 
                              <ArrowUpRight className="w-2 h-2 mx-1 text-amber-500" /> 
                              {mov.target_location?.name || 'Destino'}
                            </span>
                          ) : (
                            mov.location?.name || 'Geral'
                          )}
                        </div>
                        <div className="flex items-center text-xs text-primary-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {date ? date.toLocaleString('pt-BR') : '---'}
                        </div>
                      </div>
                      {mov.reason && (
                        <div className="mt-2 p-2 bg-primary-50/50 rounded border border-primary-100/50">
                          <p className="text-[11px] text-primary-600 leading-tight">
                            <span className="font-bold uppercase text-[9px] mr-1 text-primary-400">Justificativa:</span>
                            {mov.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-8">
                    <div className="text-right">
                      <p className={`text-xl font-bold ${config.color}`}>
                        {mov.type.toUpperCase() === 'EXIT' ? '-' : mov.type.toUpperCase() === 'TRANSFER' ? '' : '+'}{mov.quantity}
                      </p>
                      <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">Quantidade</p>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="text-sm font-bold text-primary-900">{mov.new_quantity || '---'}</p>
                      <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">Saldo Final</p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
