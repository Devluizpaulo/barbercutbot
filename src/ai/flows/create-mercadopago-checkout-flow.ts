
'use server';

/**
 * @fileOverview Placeholder para um Genkit flow que cria uma sessão de checkout no Mercado Pago.
 *
 * - createMercadoPagoCheckout - Função que irá criar a sessão e retornar a URL.
 * - CreateMercadoPagoCheckoutInput - Tipo de entrada para a função.
 * - CreateMercadoPagoCheckoutOutput - Tipo de retorno da função.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// TODO: Instalar e importar o SDK do Mercado Pago: `npm install mercadopago`
// import mercadopago from 'mercadopago';

// Configuração do Mercado Pago (deve ser feita uma única vez)
// if (process.env.MERCADO_PAGO_ACCESS_TOKEN) {
//   mercadopago.configure({
//     access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
//   });
// }

const CreateMercadoPagoCheckoutInputSchema = z.object({
    shopId: z.string().describe('The ID of the barber shop.'),
    planId: z.string().describe('The internal ID of the plan (e.g., "lite", "business").'),
    priceId: z.string().describe('The ID of the price in Mercado Pago (se aplicável).'),
    userId: z.string().describe('The Firebase UID of the user.'),
    userEmail: z.string().email().describe('The email address of the user.'),
    price: z.number().describe('The price of the plan.'),
    planName: z.string().describe('The name of the plan.'),
});
export type CreateMercadoPagoCheckoutInput = z.infer<typeof CreateMercadoPagoCheckoutInputSchema>;

const CreateMercadoPagoCheckoutOutputSchema = z.object({
  checkoutUrl: z.string().url().describe('The URL for the Mercado Pago checkout page.'),
});
export type CreateMercadoPagoCheckoutOutput = z.infer<typeof CreateMercadoPagoCheckoutOutputSchema>;

export async function createMercadoPagoCheckout(input: CreateMercadoPagoCheckoutInput): Promise<CreateMercadoPagoCheckoutOutput> {
  return createMercadoPagoCheckoutFlow(input);
}

const createMercadoPagoCheckoutFlow = ai.defineFlow(
  {
    name: 'createMercadoPagoCheckoutFlow',
    inputSchema: CreateMercadoPagoCheckoutInputSchema,
    outputSchema: CreateMercadoPagoCheckoutOutputSchema,
  },
  async (input: CreateMercadoPagoCheckoutInput) => {
    
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
        throw new Error('MERCADO_PAGO_ACCESS_TOKEN não está configurado.');
    }
    
    const { shopId, planId, userId, userEmail, price, planName } = input;

    // Lógica para criar a preferência de pagamento no Mercado Pago
    // A implementação abaixo é um exemplo e precisa ser adaptada para a lógica
    // de assinaturas do Mercado Pago (Subscription API).
    
    const preference = {
      items: [
        {
          title: `Assinatura Plano ${planName} - BarberCut Bot`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: price,
        },
      ],
      payer: {
        email: userEmail,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/${shopId}/settings?mp_status=success`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/${shopId}/settings?mp_status=failure`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/${shopId}/settings?mp_status=pending`,
      },
      auto_return: 'approved',
      external_reference: `${shopId}|${userId}|${planId}`, // Salva metadados importantes
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
    };

    try {
        // Exemplo de como seria a chamada com o SDK
        // const response = await mercadopago.preferences.create(preference);
        // const checkoutUrl = response.body.init_point;
        
        // **URL de placeholder enquanto o SDK não é integrado**
        const checkoutUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=placeholder-id-for-${planId}`;

        if (!checkoutUrl) {
            throw new Error('O Mercado Pago não retornou uma URL de checkout.');
        }
        
        return {
            checkoutUrl,
        };

    } catch (error: any) {
        console.error("Erro ao criar preferência no Mercado Pago: ", error.message);
        throw new Error(`Falha ao criar sessão de checkout com Mercado Pago: ${error.message}`);
    }
  }
);
