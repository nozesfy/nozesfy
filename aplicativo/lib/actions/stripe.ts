// Marca este arquivo como Server Action do Next.js (roda apenas no servidor)
'use server';

// Instância do cliente Stripe configurada em lib/stripe.ts
import { stripe } from '@/lib/stripe';

// Instância do banco de dados
import { db } from '@/lib/db';

// Tabela de organizações para buscar/atualizar dados do cliente Stripe
import { organizations } from '@/lib/db/schema';

// Operador de filtro de igualdade do Drizzle ORM
import { eq } from 'drizzle-orm';

// Função para verificar a sessão do usuário logado
import { getSession } from './auth';

/**
 * CREATECHECKOUTSESSION — Cria uma sessão de pagamento no Stripe Checkout.
 * O usuário é redirecionado para a página de pagamento do Stripe para assinar um plano.
 *
 * @param priceId - ID do preço do produto no Stripe (ex: "price_1OxYZ...")
 */
export async function createCheckoutSession(priceId: string) {
  // Verifica se o usuário está autenticado e tem uma organização
  const session = await getSession();
  if (!session || !session.organization_id) {
    throw new Error('Não autenticado ou sem organização.');
  }

  // Busca os dados da organização no banco para verificar se já tem um cliente Stripe
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, session.organization_id),
  });

  // Se a organização não existe no banco, lança um erro
  if (!organization) {
    throw new Error('Organização não encontrada.');
  }

  // Obtém o ID do cliente Stripe (pode ser null se nunca assinou antes)
  let stripeCustomerId = organization.stripe_customer_id;

  // Se a organização ainda não tem um cliente Stripe, cria um novo
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session.email!,       // E-mail do usuário para o Stripe
      name: organization.name,     // Nome da organização
      metadata: {
        organization_id: organization.id, // Metadado para vincular o cliente Stripe à organização
      },
    });
    stripeCustomerId = customer.id; // Salva o novo ID gerado pelo Stripe

    // Persiste o ID do cliente Stripe no banco de dados da organização
    await db.update(organizations)
      .set({ stripe_customer_id: stripeCustomerId })
      .where(eq(organizations.id, organization.id));
  }

  // Cria a sessão de checkout no Stripe com o produto/preço escolhido
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,  // Vincula ao cliente Stripe já existente (ou recém-criado)
    line_items: [
      {
        price: priceId,   // ID do preço/plano escolhido pelo usuário
        quantity: 1,      // Quantidade: 1 assinatura
      },
    ],
    mode: 'subscription',          // Modo de pagamento recorrente (não pagamento único)
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=true`,  // Redireciona após sucesso
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?canceled=true`,  // Redireciona após cancelamento
    metadata: {
      organization_id: organization.id, // Metadado para identificar a organização no webhook
    },
  });

  // Retorna a URL da página de pagamento do Stripe para redirecionar o usuário
  return { url: checkoutSession.url };
}

/**
 * CREATEPORTALSESSION — Cria uma sessão no Portal de Faturamento do Stripe.
 * Permite ao usuário gerenciar sua assinatura (cancelar, atualizar cartão, ver faturas).
 */
export async function createPortalSession() {
  // Verifica se o usuário está autenticado
  const session = await getSession();
  if (!session || !session.organization_id) {
    throw new Error('Não autenticado.');
  }

  // Busca os dados da organização, incluindo o ID do cliente Stripe
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, session.organization_id),
  });

  // Se não tem cliente Stripe, não pode abrir o portal (nunca assinou)
  if (!organization || !organization.stripe_customer_id) {
    throw new Error('Nenhuma assinatura encontrada.');
  }

  // Cria a sessão no Portal de Faturamento do Stripe
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: organization.stripe_customer_id, // Cliente Stripe da organização
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`, // Para onde voltar após gerenciar
  });

  // Retorna a URL do portal para redirecionar o usuário
  return { url: portalSession.url };
}
