# 💳 Arquitetura de Pagamentos (Stripe e Mercado Pago)

Este documento descreve o fluxo de integração com provedores de pagamento para gerenciamento de assinaturas (planos).

---

## 1. Provedores de Pagamento

Atualmente, o sistema possui uma integração completa e ativa com a **Stripe**. A integração com o **Mercado Pago** está em desenvolvimento.

### **Stripe** (Ativo)

#### **1.1. Configuração de Ambiente**

As seguintes variáveis de ambiente são necessárias no arquivo `.env.local`:

```env
# URL pública da aplicação, usada para os callbacks da Stripe.
NEXT_PUBLIC_BASE_URL=http://localhost:9002

# Chave secreta da Stripe. NUNCA exponha no lado do cliente.
STRIPE_SECRET_KEY=sk_test_...

# Segredo do endpoint do webhook, para verificar a autenticidade dos eventos.
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### **1.2. Fluxo de Criação de Assinatura**

O processo de assinatura é iniciado no lado do cliente e orquestrado por uma Cloud Function (Genkit Flow).

1.  **Ação do Cliente**: O usuário clica em "Fazer Upgrade" em um plano na página de configurações.
2.  **Chamada do Flow**: A função `createStripeCheckout` é chamada.
3.  **Genkit Flow (`create-stripe-checkout-flow.ts`)**:
    -   Esta função, executada no servidor, usa a `STRIPE_SECRET_KEY` para criar uma **Sessão de Checkout** na Stripe.
    -   **`metadata`**: **CRUCIAL!** Inclui `shopId`, `userId`, e `planId` para que o webhook saiba qual loja atualizar.
    -   A função retorna a `checkoutUrl` gerada pela Stripe.
4.  **Redirecionamento**: O frontend redireciona o usuário para a página de pagamento da Stripe.

#### **1.3. Webhooks: A Fonte da Verdade**

Os webhooks são o mecanismo que mantém nosso banco de dados sincronizado com os eventos da Stripe.

-   **Endpoint**: `src/app/api/webhooks/stripe/route.ts`
-   **Eventos Tratados**:
    -   `checkout.session.completed`: Atualiza o documento da loja com os detalhes da nova assinatura.
    -   `invoice.payment_succeeded`: Garante que o status da assinatura permaneça `active` em renovações.
    -   `invoice.payment_failed`: Altera o status da assinatura para `past_due`.
    -   `customer.subscription.deleted`: Altera o status para `canceled`.

---

### **Mercado Pago** (Em Desenvolvimento)

A integração com o Mercado Pago seguirá uma arquitetura semelhante à da Stripe.

#### **2.1. Configuração de Ambiente (Planejado)**

Serão necessárias as seguintes variáveis de ambiente:

```env
# Access Token do Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...

# Segredo do endpoint do webhook do Mercado Pago
MERCADO_PAGO_WEBHOOK_SECRET=...
```

#### **2.2. Fluxo de Criação de Assinatura (Planejado)**

1.  **Ação do Cliente**: O usuário selecionaria Mercado Pago como forma de pagamento.
2.  **Chamada do Flow**: Uma nova função, `createMercadoPagoCheckout`, será chamada.
3.  **Genkit Flow (A ser criado)**:
    -   Utilizará o SDK do Mercado Pago para criar uma preferência de pagamento ou um link de assinatura.
    -   Assim como na Stripe, metadados (`shopId`, `userId`) serão anexados à transação.
    -   Retornará uma `checkoutUrl`.
4.  **Redirecionamento**: O frontend redireciona o usuário para o checkout do Mercado Pago.

#### **2.3. Webhooks (Estrutura Inicial Criada)**

-   **Endpoint**: `src/app/api/webhooks/mercadopago/route.ts`
-   **Status Atual**: O endpoint está pronto para receber notificações (`POST`). A lógica interna para processar cada tipo de evento (ex: `payment`, `subscription_preapproval`) ainda precisa ser implementada.
-   **Próximos Passos**: Implementar a validação de segurança e a lógica de atualização do Firestore para cada evento relevante enviado pelo Mercado Pago.

Essa arquitetura modular garante que o sistema possa suportar múltiplos provedores de pagamento de forma segura e resiliente.
