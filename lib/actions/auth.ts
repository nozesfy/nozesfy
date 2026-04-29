'use server';

import { db } from '@/lib/db';
import { profiles, organizations, products, stockMovements, inventoryLocations, suppliers, customers, organizationInvites } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'nozesfy-secret-key-12345'
);

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'E-mail e senha são obrigatórios.' };
  }

  try {
    const user = await db.query.profiles.findFirst({
      where: eq(profiles.email, email),
    });

    if (!user || !user.password) {
      return { error: 'Credenciais inválidas.' };
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch) {
      return { error: 'Credenciais inválidas.' };
    }

    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return { success: true };
  } catch (error: any) {
    console.error('Login error:', error);
    return { error: 'Erro interno no servidor.' };
  }
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const name = (firstName && lastName ? `${firstName} ${lastName}` : (formData.get('name') as string)) || null;

  if (!email || !password) {
    return { error: 'E-mail e senha são obrigatórios.' };
  }

  try {
    // Verificar se já existe
    const existing = await db.query.profiles.findFirst({
      where: eq(profiles.email, email),
    });

    if (existing) {
      return { error: 'E-mail já cadastrado.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    // Criar organização padrão para o novo usuário
    const orgId = crypto.randomUUID();
    await db.insert(organizations).values({
      id: orgId,
      name: `Empresa de ${name}`,
    });

    await db.insert(profiles).values({
      id: userId,
      email,
      password: hashedPassword,
      full_name: name,
      organization_id: orgId,
      role: 'owner',
    });

    return await login(formData);
  } catch (error: any) {
    console.error('Signup error:', error);
    return { error: 'Erro ao criar conta.' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  revalidatePath('/');
  return { success: true };
}

export async function setDesktopMode(enabled: boolean) {
  const cookieStore = await cookies();
  if (enabled) {
    cookieStore.set('nozesfy_mode', 'desktop', {
      httpOnly: false, // Permitir leitura pelo cliente se necessário
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 ano
    });
  } else {
    cookieStore.delete('nozesfy_mode');
  }
  return { success: true };
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      with: {
        organization: true,
      }
    });

    if (!profile) return null;

    return {
      ...profile,
      name: profile.full_name,
      plan: (profile as any).organization?.subscription_tier || 'basic',
      organizationName: (profile as any).organization?.name,
    };
  } catch (error) {
    return null;
  }
}

export async function deleteAccount() {
  const session = await getSession();
  if (!session) return { error: 'Não autorizado' };

  try {
    const userId = session.id;
    const organizationId = session.organization_id;

    if (session.role === 'owner' && organizationId) {
      // Se for dono, deleta TUDO da organização
      
      // 1. Buscar produtos para deletar movimentos (foreign key constraint)
      const productsToDelete = await db.select({ id: products.id })
        .from(products)
        .where(eq(products.organization_id, organizationId));
      
      const productIds = productsToDelete.map(p => p.id);

      if (productIds.length > 0) {
        await db.delete(stockMovements).where(inArray(stockMovements.product_id, productIds));
      }

      // 2. Deletar outras entidades da organização
      await db.delete(products).where(eq(products.organization_id, organizationId));
      await db.delete(inventoryLocations).where(eq(inventoryLocations.organization_id, organizationId));
      await db.delete(suppliers).where(eq(suppliers.organization_id, organizationId));
      await db.delete(customers).where(eq(customers.organization_id, organizationId));
      await db.delete(organizationInvites).where(eq(organizationInvites.organization_id, organizationId));
      
      // 3. Deletar outros perfis da mesma organização (se houver)
      await db.delete(profiles).where(eq(profiles.organization_id, organizationId));
      
      // 4. Deletar a organização
      await db.delete(organizations).where(eq(organizations.id, organizationId));
    } else {
      // Se for apenas membro, deleta apenas o próprio perfil
      await db.delete(profiles).where(eq(profiles.id, userId));
    }

    // Logout
    await logout();

    return { success: true };
  } catch (error: any) {
    console.error('Delete account error:', error);
    return { error: 'Erro ao excluir conta: ' + error.message };
  }
}

