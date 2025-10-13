
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
import { Check, LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLANS, Plan } from '@/lib/plans';
import { createStripeCheckout } from '@/ai/flows/create-stripe-checkout-flow';
import type { BarberShop } from '@/lib/types';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface SubscriptionManagerProps {
  shopId: string;
  shop: BarberShop;
}

export function SubscriptionManager({ shopId, shop }: SubscriptionManagerProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isBillingLoading, setIsBillingLoading] = useState(false);

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

  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  const currentPlanId = shop?.subscription?.plan || 'starter';
  const currentPlan = PLANS.find(p => p.id === currentPlanId) || PLANS[0];
  
  const nextBillingDate = shop?.subscription?.currentPeriodEnd
    ? format(toDate(shop.subscription.currentPeriodEnd), 'dd/MM/yyyy')
    : 'N/A';

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={cn("flex flex-col", currentPlan.id === plan.id && "border-primary ring-2 ring-primary")}>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
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
                <Button className="w-full" disabled>Plano Atual</Button>
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
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Gerenciamento da Assinatura</CardTitle>
          <CardDescription>
            Seu plano atual é o <strong>{currentPlan.name}</strong>.
            Sua assinatura está <strong>{shop?.subscription?.status || 'gratuita'}</strong> e será renovada em {nextBillingDate}.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" disabled>
            Gerenciar no Portal da Stripe (Em breve)
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
