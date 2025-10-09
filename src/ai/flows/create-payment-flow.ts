
'use server';

/**
 * @fileOverview A Genkit flow for creating a Mercado Pago payment preference.
 *
 * - createPayment - Creates a payment preference and returns a checkout URL.
 * - CreatePaymentInput - The input type for the createPayment function.
 * - CreatePaymentOutput - The return type for the createPayment function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// WARNING: In a real application, retrieve this securely (e.g., from a secret manager).
// Do NOT hardcode credentials.
const MOCK_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || 'YOUR_MERCADO_PAGO_ACCESS_TOKEN';

const client = new MercadoPagoConfig({ accessToken: MOCK_ACCESS_TOKEN });
const preference = new Preference(client);

const CreatePaymentInputSchema = z.object({
    shopId: z.string().describe('The ID of the barber shop.'),
    planId: z.string().describe('The ID of the subscription plan.'),
    shopName: z.string().describe('The name of the barber shop for the transaction description.'),
    price: z.number().describe('The price of the plan.'),
});
export type CreatePaymentInput = z.infer<typeof CreatePaymentInputSchema>;

const CreatePaymentOutputSchema = z.object({
  checkoutUrl: z.string().describe('The URL for the Mercado Pago checkout page.'),
});
export type CreatePaymentOutput = z.infer<typeof CreatePaymentOutputSchema>;

export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentOutput> {
  return createPaymentFlow(input);
}

const createPaymentFlow = ai.defineFlow(
  {
    name: 'createPaymentFlow',
    inputSchema: CreatePaymentInputSchema,
    outputSchema: CreatePaymentOutputSchema,
  },
  async (input) => {
    
    // In a real scenario, you would have more complex logic here,
    // like validating the planId and fetching its details from your database.

    const body = {
        items: [
            {
                id: input.planId,
                title: `Assinatura Plano Pro - ${input.shopName}`,
                quantity: 1,
                unit_price: input.price,
                currency_id: 'BRL',
            },
        ],
        back_urls: {
            success: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/${input.shopId}/settings?payment=success`,
            failure: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/${input.shopId}/settings?payment=failure`,
            pending: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/${input.shopId}/settings?payment=pending`,
        },
        auto_return: 'approved' as const,
        external_reference: input.shopId,
    };

    try {
        const result = await preference.create({ body });
        if (!result.init_point) {
            throw new Error('Mercado Pago did not return an init_point URL.');
        }
        
        return {
            checkoutUrl: result.init_point,
        };

    } catch (error: any) {
        console.error("Error creating Mercado Pago preference: ", error.cause?.message || error.message);
        throw new Error("Failed to create payment preference with Mercado Pago.");
    }
  }
);
