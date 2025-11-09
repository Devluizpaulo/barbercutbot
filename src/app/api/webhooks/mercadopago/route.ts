
import { NextResponse } from 'next/server';
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

// Esta é uma implementação de placeholder para o webhook do Mercado Pago.
// A lógica de processamento de eventos (pagamentos, assinaturas) precisa ser adicionada.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Mercado Pago Webhook Received:', body);

    // TODO: Adicionar lógica para verificar a assinatura da notificação do Mercado Pago.
    
    const { type, data } = body;

    // Idempotency: Check if event has been processed
    if (data?.id) {
        const eventRef = firestore.collection('mercadoPagoEventsProcessed').doc(data.id);
        const doc = await eventRef.get();
        if (doc.exists) {
            console.warn(`[Mercado Pago] Evento duplicado ${data.id}, ignorando.`);
            return NextResponse.json({ received: true, duplicate: true });
        }
        await eventRef.set({
            id: data.id,
            type: type,
            createdAt: Timestamp.now(),
        });
    }


    // TODO: Implementar a lógica para cada tipo de evento do Mercado Pago.
    switch (type) {
      case 'payment':
        const paymentId = data.id;
        // Lógica para quando um pagamento é criado ou atualizado.
        console.log(`Processando evento de pagamento: ${paymentId}`);
        break;
      // Adicionar outros casos de eventos, como 'subscription_preapproval', etc.
      default:
        console.log(`[Mercado Pago] Evento não tratado: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erro no webhook do Mercado Pago:', error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }
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
