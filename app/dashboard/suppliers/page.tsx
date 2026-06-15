'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Truck, X, Loader2, Mail, Phone, MapPin, Trash2 } from 'lucide-react';
import { getSuppliersWithCounts, addSupplier, deleteSupplier } from '@/lib/actions/inventory';

interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  created_at: any;
  products_count?: number;
}

export default function SuppliersPage() {
  const { profile } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    category: 'Geral',
  });

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'manager';

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await getSuppliersWithCounts(profile?.organization_id);
      if (error) throw new Error(error);
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const { error } = await addSupplier({
        ...formData,
        organization_id: profile?.organization_id,
      });

      if (error) throw new Error(error);

      setFormData({ name: '', cnpj: '', email: '', phone: '', address: '', category: 'Geral' });
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (error) {
      console.error('Error adding supplier:', error);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;
    try {
      const { success, error } = await deleteSupplier(id);
      if (!success) throw new Error(error);
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.cnpj?.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-950">Fornecedores</h1>
          <p className="text-primary-500 mt-1">Gerencie seus parceiros e fornecedores de mercadoria.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="corporate-button-primary flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Fornecedor</span>
          </button>
        )}
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
        <input 
          type="text" 
          placeholder="Buscar por nome ou CNPJ..." 
          className="corporate-input pl-12"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-primary-400">
            Nenhum fornecedor encontrado.
          </div>
        ) : (
          filteredSuppliers.map((supplier) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={supplier.id} 
              className="corporate-card p-6 space-y-4 relative group"
            >
              {isAdmin && (
                <button 
                  onClick={() => handleDeleteSupplier(supplier.id)}
                  className="absolute top-4 right-4 p-2 text-primary-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center space-x-4">
                <div className="p-3">
                  <Truck className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-primary-900">{supplier.name}</h3>
                  <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">{supplier.cnpj || 'Sem CNPJ'}</p>
                </div>
              </div>
              
              <div className="space-y-2 pt-2">
                <div className="flex items-center text-sm text-primary-600">
                  <Mail className="w-4 h-4 mr-2 text-primary-400" />
                  <span className="truncate">{supplier.email || '---'}</span>
                </div>
                <div className="flex items-center text-sm text-primary-600">
                  <Phone className="w-4 h-4 mr-2 text-primary-400" />
                  <span>{supplier.phone || '---'}</span>
                </div>
                <div className="flex items-center text-sm text-primary-600">
                  <MapPin className="w-4 h-4 mr-2 text-primary-400" />
                  <span className="truncate">{supplier.address || '---'}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[10px] font-bold bg-primary-50 text-primary-500 px-2 py-1 rounded-md uppercase tracking-wider">
                  {supplier.category}
                </span>
                <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">
                  {supplier.products_count || 0} Produtos
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-primary-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-md border border-primary-100 overflow-hidden"
            >
              <div className="p-6 border-b border-primary-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary-900">Novo Fornecedor</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-primary-400 hover:text-primary-900">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Nome / Razão Social</label>
                  <input 
                    required
                    type="text" 
                    className="corporate-input" 
                    placeholder="Ex: Distribuidora Alimentos S.A."
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">CNPJ</label>
                    <input 
                      type="text" 
                      className="corporate-input" 
                      placeholder="00.000.000/0000-00"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Categoria</label>
                    <select 
                      className="corporate-input"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option>Geral</option>
                      <option>Alimentos</option>
                      <option>Bebidas</option>
                      <option>Limpeza</option>
                      <option>Higiene</option>
                      <option>Logística</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">E-mail</label>
                    <input 
                      type="email" 
                      className="corporate-input" 
                      placeholder="contato@fornecedor.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Telefone</label>
                    <input 
                      type="tel" 
                      className="corporate-input" 
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Endereço Completo</label>
                  <input 
                    type="text" 
                    className="corporate-input" 
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <button type="submit" className="corporate-button-primary w-full mt-4">
                  Cadastrar Fornecedor
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
