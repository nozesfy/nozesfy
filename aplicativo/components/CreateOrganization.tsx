'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Building2, Plus, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { createOrganization } from '@/lib/actions/inventory';

export default function CreateOrganization() {
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name) return;

    setLoading(true);
    setError(null);

    try {
      const { success, error: orgError } = await createOrganization(user.id, name);

      if (!success) {
        throw new Error(orgError || 'Falha ao criar organização.');
      }

      console.log('Organização e perfil atualizados com sucesso. Recarregando...');
      window.location.reload();
    } catch (err: any) {
      console.error('FULL ERROR STACK:', err);
      // Extrai mensagem útil se disponível
      const errorMessage = err?.message || 'Erro inesperado na criação. Verifique os logs do console.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-sm border border-primary-100 shadow-xl overflow-hidden"
      >
        <div className="bg-primary-900 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Acesso ao Sistema</h2>
          <p className="text-primary-200 mt-2">Você ainda não faz parte de nenhuma empresa. Peça para seu gerente te convidar.</p>
        </div>

        <div className="p-8 space-y-8">
          <div className="text-center">
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-primary-100"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-primary-400 font-bold tracking-widest">OU</span></div>
            </div>
            <p className="text-sm font-medium text-primary-600 mt-2">
              Deseja criar seu próprio estoque e ser o administrador?
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-primary-900 mb-2">
                Nome do Novo Estoque / Empresa
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Meu Estoque Principal"
                className="w-full px-4 py-3 rounded-sm border border-primary-200 focus:ring-2 focus:ring-primary-900 focus:border-transparent outline-none transition-all"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name}
              className="w-full bg-primary-900 text-white py-4 rounded-sm font-bold flex items-center justify-center space-x-2 hover:bg-black transition-colors disabled:opacity-50 shadow-lg shadow-primary-900/10"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Criar Agora e Iniciar</span>
                </>
              )}
            </button>
            
            <p className="text-center text-xs text-primary-400 leading-relaxed">
              Ao criar um novo estoque, você terá controle total sobre produtos, entradas e saídas.
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
