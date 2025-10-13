
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Lazy load Firebase Admin to avoid build-time errors
let firestore: any = null;

async function getFirestore() {
  if (!firestore) {
    const { firestore: fs } = await import('@/firebase/server');
    firestore = fs;
  }
  return firestore;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

export async function POST(req: Request) {
  const buf = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error message: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`✅ Stripe event received: ${event.type}`);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === 'subscription') {
        // Handle subscription creation
        const { shopId, userId } = session.metadata || {};
        if (!shopId || !userId) {
          console.error('❌ Metadata (shopId or userId) missing in checkout session');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        const db = await getFirestore();
        const { doc, updateDoc, Timestamp } = await import('firebase-admin/firestore');
        const shopRef = doc(db, 'barberShops', shopId);

        await updateDoc(shopRef, {
            'subscription.status': subscription.status,
            'subscription.stripeSubscriptionId': subscription.id,
            'subscription.stripeCustomerId': subscription.customer,
            'subscription.stripePriceId': subscription.items.data[0].price.id,
            'subscription.currentPeriodEnd': Timestamp.fromMillis(subscription.current_period_end * 1000),
        });

        console.log(`✅ Subscription for shop ${shopId} updated.`);
      }
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
        const subscriptionId = invoice.subscription as string;
        const customerId = invoice.customer as string;

        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;

        const shopId = customer.metadata.shopId;
        if (!shopId) break;
        
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const db = await getFirestore();
        const { doc, updateDoc, Timestamp } = await import('firebase-admin/firestore');
        const shopRef = doc(db, 'barberShops', shopId);
        
        await updateDoc(shopRef, {
            'subscription.status': 'active',
            'subscription.currentPeriodEnd': Timestamp.fromMillis(subscription.current_period_end * 1000),
        });

        console.log(`✅ Subscription renewal successful for shop ${shopId}.`);
      }
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;
      if (failedInvoice.billing_reason === 'subscription_cycle' && failedInvoice.subscription) {
        const customerId = failedInvoice.customer as string;
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;

        const shopId = customer.metadata.shopId;
        if (!shopId) break;

        const db = await getFirestore();
        const { doc, updateDoc } = await import('firebase-admin/firestore');
        const shopRef = doc(db, 'barberShops', shopId);
        
        await updateDoc(shopRef, {
            'subscription.status': 'past_due',
        });

        console.warn(`🔔 Subscription payment failed for shop ${shopId}. Status set to past_due.`);
      }
      break;
    
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
