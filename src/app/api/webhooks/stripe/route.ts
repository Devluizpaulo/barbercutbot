
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';

// Lazy initialization of Firebase Admin
let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp({
    ...(process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? { credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)) }
      : {}),
  });
} else {
  adminApp = getApps()[0];
}

const firestore = getFirestore(adminApp);

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
        const { shopId, userId } = session.metadata || {};
        if (!shopId || !userId) {
          console.error('❌ Metadata (shopId or userId) missing in checkout session');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        const shopRef = firestore.doc(`barberShops/${shopId}`);

        await shopRef.update({
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
        
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // As Stripe customer metadata isn't on the invoice, we retrieve it from subscription
        if (!subscription.metadata.shopId) {
          console.error(`❌ shopId not found in subscription metadata for subscription ${subscriptionId}`);
          break;
        }
        
        const shopRef = firestore.doc(`barberShops/${subscription.metadata.shopId}`);
        
        await shopRef.update({
            'subscription.status': 'active',
            'subscription.currentPeriodEnd': Timestamp.fromMillis(subscription.current_period_end * 1000),
        });

        console.log(`✅ Subscription renewal successful for shop ${subscription.metadata.shopId}.`);
      }
      break;

    case 'invoice.payment_failed':
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
      break;
    
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

    