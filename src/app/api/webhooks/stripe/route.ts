
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { doc, updateDoc, Timestamp, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/firebase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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
        
        const shopRef = doc(firestore, 'barberShops', shopId);

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
      if (invoice.billing_reason === 'subscription_cycle') {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const shopRef = doc(firestore, 'barberShops', invoice.metadata?.shopId);
        
        await updateDoc(shopRef, {
            'subscription.status': 'active',
            'subscription.currentPeriodEnd': Timestamp.fromMillis(subscription.current_period_end * 1000),
        });

        console.log(`✅ Subscription renewal successful for shop ${invoice.metadata?.shopId}.`);
      }
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;
      if (failedInvoice.billing_reason === 'subscription_cycle') {
        const shopRef = doc(firestore, 'barberShops', failedInvoice.metadata?.shopId);
        
        await updateDoc(shopRef, {
            'subscription.status': 'past_due',
        });

        console.warn(`🔔 Subscription payment failed for shop ${failedInvoice.metadata?.shopId}. Status set to past_due.`);
      }
      break;
    
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
