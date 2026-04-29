'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Users, X, Loader2, Mail, Phone, MapPin, Trash2, CreditCard } from 'lucide-react';
import { getCustomers, addCustomer, deleteCustomer } from '@/lib/actions/inventory';

interface Customer {
  id: string;
  name: string;
  cpf_cnpj: string;
  email: string;
  phone: string;
  address: string;
  type: 'Pessoa Física' | 'Pessoa Jurídica';
  created_at: any;
}

export default function CustomersPage() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cpf_cnpj: '',
    email: '',
    phone: '',
    address: '',
    type: 'Pessoa Física' as 'Pessoa Física' | 'Pessoa Jurídica',
  });

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'manager';

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await getCustomers(profile?.organization_id);
      if (error) throw new Error(error);
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const { error } = await addCustomer({
        ...formData,
        organization_id: profile?.organization_id,
      });

      if (error) throw new Error(error);

      setFormData({ name: '', cpf_cnpj: '', email: '', phone: '', address: '', type: 'Pessoa Física' });
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      const { success, error } = await deleteCustomer(id);
      if (!success) throw new Error(error);
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf_cnpj?.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-950">Clientes</h1>
          <p className="text-primary-500 mt-1">Gerencie sua base de clientes e histórico de consumo.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="corporate-button-primary flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Cliente</span>
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
        <input 
          type="text" 
          placeholder="Buscar por nome ou CPF/CNPJ..." 
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
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-primary-400">
            Nenhum cliente encontrado.
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={customer.id} 
              className="corporate-card p-6 space-y-4 relative group"
            >
              {isAdmin && (
                <button 
                  onClick={() => handleDeleteCustomer(customer.id)}
                  className="absolute top-4 right-4 p-2 text-primary-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center space-x-4">
                <div className="p-3">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-primary-900">{customer.name}</h3>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-3 h-3 text-primary-400" />
                    <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">{customer.cpf_cnpj || 'Sem Documento'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 pt-2">
                <div className="flex items-center text-sm text-primary-600">
                  <Mail className="w-4 h-4 mr-2 text-primary-400" />
                  <span className="truncate">{customer.email || '---'}</span>
                </div>
                <div className="flex items-center text-sm text-primary-600">
                  <Phone className="w-4 h-4 mr-2 text-primary-400" />
                  <span>{customer.phone || '---'}</span>
                </div>
                <div className="flex items-center text-sm text-primary-600">
                  <MapPin className="w-4 h-4 mr-2 text-primary-400" />
                  <span className="truncate">{customer.address || '---'}</span>
                </div>
              </div>

              <div className="pt-2">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                  customer.type === 'Pessoa Jurídica' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {customer.type}
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
                <h2 className="text-xl font-bold text-primary-900">Novo Cliente</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-primary-400 hover:text-primary-900">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Nome Completo / Razão Social</label>
                  <input 
                    required
                    type="text" 
                    className="corporate-input" 
                    placeholder="Ex: João da Silva ou Empresa Ltda"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">CPF / CNPJ</label>
                    <input 
                      type="text" 
                      className="corporate-input" 
                      placeholder="000.000.000-00"
                      value={formData.cpf_cnpj}
                      onChange={(e) => setFormData({...formData, cpf_cnpj: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Tipo</label>
                    <select 
                      className="corporate-input"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    >
                      <option value="Pessoa Física">Pessoa Física</option>
                      <option value="Pessoa Jurídica">Pessoa Jurídica</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">E-mail</label>
                    <input 
                      type="email" 
                      className="corporate-input" 
                      placeholder="cliente@email.com"
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
                  <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Endereço</label>
                  <input 
                    type="text" 
                    className="corporate-input" 
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <button type="submit" className="corporate-button-primary w-full mt-4">
                  Cadastrar Cliente
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
