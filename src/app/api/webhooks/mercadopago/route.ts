import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { doc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase'; // Using server-side initialization

// WARNING: In a real application, retrieve this securely (e.g., from a secret manager).
// Do NOT hardcode credentials.
const MOCK_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || 'YOUR_MERCADO_PAGO_ACCESS_TOKEN';

const client = new MercadoPagoConfig({ accessToken: MOCK_ACCESS_TOKEN });
const payment = new Payment(client);

// Initialize Firestore on the server
const { firestore } = initializeFirebase();

/**
 * Handles POST requests from Mercado Pago webhooks.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Webhook received:', body);

    // Mercado Pago sends notifications about different topics.
    // We are interested in the 'payment' topic.
    if (body.type === 'payment' && body.data?.id) {
      const paymentId = body.data.id;

      // Fetch the full payment details from Mercado Pago to get the definitive status
      // and prevent spoofing.
      const paymentDetails = await payment.get({ id: paymentId });
      console.log('Payment details fetched:', paymentDetails);

      if (paymentDetails && paymentDetails.external_reference && paymentDetails.status === 'approved') {
        const shopId = paymentDetails.external_reference;
        const planId = paymentDetails.additional_info?.items?.[0]?.id; // e.g., 'pro'

        // Update the BarberShop document in Firestore
        const shopRef = doc(firestore, 'barberShops', shopId);

        await updateDoc(shopRef, {
          'subscription.status': 'active',
          'subscription.plan': planId,
          'subscription.mercadoPagoId': paymentId,
          'subscription.currentPeriodEnd': new Date(new Date().setMonth(new Date().getMonth() + 1)), // Simple logic for next month
        });

        console.log(`Subscription for shop ${shopId} successfully updated to active.`);
      }
    }

    // Acknowledge receipt of the notification to Mercado Pago
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing Mercado Pago webhook:', error.cause?.message || error.message);
    // Return an error response but still try to send a 2xx status if possible
    // to prevent Mercado Pago from resending the notification repeatedly.
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
