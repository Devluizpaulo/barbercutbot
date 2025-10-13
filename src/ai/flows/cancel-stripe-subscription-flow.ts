
'use server';

/**
 * @fileOverview A Genkit flow for canceling a Stripe subscription.
 *
 * - cancelStripeSubscription - Cancels a subscription immediately.
 * - CancelStripeSubscriptionInput - The input type for the function.
 * - CancelStripeSubscriptionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const CancelStripeSubscriptionInputSchema = z.object({
    stripeSubscriptionId: z.string().describe('The ID of the Stripe subscription to be canceled.'),
});
export type CancelStripeSubscriptionInput = z.infer<typeof CancelStripeSubscriptionInputSchema>;

const CancelStripeSubscriptionOutputSchema = z.object({
  success: z.boolean().describe('Whether the cancellation was successful.'),
  status: z.string().describe('The final status of the subscription.'),
});
export type CancelStripeSubscriptionOutput = z.infer<typeof CancelStripeSubscriptionOutputSchema>;

export async function cancelStripeSubscription(input: CancelStripeSubscriptionInput): Promise<CancelStripeSubscriptionOutput> {
  return cancelStripeSubscriptionFlow(input);
}

const cancelStripeSubscriptionFlow = ai.defineFlow(
  {
    name: 'cancelStripeSubscriptionFlow',
    inputSchema: CancelStripeSubscriptionInputSchema,
    outputSchema: CancelStripeSubscriptionOutputSchema,
  },
  async (input: CancelStripeSubscriptionInput) => {
    
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Stripe Secret Key is not configured.');
    }
    
    const { stripeSubscriptionId } = input;

    try {
        const deletedSubscription = await stripe.subscriptions.cancel(
            stripeSubscriptionId
        );

        return {
            success: true,
            status: deletedSubscription.status,
        };

    } catch (error: any) {
        console.error("Error canceling Stripe subscription: ", error.message);
        throw new Error(`Failed to cancel subscription with Stripe: ${error.message}`);
    }
  }
);
