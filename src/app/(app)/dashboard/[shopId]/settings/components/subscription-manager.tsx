
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, LoaderCircle, ExternalLink, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLANS, Plan } from '@/lib/plans';
import { createStripeCheckout } from '@/ai/flows/create-stripe-checkout-flow';
import { createStripePortalSession } from '@/ai/flows/create-stripe-portal-session-flow';
import { cancelStripeSubscription } from '@/ai/flows/cancel-stripe-subscription-flow';
import type { BarberShop } from '@/lib/types';
import { format, differenceInDays } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';


interface SubscriptionManagerProps {
  shopId: string;
  shop: BarberShop;
}

const toDate = (timestamp: Timestamp | Date | string | undefined): Date | null => {
    if (!timestamp) return null;
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
}

function SubscriptionStatusBanner({ shop }: { shop: BarberShop }) {
    const status = shop.subscription?.status;
    const periodEnd = toDate(shop.subscription?.currentPeriodEnd);

    if (!status || !periodEnd) {
        return null;
    }
    
    if (status === 'trialing') {
        const daysLeft = differenceInDays(periodEnd, new Date());
        return (
            <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                <AlertTitle className="font-bold text-blue-800 dark:text-blue-200">Você está em um período de teste!</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                    Seu período de teste gratuito termina em <strong>{daysLeft} dia{daysLeft !== 1 ? 's' : ''}</strong> (em {format(periodEnd, 'dd/MM/yyyy')}). Aproveite todos os recursos!
                </AlertDescription>
            </Alert>
        )
    }

     if (status === 'active') {
        return (
            <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                <AlertTitle className="font-bold text-green-800 dark:text-green-200">Assinatura Ativa</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">
                    Sua próxima cobrança será em <strong>{format(periodEnd, 'dd/MM/yyyy')}</strong>.
                </AlertDescription>
            </Alert>
        )
    }

    if (status === 'past_due') {
        return (
            <Alert variant="destructive">
                <AlertTitle>Pagamento Pendente</AlertTitle>
                <AlertDescription>
                   Não foi possível processar sua última fatura. Por favor, atualize suas informações de pagamento para evitar a suspensão do serviço.
                </AlertDescription>
            </Alert>
        )
    }
    
    if (status === 'canceled') {
        return (
            <Alert variant="destructive">
                <AlertTitle>Assinatura Cancelada</AlertTitle>
                <AlertDescription>
                   Sua assinatura foi cancelada. Seu acesso premium terminará em <strong>{format(periodEnd, 'dd/MM/yyyy')}</strong>.
                </AlertDescription>
            </Alert>
        )
    }

    return null;
}


export function SubscriptionManager({ shopId, shop }: SubscriptionManagerProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isCancelAlertOpen, setCancelAlertOpen] = useState(false);

  const handleCheckout = async (plan: Plan) => {
    if (!user || !plan.priceId) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário não autenticado ou ID do plano não encontrado.'
      });
      return;
    }
    setIsBillingLoading(true);
    try {
      const { checkoutUrl } = await createStripeCheckout({
        shopId: shopId,
        planId: plan.id,
        priceId: plan.priceId,
        userEmail: user.email!,
        userId: user.uid,
      });

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('URL de checkout não recebida.');
      }

    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao iniciar pagamento',
        description: 'Não foi possível criar a sessão de checkout. Tente novamente.',
      });
    } finally {
      setIsBillingLoading(false);
    }
  };
  
  const handleManageBilling = async () => {
    if (!shop.subscription?.stripeCustomerId) {
        toast({
            variant: 'destructive',
            title: 'Cliente Stripe não encontrado',
            description: 'Não foi possível encontrar o ID de cliente para gerenciar a fatura.',
        });
        return;
    }
    setIsBillingLoading(true);
    try {
        const { portalUrl } = await createStripePortalSession({
            shopId: shopId,
            stripeCustomerId: shop.subscription.stripeCustomerId,
        });
        if (portalUrl) {
            window.location.href = portalUrl;
        } else {
            throw new Error('URL do portal não recebida.');
        }
    } catch (error: any) {
         console.error('Error creating Stripe portal session:', error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Abrir Portal',
            description: 'Não foi possível conectar com o portal de faturas. Tente novamente.',
        });
    } finally {
        setIsBillingLoading(false);
    }
  }

  const handleCancelSubscription = async () => {
    if (!shop.subscription?.stripeSubscriptionId) {
      toast({ variant: 'destructive', title: 'Erro', description: 'ID da assinatura não encontrado.' });
      return;
    }
    setIsCanceling(true);
    try {
      await cancelStripeSubscription({ stripeSubscriptionId: shop.subscription.stripeSubscriptionId });
      toast({ title: 'Assinatura Cancelada', description: 'Sua assinatura foi cancelada com sucesso. As mudanças podem levar alguns minutos para refletir aqui.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao Cancelar', description: 'Não foi possível cancelar a assinatura. Tente novamente ou contate o suporte.' });
    } finally {
      setIsCanceling(false);
      setCancelAlertOpen(false);
    }
  };


  const currentPlanId = shop?.subscription?.plan || 'starter';
  const currentPlan = PLANS.find(p => p.id === currentPlanId) || PLANS[0];
  const isSubscriptionActive = shop?.subscription?.status === 'active' || shop?.subscription?.status === 'trialing';

  return (
    <>
      <div className="space-y-8">
        <SubscriptionStatusBanner shop={shop} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {PLANS.filter(p => p.metadata?.tipo !== 'addon').map((plan) => (
            <Card key={plan.id} className={cn("flex flex-col", currentPlan.id === plan.id && "border-primary ring-2 ring-primary")}>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                {currentPlan.id === plan.id && <Badge variant="secondary" className="w-fit">Plano Atual</Badge>}
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">R${plan.price.toFixed(2)}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {currentPlan.id === plan.id ? (
                  <Button className="w-full" onClick={handleManageBilling} disabled={isBillingLoading}>
                    {isBillingLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Gerenciar Assinatura
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleCheckout(plan)}
                    disabled={isBillingLoading || !plan.priceId || !plan.priceId.startsWith('price_')}
                  >
                    {isBillingLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    {currentPlan.price > plan.price ? 'Fazer Downgrade' : 'Fazer Upgrade'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
        {isSubscriptionActive && (
          <Card>
            <CardHeader>
              <CardTitle>Cancelar Assinatura</CardTitle>
              <CardDescription>
                Ao cancelar, seu acesso continuará até o final do período de cobrança atual ({format(toDate(shop.subscription.currentPeriodEnd)!, 'dd/MM/yyyy')}).
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="destructive" onClick={() => setCancelAlertOpen(true)} disabled={isCanceling}>
                {isCanceling ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Cancelar minha assinatura
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

       <AlertDialog open={isCancelAlertOpen} onOpenChange={setCancelAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza que deseja cancelar?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Esta ação irá cancelar sua assinatura. Você poderá usar os recursos do seu plano atual até o final do ciclo de faturamento. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelSubscription} className="bg-destructive hover:bg-destructive/90">
                      Sim, cancelar assinatura
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
