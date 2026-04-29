'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Filter, Package, ArrowUpRight, ArrowDownRight, ArrowLeftRight, X, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { getInventory, getSuppliers, getCustomers, getLocations, addLocation, addProduct, updateStock, deleteLocation } from '@/lib/actions/inventory';

interface Supplier {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  min_quantity: number;
  category: string;
  unit: string;
  price: number;
  barcode: string;
  created_at: any;
  cost_price: number;
  stock_by_location: any;
  expiry_date?: string;
  supplier_id?: string;
}

export default function InventoryPage() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [actionType, setActionType] = useState<'entry' | 'exit' | 'transfer'>('entry');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: 'Geral',
    unit: 'unidade',
    price: '',
    cost_price: '',
    min_quantity: '',
    max_quantity: '',
    location: '',
    expiry_date: '',
    initial_quantity: '',
    supplier_id: '',
  });
  const [actionAmount, setActionAmount] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionLocation, setActionLocation] = useState('');
  const [transferToLocation, setTransferToLocation] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationDesc, setNewLocationDesc] = useState('');
  const [isAddingLocation, setIsAddingLocation] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'manager';

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: inventoryData } = await getInventory(profile?.organization_id);
      setItems(inventoryData || []);

      const { data: supplierData } = await getSuppliers(profile?.organization_id);
      setSuppliers(supplierData || []);

      const { data: customerData } = await getCustomers(profile?.organization_id);
      setCustomers(customerData || []);

      const { data: locationsData } = await getLocations(profile?.organization_id);
      setLocations(locationsData || []);

      if (locationsData && locationsData.length > 0 && !formData.location) {
        setFormData(prev => ({ ...prev, location: locationsData[0].name }));
        setActionLocation(locationsData[0].name);
        if (locationsData.length > 1) {
          setTransferToLocation(locationsData[1].name);
        }
      }

    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.organization_id) {
      fetchData();
    }
  }, [profile?.organization_id]);

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationName || !profile?.organization_id) return;

    setIsAddingLocation(true);
    try {
      const { error } = await addLocation({
        name: newLocationName,
        description: newLocationDesc,
        organization_id: profile.organization_id
      });

      if (error) {
        alert(error);
        return;
      }
      
      setNewLocationName('');
      setNewLocationDesc('');
      fetchData();
    } catch (error: any) {
      console.error('Error adding location:', error);
      alert(`Erro ao adicionar local: ${error.message}`);
    } finally {
      setIsAddingLocation(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Por favor, preencha o nome do produto.');
      return;
    }
    if (locations.length === 0) {
      alert('Você precisa cadastrar pelo menos um Local de Estoque antes de adicionar produtos.');
      setIsLocationModalOpen(true);
      return;
    }

    const targetLocation = formData.location || (locations.length > 0 ? locations[0].name : 'Loja 1');
    const initialQty = parseInt(formData.initial_quantity) || 0;

    try {
      const { error } = await addProduct({
        name: formData.name,
        barcode: formData.barcode,
        category: formData.category,
        unit: formData.unit,
        price: parseFloat(formData.price) || 0,
        cost_price: parseFloat(formData.cost_price) || 0,
        min_quantity: parseInt(formData.min_quantity) || 0,
        max_quantity: parseInt(formData.max_quantity) || 0,
        quantity: initialQty,
        stock_by_location: { [targetLocation]: initialQty },
        expiry_date: formData.expiry_date || null,
        supplier_id: formData.supplier_id || null,
        organization_id: profile?.organization_id,
        user_id: user?.id,
      });

      if (error) throw new Error(error);

      setFormData({ name: '', barcode: '', category: 'Geral', unit: 'unidade', price: '', cost_price: '', min_quantity: '', max_quantity: '', location: '', expiry_date: '', initial_quantity: '', supplier_id: '' });
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error adding product:', error);
      alert(`Erro ao cadastrar produto: ${error.message}`);
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !actionAmount) return;

    const amount = Number(actionAmount);
    const selectedLocation = locations.find(l => l.name === actionLocation);
    const targetLoc = locations.find(l => l.name === transferToLocation);

    try {
      const { success, error } = await updateStock({
        productId: selectedItem.id,
        type: actionType.toUpperCase() as any,
        quantity: amount,
        locationId: selectedLocation?.id,
        targetLocationId: targetLoc?.id,
        reason: actionReason,
        userId: user?.id,
        supplierId: selectedSupplierId,
        customerId: selectedCustomerId
      });

      if (!success) throw new Error(error);

      setIsActionModalOpen(false);
      setActionAmount('');
      setActionReason('');
      setSelectedSupplierId('');
      setSelectedCustomerId('');
      setSelectedItem(null);
      fetchData();
    } catch (error: any) {
      console.error('Error recording movement:', error);
      alert(`Erro: ${error.message}`);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.barcode?.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-950">Estoque</h1>
          <p className="text-primary-500 mt-1">Gerencie e monitore o inventário em tempo real.</p>
        </div>
        <div className="flex items-center space-x-3">

          <button 
            onClick={() => setIsLocationModalOpen(true)}
            className="corporate-button-outline flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Gerenciar Locais</span>
          </button>
          {/* RN-07: Donos de conta básica podem criar produtos até o limite */}
          {isAdmin && (
            <button 
              onClick={() => {
                if (locations.length === 0) {
                  alert('Você precisa cadastrar pelo menos um Local de Estoque primeiro!');
                  setIsLocationModalOpen(true);
                  return;
                }
                setIsModalOpen(true);
              }}
              className="corporate-button-primary flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Novo Produto</span>
            </button>
          )}
        </div>
      </header>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou código..." 
            className="corporate-input pl-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="corporate-button-outline flex items-center justify-center space-x-2">
          <Filter className="w-5 h-5" />
          <span>Filtros</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="corporate-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary-50 border-b border-primary-100">
                <th className="px-6 py-4 text-xs font-bold text-primary-500 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 text-xs font-bold text-primary-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold text-primary-500 uppercase tracking-wider">Quantidade</th>
                <th className="px-6 py-4 text-xs font-bold text-primary-500 uppercase tracking-wider">Preço</th>
                <th className="px-6 py-4 text-xs font-bold text-primary-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-primary-400">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const quantity = (item as any).quantity || 0;
                  const isLowStock = quantity <= item.min_quantity;
                  return (
                    <tr key={item.id} className="hover:bg-primary-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2">
                            <Package className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-bold text-primary-900">{item.name}</p>
                            <p className="text-[10px] text-primary-400 uppercase tracking-wider">{item.barcode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-primary-600 bg-primary-100/50 px-2 py-1 rounded-md">{item.category || 'Geral'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${isLowStock ? 'text-red-600' : 'text-primary-900'}`}>
                            {quantity} {item.unit}
                          </span>
                          {isLowStock && <span className="text-[10px] text-red-500 font-bold uppercase">Estoque Baixo</span>}
                          {/* RN-07: Multiestoque breakdown */}
                          {(item as any).stock_by_location && Object.entries((item as any).stock_by_location).length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {Object.entries((item as any).stock_by_location).map(([loc, qty]) => (
                                <p key={loc} className="text-[9px] text-primary-400 uppercase tracking-tighter">
                                  {loc}: <span className="font-bold">{qty as number}</span>
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-primary-900">R$ {item.price?.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => {
                              setSelectedItem(item);
                              setActionType('entry');
                              setIsActionModalOpen(true);
                            }}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Entrada"
                          >
                            <ArrowUpRight className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedItem(item);
                              setActionType('transfer');
                              setIsActionModalOpen(true);
                            }}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Transferência"
                          >
                            <ArrowLeftRight className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedItem(item);
                              setActionType('exit');
                              setIsActionModalOpen(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Saída"
                          >
                            <ArrowDownRight className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
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
                <h2 className="text-xl font-bold text-primary-900">Novo Produto</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-primary-400 hover:text-primary-900">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddItem} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Nome do Produto</label>
                  <input 
                    required
                    type="text" 
                    className="corporate-input" 
                    placeholder="Ex: Arroz Integral 5kg"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Preço de Venda</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="corporate-input" 
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Preço de Custo</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="corporate-input" 
                      placeholder="0.00"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Unidade</label>
                    <select 
                      className="corporate-input"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    >
                      <option value="unidade">Unidade</option>
                      <option value="kg">Quilo (kg)</option>
                      <option value="caixa">Caixa</option>
                      <option value="litro">Litro</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Quantidade Inicial</label>
                    <input 
                      type="number" 
                      className="corporate-input" 
                      placeholder="0"
                      value={formData.initial_quantity}
                      onChange={(e) => setFormData({...formData, initial_quantity: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Localização Padrão</label>
                    <select 
                      className="corporate-input"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    >
                      {locations.length > 0 ? (
                        locations.map(loc => (
                          <option key={loc.id} value={loc.name}>{loc.name}</option>
                        ))
                      ) : (
                        <option value="">Nenhum local cadastrado</option>
                      )}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Estoque Mínimo</label>
                    <input 
                      type="number" 
                      className="corporate-input" 
                      placeholder="0"
                      value={formData.min_quantity}
                      onChange={(e) => setFormData({...formData, min_quantity: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Estoque Máximo</label>
                    <input 
                      type="number" 
                      className="corporate-input" 
                      placeholder="0"
                      value={formData.max_quantity}
                      onChange={(e) => setFormData({...formData, max_quantity: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Fornecedor Padrão (Opcional)</label>
                  <select 
                    className="corporate-input"
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                  >
                    <option value="">Selecione um fornecedor</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Data de Validade</label>
                  <input 
                    type="date" 
                    className="corporate-input" 
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  />
                </div>
                <button type="submit" className="corporate-button-primary w-full mt-4">
                  Cadastrar Produto
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Movement Modal */}
      <AnimatePresence>
        {isActionModalOpen && selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsActionModalOpen(false)}
              className="absolute inset-0 bg-primary-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-md border border-primary-100 overflow-hidden"
            >
              <div className="p-6 border-b border-primary-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary-900">
                  {actionType === 'entry' ? 'Registrar Entrada' : actionType === 'transfer' ? 'Transferência entre Locais' : 'Registrar Saída'}
                </h2>
                <button onClick={() => setIsActionModalOpen(false)} className="text-primary-400 hover:text-primary-900">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAction} className="p-6 space-y-6">
                <div className="bg-primary-50 p-4 rounded-md">
                  <p className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-1">Produto Selecionado</p>
                  <p className="font-bold text-primary-900">{selectedItem.name}</p>
                  <p className="text-sm text-primary-500 mt-1">
                    Estoque Atual: {
                      actionType === 'transfer' 
                        ? (((selectedItem as any).stock_by_location?.[actionLocation]) || 0)
                        : (selectedItem as any).quantity || 0
                    } {selectedItem.unit}
                    {actionType === 'transfer' && (
                      <span className="ml-1 text-[10px] text-primary-400 font-normal">
                        (em {actionLocation})
                      </span>
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Quantidade</label>
                    <input 
                      required
                      type="number" 
                      className="corporate-input text-2xl font-bold" 
                      placeholder="0"
                      value={actionAmount}
                      onChange={(e) => setActionAmount(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">
                      {actionType === 'transfer' ? 'Origem' : 'Local'}
                    </label>
                    <select 
                      className="corporate-input"
                      value={actionLocation}
                      onChange={(e) => setActionLocation(e.target.value)}
                    >
                      {Array.from(new Set([
                        ...locations.map(l => l.name),
                        ...Object.keys((selectedItem as any)?.stock_by_location || {})
                      ])).filter(name => name).map(locName => (
                        <option key={locName} value={locName}>{locName}</option>
                      ))}
                      {locations.length === 0 && Object.keys((selectedItem as any)?.stock_by_location || {}).length === 0 && (
                        <option value="">Nenhum local cadastrado</option>
                      )}
                    </select>
                  </div>
                </div>

                {actionType === 'transfer' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Destino</label>
                    <select 
                      className="corporate-input"
                      value={transferToLocation}
                      onChange={(e) => setTransferToLocation(e.target.value)}
                    >
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))}
                      {locations.length === 0 && <option value="">Selecione um destino</option>}
                    </select>
                  </div>
                )}

                {actionType === 'entry' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Fornecedor (Opcional)</label>
                    <select 
                      className="corporate-input"
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                    >
                      <option value="">Selecione um fornecedor</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {actionType === 'exit' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Cliente (Opcional)</label>
                    <select 
                      className="corporate-input"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                      <option value="">Selecione um cliente</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-primary-500 uppercase tracking-wider">Motivo / Justificativa</label>
                  <input 
                    required={actionType === 'exit'}
                    type="text" 
                    className="corporate-input" 
                    placeholder="Ex: Venda PDV, Ajuste de inventário..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                  />
                </div>
                <button 
                  type="submit" 
                  className={`w-full py-4 rounded-sm font-bold text-white transition-all active:scale-[0.98] ${
                    actionType === 'entry' ? 'bg-emerald-600 hover:bg-emerald-700' : actionType === 'transfer' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Confirmar {actionType === 'entry' ? 'Entrada' : actionType === 'transfer' ? 'Transferência' : 'Saída'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Location Management Modal */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLocationModalOpen(false)}
              className="absolute inset-0 bg-primary-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-md border border-primary-100 overflow-hidden"
            >
              <div className="p-6 border-b border-primary-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary-900">Gerenciar Locais de Estoque</h2>
                <button onClick={() => setIsLocationModalOpen(false)} className="text-primary-400 hover:text-primary-900">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* New Location Form */}
                <form onSubmit={handleAddLocation} className="space-y-4 bg-primary-50 p-4 rounded-md border border-primary-100">
                  <h3 className="text-sm font-bold text-primary-900 uppercase tracking-tight">Novo Local</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">Nome do Local</label>
                      <input 
                        required
                        type="text" 
                        className="corporate-input bg-white" 
                        placeholder="Ex: Depósito Norte, Loja Centro..."
                        value={newLocationName}
                        onChange={(e) => setNewLocationName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">Descrição (Opcional)</label>
                      <input 
                        type="text" 
                        className="corporate-input bg-white" 
                        placeholder="Rua das Nozes, 123..."
                        value={newLocationDesc}
                        onChange={(e) => setNewLocationDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isAddingLocation}
                    className="corporate-button-primary w-full py-2 text-sm"
                  >
                    {isAddingLocation ? 'Adicionando...' : 'Adicionar Local'}
                  </button>
                </form>

                {/* Locations List */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-primary-900 uppercase tracking-tight">Locais Atuais</h3>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                    {locations.map((loc) => (
                      <div key={loc.id} className="flex items-center justify-between p-3 bg-white border border-primary-100 rounded-md shadow-sm hover:border-primary-300 transition-colors">
                        <div>
                          <p className="font-bold text-primary-900">{loc.name}</p>
                          {loc.description && <p className="text-xs text-primary-400">{loc.description}</p>}
                        </div>
                        <button 
                          onClick={async () => {
                            if (confirm(`Deseja realmente remover o local "${loc.name}"? Isso não afetará os produtos, mas eles ficarão sem referência de local.`)) {
                              const { success, error } = await deleteLocation(loc.id);
                              if (!success) alert(error);
                              fetchData();
                            }
                          }}
                          className="p-2 text-primary-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {locations.length === 0 && (
                      <p className="text-center py-8 text-primary-400 text-sm">Nenhum local cadastrado.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


function AlertTriangle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
