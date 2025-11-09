import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';
import { firestore } from '@/firebase/server';

// GET /api/billing/invoices?shopId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    const statusRaw = searchParams.get('status');
    const starting_after = searchParams.get('starting_after') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100);
    if (!shopId) {
      return NextResponse.json({ error: 'Missing shopId' }, { status: 400 });
    }

    // Read shop to get stripeCustomerId
    const snap = await firestore.doc(`barberShops/${shopId}`).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const data = snap.data() as any;
    const customerId: string | undefined = data?.subscription?.stripeCustomerId;

    if (!customerId) {
      // Return empty list gracefully
      return NextResponse.json({ invoices: [] }, { status: 200 });
    }

    const stripe = new Stripe(env().STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

    const params: Stripe.InvoiceListParams = { customer: customerId, limit };
    if (statusRaw && statusRaw !== 'all') params.status = statusRaw as Stripe.InvoiceListParams.Status;
    if (starting_after) params.starting_after = starting_after;
    const list = await stripe.invoices.list(params);

    const invoices = list.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount_due: inv.amount_due,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      created: inv.created ? new Date(inv.created * 1000).toISOString() : null,
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: (inv as any).invoice_pdf ?? null,
    }));

    return NextResponse.json({ invoices, has_more: list.has_more, next_cursor: list.data.at(-1)?.id || null });
  } catch (err: any) {
    console.error('GET /api/billing/invoices error', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
