
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { env } from '@/lib/env';

// Lazy initialization of Firebase Admin
let adminApp: App;
if (!getApps().length) {
  const credsJson = env().GOOGLE_APPLICATION_CREDENTIALS;
  adminApp = initializeApp({
    ...(credsJson ? { credential: cert(JSON.parse(credsJson)) } : {}),
  });
} else {
  adminApp = getApps()[0];
}

const firestore = getFirestore(adminApp);

const isProd = env().NODE_ENV === 'production';
const secretKey = env().STRIPE_SECRET_KEY;
const webhookSecret = env().STRIPE_WEBHOOK_SECRET;
if (isProd && (!secretKey || !webhookSecret)) {
  throw new Error('Stripe environment variables are not configured');
}
const stripe = new Stripe(secretKey || 'sk_test_placeholder', {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  const buf = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return new NextResponse('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret || '');
  } catch (err: any) {
    console.error(`❌ Error message: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`✅ Stripe event received: ${event.type}`);

  // Idempotency guard: ensure each event is processed once
  try {
    const processedRef = firestore.collection('stripeEventsProcessed').doc(event.id);
    await processedRef.create({
      id: event.id,
      type: event.type,
      createdAt: Timestamp.now(),
    });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : '';
    if (e?.code === 6 || msg.includes('ALREADY_EXISTS')) {
      console.warn(`⚠️ Duplicate Stripe event ${event.id}, skipping.`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error('❌ Idempotency guard failed', e);
    return new NextResponse('Internal error', { status: 500 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      try {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          const { shopId, userId, planId } = session.metadata || {};
          if (!shopId || !userId) {
            console.error('❌ Metadata (shopId or userId) missing in checkout session');
            break;
          }
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const shopRef = firestore.doc(`barberShops/${shopId}`);
          await shopRef.update({
              'subscription.plan': planId,
              'subscription.status': subscription.status,
              'subscription.stripeSubscriptionId': subscription.id,
              'subscription.stripeCustomerId': subscription.customer,
              'subscription.stripePriceId': subscription.items.data[0].price.id,
              'subscription.currentPeriodEnd': Timestamp.fromMillis(subscription.current_period_end * 1000),
          });
          console.log(`✅ Subscription for shop ${shopId} updated.`);
        }
      } catch (e) {
        console.error('❌ Error processing checkout.session.completed', e);
      }
      break;

    case 'invoice.payment_succeeded':
      try {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
          const subscriptionId = invoice.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          if (!subscription.metadata.shopId) {
            console.error(`❌ shopId not found in subscription metadata for subscription ${subscriptionId}`);
            break;
          }
          const shopRef = firestore.doc(`barberShops/${subscription.metadata.shopId}`);
          await shopRef.update({
              'subscription.plan': subscription.metadata.planId || null,
              'subscription.status': 'active',
              'subscription.currentPeriodEnd': Timestamp.fromMillis(subscription.current_period_end * 1000),
          });
          console.log(`✅ Subscription renewal successful for shop ${subscription.metadata.shopId}.`);
        }
      } catch (e) {
        console.error('❌ Error processing invoice.payment_succeeded', e);
      }
      break;

    case 'invoice.payment_failed':
      try {
        const failedInvoice = event.data.object as Stripe.Invoice;
        if (failedInvoice.billing_reason === 'subscription_cycle' && failedInvoice.subscription) {
          const subscriptionId = failedInvoice.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          if (!subscription.metadata.shopId) {
            console.error(`❌ shopId not found in subscription metadata for subscription ${subscriptionId}`);
            break;
          }
          const shopRef = firestore.doc(`barberShops/${subscription.metadata.shopId}`);
          await shopRef.update({
              'subscription.status': 'past_due',
          });
          console.warn(`🔔 Subscription payment failed for shop ${subscription.metadata.shopId}. Status set to past_due.`);
        }
      } catch (e) {
        console.error('❌ Error processing invoice.payment_failed', e);
      }
      break;
    
    case 'customer.subscription.deleted':
      try {
          const subscription = event.data.object as Stripe.Subscription;
          if (!subscription.metadata.shopId) {
              console.error(`❌ shopId not found in subscription metadata for subscription ${subscription.id}`);
              break;
          }
          const shopRef = firestore.doc(`barberShops/${subscription.metadata.shopId}`);
          await shopRef.update({
              'subscription.status': 'canceled',
          });
          console.log(`✅ Subscription for shop ${subscription.metadata.shopId} was canceled.`);
      } catch (e) {
          console.error('❌ Error processing customer.subscription.deleted', e);
      }
      break;

    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return new NextResponse('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}

export async function PUT() {
  return new NextResponse('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}

export async function PATCH() {
  return new NextResponse('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}

export async function DELETE() {
  return new NextResponse('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
