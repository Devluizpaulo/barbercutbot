import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';
import { firestore } from '@/firebase/server';

// GET /api/billing/subscriptions?shopId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    if (!shopId) {
      return NextResponse.json({ error: 'Missing shopId' }, { status: 400 });
    }

    const snap = await firestore.doc(`barberShops/${shopId}`).get();
    if (!snap.exists) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    const data = snap.data() as any;
    const customerId: string | undefined = data?.subscription?.stripeCustomerId;

    if (!customerId) return NextResponse.json({ subscriptions: [] }, { status: 200 });

    const stripe = new Stripe(env().STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

    const list = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      expand: ['data.items.data.price.product'],
      limit: 20,
    });

    const subscriptions = list.data.map((s) => ({
      id: s.id,
      status: s.status,
      currency: s.currency,
      current_period_start: s.current_period_start ? new Date(s.current_period_start * 1000).toISOString() : null,
      current_period_end: s.current_period_end ? new Date(s.current_period_end * 1000).toISOString() : null,
      items: s.items.data.map((it) => ({
        id: it.id,
        priceId: it.price.id,
        productId: typeof it.price.product === 'string' ? it.price.product : it.price.product?.id,
        productName: typeof it.price.product === 'string' ? undefined : (it.price.product as any)?.name,
        recurringInterval: it.price.recurring?.interval,
        metadata: (it.price as any).metadata || {},
      })),
    }));

    return NextResponse.json({ subscriptions });
  } catch (err: any) {
    console.error('GET /api/billing/subscriptions error', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
