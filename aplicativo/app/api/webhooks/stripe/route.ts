import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as any;

  if (event.type === 'checkout.session.completed') {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    const organizationId = session.metadata.organization_id;

    if (!organizationId) {
      return new NextResponse('Organization ID not found in metadata', { status: 400 });
    }

    // Mapear Price ID para Tier
    let tier = 'basic';
    if (subscription.items.data[0].price.id === process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID) {
      tier = 'pro';
    } else if (subscription.items.data[0].price.id === process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PLAN_PRICE_ID) {
      tier = 'enterprise';
    }

    await db.update(organizations)
      .set({
        subscription_tier: tier,
        subscription_status: subscription.status,
      })
      .where(eq(organizations.id, organizationId));
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as any;
    const organizationId = subscription.metadata.organization_id;

    if (organizationId) {
       // Mapear Price ID para Tier
      let tier = 'basic';
      if (subscription.items.data[0].price.id === process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID) {
        tier = 'pro';
      } else if (subscription.items.data[0].price.id === process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PLAN_PRICE_ID) {
        tier = 'enterprise';
      }

      await db.update(organizations)
        .set({
          subscription_tier: tier,
          subscription_status: subscription.status,
        })
        .where(eq(organizations.id, organizationId));
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as any;
    const organizationId = subscription.metadata.organization_id;

    if (organizationId) {
      await db.update(organizations)
        .set({
          subscription_tier: 'basic',
          subscription_status: 'canceled',
        })
        .where(eq(organizations.id, organizationId));
    }
  }

  return new NextResponse(null, { status: 200 });
}
