
'use server';

/**
 * @fileOverview A Genkit flow for creating a Stripe checkout session for subscriptions.
 *
 * - createStripeCheckout - Creates a Stripe session and returns a checkout URL.
 * - CreateStripeCheckoutInput - The input type for the createStripeCheckout function.
 * - CreateStripeCheckoutOutput - The return type for the createStripeCheckout function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const CreateStripeCheckoutInputSchema = z.object({
    shopId: z.string().describe('The ID of the barber shop.'),
    planId: z.string().describe('The internal ID of the plan (e.g., "lite", "business").'),
    priceId: z.string().describe('The ID of the price in Stripe.'),
    userId: z.string().describe('The Firebase UID of the user.'),
    userEmail: z.string().email().describe('The email address of the user.'),
});
export type CreateStripeCheckoutInput = z.infer<typeof CreateStripeCheckoutInputSchema>;

const CreateStripeCheckoutOutputSchema = z.object({
  checkoutUrl: z.string().url().describe('The URL for the Stripe checkout page.'),
});
export type CreateStripeCheckoutOutput = z.infer<typeof CreateStripeCheckoutOutputSchema>;

export async function createStripeCheckout(input: CreateStripeCheckoutInput): Promise<CreateStripeCheckoutOutput> {
  return createStripeCheckoutFlow(input);
}

const createStripeCheckoutFlow = ai.defineFlow(
  {
    name: 'createStripeCheckoutFlow',
    inputSchema: CreateStripeCheckoutInputSchema,
    outputSchema: CreateStripeCheckoutOutputSchema,
  },
  async (input: CreateStripeCheckoutInput) => {
    
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Stripe Secret Key is not configured. Please set the STRIPE_SECRET_KEY environment variable.');
    }
    
    const { shopId, priceId, userId, userEmail, planId } = input;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            // Important: Pre-fill customer email to link accounts
            customer_email: userEmail,
            // Allow associating with an existing customer by email
            customer_update: {
              name: 'auto',
              address: 'auto',
            },
            // Attach metadata to link the Stripe session to our internal data
            metadata: {
                shopId: shopId,
                userId: userId,
                planId: planId,
            },
            subscription_data: {
                metadata: {
                    shopId: shopId,
                    userId: userId,
                    planId: planId,
                },
            },
            // Define the success and cancel URLs
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/${shopId}/settings?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/${shopId}/settings`,
        });

        if (!session.url) {
            throw new Error('Stripe did not return a session URL.');
        }
        
        return {
            checkoutUrl: session.url,
        };

    } catch (error: any) {
        console.error("Error creating Stripe checkout session: ", error.message);
        throw new Error(`Failed to create checkout session with Stripe: ${error.message}`);
    }
  }
);
