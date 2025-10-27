# Guia de Operação do Stripe (Staging e Produção)

## 1) Variáveis de ambiente

- NEXT_PUBLIC_BASE_URL=https://seu-dominio.com
- STRIPE_SECRET_KEY=sk_live_...
- STRIPE_WEBHOOK_SECRET=whsec_...

Staging (exemplo):
- NEXT_PUBLIC_BASE_URL=https://staging.seu-dominio.com
- STRIPE_SECRET_KEY=sk_test_...
- STRIPE_WEBHOOK_SECRET=whsec_staging_...

Observações:
- STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET nunca devem ir para o client.
- NEXT_PUBLIC_BASE_URL deve apontar para a URL pública do ambiente.

## 2) Webhooks no Dashboard

- Crie um endpoint por ambiente (staging e produção).
- Aponte para:
  - Produção: https://seu-dominio.com/api/webhooks/stripe
  - Staging: https://staging.seu-dominio.com/api/webhooks/stripe
- Selecione eventos:
  - checkout.session.completed
  - invoice.payment_succeeded
  - invoice.payment_failed
- Copie o Secret (whsec_...) e configure no ambiente.

## 3) Fluxo de Checkout e Assinatura

- create-stripe-checkout-flow cria sessão com:
  - mode: subscription
  - metadata: { shopId, userId }
  - subscription_data.metadata: { shopId, userId } (garante metadata nas faturas)
- Após pagamento, o webhook atualiza:
  - barberShops/{shopId}.subscription
  - Campos: status, stripeSubscriptionId, stripeCustomerId, stripePriceId, currentPeriodEnd

## 4) Testes (Stripe CLI)

- Login e forwarding:
  - stripe login
  - stripe listen --forward-to http://localhost:9002/api/webhooks/stripe
- Disparar eventos:
  - stripe trigger checkout.session.completed
  - stripe trigger invoice.payment_succeeded
  - stripe trigger invoice.payment_failed
- Verificar Firestore: barberShops/{shopId}.subscription atualizado

## 5) Idempotência e reentregas de eventos

- Cada evento processado é registrado em /stripeEventsProcessed/{eventId}.
- Reentregas são ignoradas com resposta { duplicate: true }.

## 6) Troubleshooting

- Assinatura sem shopId em invoice:
  - Verifique se subscription_data.metadata foi definido no checkout.
- Atualização no Firestore falhou:
  - Confirme existência de barberShops/{shopId} com permissões corretas e regras publicadas.
- 400 Webhook Error: assinatura inválida
  - Confirme STRIPE_WEBHOOK_SECRET do ambiente correto e que o endpoint está ativo.
- 405 Method Not Allowed
  - O webhook aceita apenas POST. Ajuste ferramenta/cliente.
- Muitos eventos duplicados
  - Verifique se existe only-one endpoint ativo por ambiente ou múltiplos apontando para a mesma URL.

## 7) Rotina operacional

- Após deploy:
  - Validar que NEXT_PUBLIC_BASE_URL e STRIPE_* estão corretas.
  - Checar logs de primeiro checkout e primeiro ciclo de fatura.
- Mudança de plano/cancelamento:
  - Usar flows: createStripePortalSession, cancelStripeSubscription.
  - Confirmar atualização do status em barberShops/{shopId}.subscription.

## 8) Segurança

- CSP libera domínios do Stripe (js.stripe.com, api.stripe.com, r.stripe.com, m.stripe.com).
- Rate limiting ativo para /api e webhooks.
- Nunca expor STRIPE_SECRET_KEY ao client.
