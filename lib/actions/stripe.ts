'use server';

import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from './auth';

export async function createCheckoutSession(priceId: string) {
  const session = await getSession();
  if (!session || !session.organization_id) {
    throw new Error('Não autenticado ou sem organização.');
  }

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, session.organization_id),
  });

  if (!organization) {
    throw new Error('Organização não encontrada.');
  }

  let stripeCustomerId = organization.stripe_customer_id;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session.email,
      name: organization.name,
      metadata: {
        organization_id: organization.id,
      },
    });
    stripeCustomerId = customer.id;

    await db.update(organizations)
      .set({ stripe_customer_id: stripeCustomerId })
      .where(eq(organizations.id, organization.id));
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?canceled=true`,
    metadata: {
      organization_id: organization.id,
    },
  });

  return { url: checkoutSession.url };
}

export async function createPortalSession() {
  const session = await getSession();
  if (!session || !session.organization_id) {
    throw new Error('Não autenticado.');
  }

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, session.organization_id),
  });

  if (!organization || !organization.stripe_customer_id) {
    throw new Error('Nenhuma assinatura encontrada.');
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: organization.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
  });

  return { url: portalSession.url };
}
