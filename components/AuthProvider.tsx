'use client'; // Este componente roda no navegador (lado do cliente)

// Importa React e seus hooks para gerenciar estado e efeitos colaterais
import React, { createContext, useContext, useEffect, useState } from 'react';

// Importa funções de autenticação do servidor
// getSession: verifica se há sessão ativa / logoutAction: encerra a sessão
import { getSession, logout as logoutAction } from '@/lib/actions/auth';

// ─────────────────────────────────────────────
// TIPAGEM DO CONTEXTO
// Define quais dados e funções estarão disponíveis via useAuth()
// ─────────────────────────────────────────────
interface AuthContextType {
  user: any | null;           // Dados do usuário logado (null se não logado)
  profile: any | null;        // Mesmo que user (mantido para compatibilidade)
  loading: boolean;           // true enquanto a sessão está sendo verificada
  isAdmin: boolean;           // true se o usuário é admin ou owner
  isDesktop: boolean;         // true se está rodando dentro do app desktop (PyWebView)
  logout: () => Promise<void>;    // Função para encerrar a sessão
  refresh: () => Promise<void>;   // Função para recarregar os dados da sessão
}

// Cria o contexto de autenticação com valores padrão (estado inicial)
// Esses valores são usados apenas se o useAuth() for chamado fora do AuthProvider
const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,           // Começa como "carregando" para evitar flash de conteúdo
  isAdmin: false,
  isDesktop: false,
  logout: async () => {},
  refresh: async () => {},
});

// Hook personalizado para acessar o contexto de autenticação em qualquer componente
// Uso: const { user, logout } = useAuth();
export const useAuth = () => useContext(AuthContext);

/**
 * AuthProvider — Componente que envolve toda a aplicação e fornece o contexto de autenticação.
 * Deve ser colocado no layout raiz (app/layout.tsx) para que todos os componentes filhos
 * tenham acesso aos dados de autenticação via useAuth().
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Estado que armazena os dados do perfil do usuário logado
  const [profile, setProfile] = useState<any | null>(null);

  // Estado de carregamento: true enquanto busca a sessão no servidor
  const [loading, setLoading] = useState(true);

  // Estado que indica se a aplicação está rodando no app desktop (PyWebView)
  const [isDesktop, setIsDesktop] = useState(false);

  // Função que busca a sessão atual no servidor e atualiza o estado
  const fetchSession = async () => {
    setLoading(true); // Ativa o loading antes de buscar
    try {
      const session = await getSession(); // Chama a Server Action que lê o cookie JWT
      setProfile(session);               // Salva os dados do usuário (ou null se não logado)
    } catch (error) {
      console.error('Error fetching session:', error);
      setProfile(null); // Em caso de erro, considera o usuário como não logado
    } finally {
      setLoading(false); // Desativa o loading após a busca (com ou sem erro)
    }
  };

  // useEffect sem dependências ([]) = roda uma única vez quando o componente monta
  useEffect(() => {
    fetchSession(); // Verifica a sessão ao carregar a aplicação

    // Verifica se está em modo desktop lendo o cookie "nozesfy_mode" do navegador
    // document.cookie retorna todos os cookies como uma string "nome=valor; nome2=valor2"
    const mode = document.cookie
      .split('; ')                                    // Separa cada cookie em um array
      .find(row => row.startsWith('nozesfy_mode='))   // Encontra o cookie correto
      ?.split('=')[1];                                // Pega o valor após o "="

    // Define como desktop se o valor do cookie for 'desktop'
    setIsDesktop(mode === 'desktop');
  }, []);

  // Função de logout que encerra a sessão e redireciona o usuário
  const logout = async () => {
    await logoutAction(); // Chama a Server Action que remove o cookie JWT

    // Comportamento diferente dependendo do modo (desktop vs web)
    if (isDesktop) {
      // No modo desktop: limpa o cookie de modo e redireciona para o login desktop
      document.cookie = 'nozesfy_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      setProfile(null);
      window.location.href = '/login-desktop'; // Redireciona para o login do app desktop
    } else {
      // No modo web: apenas limpa o perfil e vai para a página inicial
      setProfile(null);
      window.location.href = '/';
    }
  };

  // Objeto com todos os valores que serão disponibilizados via useAuth()
  const value = {
    user: profile, // "user" é um alias para "profile" (mantém compatibilidade com código antigo)
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || profile?.role === 'owner', // Verifica se é admin ou dono
    isDesktop,
    logout,
    refresh: fetchSession, // Expõe a função de re-buscar a sessão
  };

  // Renderiza os filhos imediatamente sem tela de loading para não travar a UI.
  // O estado loading é passado no contexto para quem quiser usar.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
