// Marca este arquivo como Server Action do Next.js
// Todo o código aqui roda APENAS no servidor (nunca no navegador)
'use server';

// Instância do banco de dados configurada em lib/db/index.ts
import { db } from '@/lib/db';

// Importa as tabelas do schema para usar nas queries
import { profiles, organizations, products, stockMovements, inventoryLocations, suppliers, customers, organizationInvites } from '@/lib/db/schema';

// eq: operador de igualdade do Drizzle para filtros WHERE
// inArray: filtro WHERE campo IN (lista de valores)
import { eq, inArray } from 'drizzle-orm';

// bcrypt: biblioteca para criar e verificar hashes de senhas de forma segura
import bcrypt from 'bcryptjs';

// SignJWT: cria tokens JWT assinados / jwtVerify: verifica e decodifica tokens JWT
import { SignJWT, jwtVerify } from 'jose';

// cookies(): API do Next.js para ler/escrever cookies do servidor
import { cookies } from 'next/headers';

// revalidatePath: limpa o cache do Next.js para uma rota específica
import { revalidatePath } from 'next/cache';

// Converte a chave secreta (string) para bytes (Uint8Array) — formato exigido pela lib 'jose'
// Usa AUTH_SECRET do .env, ou uma chave padrão para desenvolvimento
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'nozesfy-secret-key-12345'
);

/**
 * LOGIN — Autentica um usuário com e-mail e senha.
 * Recebe um FormData do formulário, valida as credenciais e cria um cookie de sessão JWT.
 */
export async function login(formData: FormData) {
  // Extrai os campos do formulário (e converte para string com "as string")
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Valida se os campos obrigatórios foram preenchidos
  if (!email || !password) {
    return { error: 'E-mail e senha são obrigatórios.' };
  }

  try {
    // Busca o usuário no banco de dados pelo e-mail
    const user = await db.query.profiles.findFirst({
      where: eq(profiles.email, email), // WHERE email = 'valor digitado'
    });

    // Se não encontrou o usuário, ou se ele não tem senha cadastrada → nega acesso
    if (!user || !user.password) {
      return { error: 'Credenciais inválidas.' };
    }

    // Compara a senha digitada com o hash armazenado no banco
    // bcrypt.compare é assíncrono e retorna true/false
    const passwordsMatch = await bcrypt.compare(password, user.password);

    // Se a senha não bate → nega acesso (mesma mensagem genérica por segurança)
    if (!passwordsMatch) {
      return { error: 'Credenciais inválidas.' };
    }

    // Cria o token JWT com os dados do usuário
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' }) // Algoritmo de assinatura: HMAC-SHA256
      .setIssuedAt()                         // Campo "iat" — momento em que o token foi emitido
      .setExpirationTime('7d')               // Token expira em 7 dias
      .sign(JWT_SECRET);                     // Assina o token com a chave secreta

    // Acessa o gerenciador de cookies do servidor
    const cookieStore = await cookies();

    // Salva o token JWT em um cookie chamado "auth_token"
    cookieStore.set('auth_token', token, {
      httpOnly: true,  // Impede acesso via JavaScript no navegador (proteção XSS)
      secure: process.env.NODE_ENV === 'production', // Só envia por HTTPS em produção
      sameSite: 'lax',                               // Proteção contra CSRF
      maxAge: 60 * 60 * 24 * 7, // Duração do cookie: 7 dias em segundos
    });

    return { success: true }; // Retorna sucesso para o cliente redirecionar
  } catch (error: any) {
    console.error('Login error:', error);
    return { error: 'Erro interno no servidor.' };
  }
}

/**
 * SIGNUP — Cria uma nova conta de usuário.
 * Valida os dados, cria a organização padrão e o perfil do usuário, depois faz login automático.
 */
export async function signup(formData: FormData) {
  // Extrai todos os campos do formulário de cadastro
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;

  // Combina primeiro e último nome, ou usa o campo "name" como fallback
  const name = (firstName && lastName ? `${firstName} ${lastName}` : (formData.get('name') as string)) || null;

  // Validação básica dos campos obrigatórios
  if (!email || !password) {
    return { error: 'E-mail e senha são obrigatórios.' };
  }

  try {
    // Verifica se o e-mail já está cadastrado no banco
    const existing = await db.query.profiles.findFirst({
      where: eq(profiles.email, email),
    });

    // Se já existe um perfil com esse e-mail, rejeita o cadastro
    if (existing) {
      return { error: 'E-mail já cadastrado.' };
    }

    // Criptografa a senha com bcrypt (fator de custo 10 = bom equilíbrio segurança/performance)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Gera IDs únicos para o usuário e para a organização
    const userId = crypto.randomUUID();
    const orgId = crypto.randomUUID();

    // Cria a organização padrão para o novo usuário dono
    await db.insert(organizations).values({
      id: orgId,
      name: `Empresa de ${name}`, // Nome padrão da organização, pode ser alterado depois
    });

    // Cria o perfil do usuário vinculado à organização recém-criada
    await db.insert(profiles).values({
      id: userId,
      email,
      password: hashedPassword,  // Salva apenas o hash, nunca a senha em texto puro
      full_name: name,
      organization_id: orgId,    // Vincula ao ID da organização criada acima
      role: 'owner',             // O primeiro usuário é sempre o dono (owner)
    });

    // Após criar a conta, faz login automático (reutiliza a função login)
    return await login(formData);
  } catch (error: any) {
    console.error('Signup error:', error);
    return { error: 'Erro ao criar conta.' };
  }
}

/**
 * LOGOUT — Remove o cookie de autenticação, encerrando a sessão do usuário.
 */
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token'); // Remove o cookie JWT do navegador
  revalidatePath('/');              // Limpa o cache da página inicial
  return { success: true };
}

/**
 * SETDESKTOPMODE — Ativa ou desativa o modo desktop (aplicativo PyWebView).
 * Quando ativo, a interface se adapta para uso dentro do app desktop.
 */
export async function setDesktopMode(enabled: boolean) {
  const cookieStore = await cookies();
  if (enabled) {
    // Define um cookie permanente identificando que o app está rodando em modo desktop
    cookieStore.set('nozesfy_mode', 'desktop', {
      httpOnly: false, // Permitir leitura pelo cliente se necessário
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // Cookie dura 1 ano
    });
  } else {
    // Remove o cookie de modo desktop, voltando ao modo web normal
    cookieStore.delete('nozesfy_mode');
  }
  return { success: true };
}

/**
 * GETSESSION — Retorna os dados do usuário autenticado, ou null se não estiver logado.
 * É chamada em vários lugares do app para verificar se o usuário tem sessão ativa.
 */
export async function getSession() {
  const cookieStore = await cookies();

  // Tenta obter o token JWT do cookie "auth_token"
  const token = cookieStore.get('auth_token')?.value;

  // Se não há token, não há sessão ativa
  if (!token) return null;

  try {
    // Verifica a assinatura do token e decodifica o payload
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Extrai o ID do usuário do payload do token
    const userId = payload.userId as string;

    // Busca o perfil completo do usuário no banco, incluindo os dados da organização
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      with: {
        organization: true, // JOIN com a tabela organizations (graças ao relation definido no schema)
      }
    });

    // Se o perfil não existe mais no banco (conta deletada), retorna null
    if (!profile) return null;

    // Retorna os dados do perfil com campos extras para conveniência
    return {
      ...profile,                                                            // Espalha todos os campos do perfil
      name: profile.full_name,                                               // Alias para usar "name" em vez de "full_name"
      plan: (profile as any).organization?.subscription_tier || 'basic',    // Plano da organização (fallback: 'basic')
      organizationName: (profile as any).organization?.name,                // Nome da organização
    };
  } catch (error) {
    // Token inválido ou expirado → retorna null (usuário não autenticado)
    return null;
  }
}

/**
 * DELETEACCOUNT — Exclui permanentemente a conta do usuário.
 * Se o usuário for o dono (owner), exclui TODOS os dados da organização.
 * Se for membro, exclui apenas o próprio perfil.
 */
export async function deleteAccount() {
  // Verifica se há uma sessão ativa antes de prosseguir
  const session = await getSession();
  if (!session) return { error: 'Não autorizado' };

  try {
    const userId = session.id;
    const organizationId = session.organization_id;

    if (session.role === 'owner' && organizationId) {
      // ─── OWNER: exclui todos os dados da organização em cascata ───

      // 1. Busca todos os produtos da organização para poder deletar suas movimentações
      //    (necessário por causa das restrições de chave estrangeira no SQLite)
      const productsToDelete = await db.select({ id: products.id })
        .from(products)
        .where(eq(products.organization_id, organizationId));

      // Extrai apenas os IDs dos produtos
      const productIds = productsToDelete.map(p => p.id);

      // 2. Deleta as movimentações de estoque associadas aos produtos (dependência de FK)
      if (productIds.length > 0) {
        await db.delete(stockMovements).where(inArray(stockMovements.product_id, productIds));
      }

      // 3. Deleta todas as entidades pertencentes à organização
      await db.delete(products).where(eq(products.organization_id, organizationId));
      await db.delete(inventoryLocations).where(eq(inventoryLocations.organization_id, organizationId));
      await db.delete(suppliers).where(eq(suppliers.organization_id, organizationId));
      await db.delete(customers).where(eq(customers.organization_id, organizationId));
      await db.delete(organizationInvites).where(eq(organizationInvites.organization_id, organizationId));

      // 4. Deleta os perfis de todos os membros da organização
      await db.delete(profiles).where(eq(profiles.organization_id, organizationId));

      // 5. Por último, deleta a própria organização
      await db.delete(organizations).where(eq(organizations.id, organizationId));
    } else {
      // ─── MEMBRO: exclui apenas o próprio perfil, sem afetar a organização ───
      await db.delete(profiles).where(eq(profiles.id, userId));
    }

    // Faz logout após excluir a conta (remove o cookie de sessão)
    await logout();

    return { success: true };
  } catch (error: any) {
    console.error('Delete account error:', error);
    return { error: 'Erro ao excluir conta: ' + error.message };
  }
}
