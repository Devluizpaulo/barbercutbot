# 💳 Arquitetura de Pagamentos com Stripe

Este documento descreve o fluxo de integração com a Stripe para gerenciamento de assinaturas (planos).

---

## 1. Configuração de Ambiente

As seguintes variáveis de ambiente são necessárias no arquivo `.env.local`:

```env
# URL pública da aplicação, usada para os callbacks da Stripe.
NEXT_PUBLIC_BASE_URL=http://localhost:9002

# Chave secreta da Stripe. NUNCA exponha no lado do cliente.
STRIPE_SECRET_KEY=sk_test_...

# Segredo do endpoint do webhook, para verificar a autenticidade dos eventos.
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 2. Fluxo de Criação de Assinatura

O processo de assinatura é iniciado no lado do cliente e orquestrado por uma Cloud Function (Genkit Flow).

1.  **Ação do Cliente**: O usuário clica em "Fazer Upgrade" em um plano na página de configurações (`/dashboard/[shopId]/settings`).
2.  **Chamada do Flow**: A função `createStripeCheckout` é chamada, passando `shopId`, `planId`, `priceId` (ID do preço na Stripe), `userId`, e `userEmail`.
3.  **Genkit Flow (`create-stripe-checkout-flow.ts`)**:
    -   Esta função, executada no servidor, usa a `STRIPE_SECRET_KEY` para se comunicar com a API da Stripe.
    -   Ela cria uma **Sessão de Checkout** (`stripe.checkout.sessions.create`) com os seguintes parâmetros:
        -   `mode: 'subscription'`: Indica que é uma compra de assinatura.
        -   `line_items`: Contém o `priceId` do plano selecionado.
        -   `customer_email`: Pré-preenche o e-mail do cliente, permitindo que a Stripe associe a compra a um cliente existente ou crie um novo.
        -   **`metadata`**: **CRUCIAL!** Inclui `shopId`, `userId`, e `planId`. Esses metadados são essenciais para que o webhook saiba qual loja atualizar.
        -   `subscription_data.metadata`: Replica os metadados dentro da assinatura para garantir que eles persistam em eventos futuros (como renovações).
        -   `success_url` e `cancel_url`: Define para onde o usuário será redirecionado após o checkout.
    -   A função retorna a `checkoutUrl` gerada pela Stripe.
4.  **Redirecionamento**: O frontend recebe a URL e redireciona o usuário para a página de pagamento da Stripe.

---

## 3. Webhooks: A Fonte da Verdade

Os webhooks são o mecanismo que mantém nosso banco de dados sincronizado com os eventos que acontecem na Stripe.

-   **Endpoint**: `src/app/api/webhooks/stripe/route.ts`
-   **Verificação**: A função `stripe.webhooks.constructEvent` usa o `STRIPE_WEBHOOK_SECRET` para garantir que o evento veio da Stripe e não foi adulterado.
-   **Idempotência**: Cada evento recebido tem seu `id` salvo na coleção `stripeEventsProcessed`. Se um evento for recebido novamente (a Stripe pode reenviar em caso de falha na primeira entrega), o sistema o ignora, prevenindo processamento duplicado.

### **Eventos Tratados:**

-   `checkout.session.completed`:
    -   **Gatilho**: Disparado quando o usuário completa o pagamento inicial.
    -   **Ação**: Recupera a assinatura (`stripe.subscriptions.retrieve`), extrai os metadados (`shopId`) e atualiza o documento da loja em `/barberShops/{shopId}` com os detalhes da assinatura (`status`, `stripeSubscriptionId`, `stripeCustomerId`, etc.).

-   `invoice.payment_succeeded`:
    -   **Gatilho**: Disparado em renovações de assinatura bem-sucedidas.
    -   **Ação**: Atualiza o `currentPeriodEnd` (data final do período atual) no documento da loja, garantindo que o status da assinatura permaneça `active`.

-   `invoice.payment_failed`:
    -   **Gatilho**: Disparado quando uma cobrança de renovação falha.
    -   **Ação**: Atualiza o status da assinatura no documento da loja para `past_due`.

-   `customer.subscription.deleted`:
    -   **Gatilho**: Disparado quando uma assinatura é cancelada (seja pelo cliente no Portal da Stripe ou via API).
    -   **Ação**: Atualiza o status da assinatura no documento da loja para `canceled`.

---

## 4. Gerenciamento da Assinatura (Portal do Cliente)

-   **Genkit Flow (`create-stripe-portal-session-flow.ts`)**: Cria uma sessão para o Portal do Cliente da Stripe, onde o usuário pode gerenciar seus métodos de pagamento e cancelar a assinatura.
-   **Ação do Usuário**: Ao clicar em "Gerenciar Assinatura", este flow é chamado, e o usuário é redirecionado para o portal seguro da Stripe.

## 5. Cancelamento de Assinatura

-   **Genkit Flow (`cancel-stripe-subscription-flow.ts`)**: Permite o cancelamento de uma assinatura diretamente pela aplicação, se necessário.
-   **Webhook**: O cancelamento dispara o evento `customer.subscription.deleted`, que por sua vez atualiza o status no Firestore.

Essa arquitetura garante um fluxo de pagamento seguro, desacoplado e resiliente, onde o webhook da Stripe atua como a fonte autoritativa da verdade sobre o status das assinaturas.
