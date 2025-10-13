
'use server';

/**
 * @fileOverview A Genkit flow for creating a Stripe Customer Portal session.
 *
 * - createStripePortalSession - Creates a Stripe session and returns a URL to the customer portal.
 * - CreateStripePortalSessionInput - The input type for the createStripePortalSession function.
 * - CreateStripePortalSessionOutput - The return type for the createStripePortalSession function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const CreateStripePortalSessionInputSchema = z.object({
    shopId: z.string().describe('The ID of the barber shop.'),
    stripeCustomerId: z.string().describe('The Stripe Customer ID.'),
});
export type CreateStripePortalSessionInput = z.infer<typeof CreateStripePortalSessionInputSchema>;

const CreateStripePortalSessionOutputSchema = z.object({
  portalUrl: z.string().url().describe('The URL for the Stripe Customer Portal session.'),
});
export type CreateStripePortalSessionOutput = z.infer<typeof CreateStripePortalSessionOutputSchema>;

export async function createStripePortalSession(input: CreateStripePortalSessionInput): Promise<CreateStripePortalSessionOutput> {
  return createStripePortalSessionFlow(input);
}

const createStripePortalSessionFlow = ai.defineFlow(
  {
    name: 'createStripePortalSessionFlow',
    inputSchema: CreateStripePortalSessionInputSchema,
    outputSchema: CreateStripePortalSessionOutputSchema,
  },
  async (input: CreateStripePortalSessionInput) => {
    
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Stripe Secret Key is not configured. Please set the STRIPE_SECRET_KEY environment variable.');
    }
    
    const { shopId, stripeCustomerId } = input;

    try {
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cpanel/shops`,
        });

        if (!portalSession.url) {
            throw new Error('Stripe did not return a portal session URL.');
        }
        
        return {
            portalUrl: portalSession.url,
        };

    } catch (error: any) {
        console.error("Error creating Stripe portal session: ", error.message);
        throw new Error(`Failed to create portal session with Stripe: ${error.message}`);
    }
  }
);
