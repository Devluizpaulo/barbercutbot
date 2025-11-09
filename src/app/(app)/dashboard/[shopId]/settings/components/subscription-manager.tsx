
'use client';

import { useEffect, useState } from 'react';
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
import { format, differenceInDays, differenceInMinutes } from 'date-fns';
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
import { format as fmtDateBR } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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

function SubscriptionStatusBanner({ shop, onManageBilling }: { shop: BarberShop, onManageBilling?: () => void }) {
    const status = shop.subscription?.status;
    const periodEnd = toDate(shop.subscription?.currentPeriodEnd);
    const [now, setNow] = useState<Date>(new Date());
    
    // Atualiza a cada minuto para manter a contagem hh:mm
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(id);
    }, []);

    if (!status || !periodEnd) {
        return null;
    }
    
    if (status === 'trialing') {
        const daysLeft = differenceInDays(periodEnd, now);
        const minutesLeft = Math.max(0, differenceInMinutes(periodEnd, now));
        const showClock = daysLeft <= 0;
        const hh = String(Math.floor(minutesLeft / 60)).padStart(2, '0');
        const mm = String(minutesLeft % 60).padStart(2, '0');
        return (
            <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                <AlertTitle className="font-bold text-blue-800 dark:text-blue-200">Você está em um período de teste!</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                    {showClock ? (
                      <>Seu teste termina hoje em <strong>{format(periodEnd, 'dd/MM/yyyy')}</strong>. Restam <strong>{hh}:{mm}</strong>.</>
                    ) : (
                      <>Seu período de teste gratuito termina em <strong>{daysLeft} dia{daysLeft !== 1 ? 's' : ''}</strong> (em {format(periodEnd, 'dd/MM/yyyy')}).</>
                    )} Aproveite todos os recursos!
                </AlertDescription>
            </Alert>
        )
    }

     if (status === 'active') {
        const daysLeft = differenceInDays(periodEnd, now);
        const minutesLeft = Math.max(0, differenceInMinutes(periodEnd, now));
        const showClock = daysLeft <= 0;
        const hh = String(Math.floor(minutesLeft / 60)).padStart(2, '0');
        const mm = String(minutesLeft % 60).padStart(2, '0');
        return (
            <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                <AlertTitle className="font-bold text-green-800 dark:text-green-200">Assinatura Ativa</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">
                    {showClock ? (
                      <>Renova hoje ({format(periodEnd, 'dd/MM/yyyy')}). Restam <strong>{hh}:{mm}</strong> para a próxima cobrança.</>
                    ) : (
                      <>Sua próxima cobrança será em <strong>{format(periodEnd, 'dd/MM/yyyy')}</strong> (faltam <strong>{daysLeft}</strong> dia{daysLeft !== 1 ? 's' : ''}).</>
                    )}
                </AlertDescription>
            </Alert>
        )
    }

    if (status === 'past_due') {
        return (
            <Alert variant="destructive">
                <AlertTitle>Pagamento Pendente</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                   Não foi possível processar sua última fatura. Por favor, atualize suas informações de pagamento para evitar a suspensão do serviço.
                   {onManageBilling && (
                     <Button variant="secondary" className="w-fit" onClick={onManageBilling}>
                       Alterar forma de pagamento
                     </Button>
                   )}
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
  const [invoices, setInvoices] = useState<Array<{ id: string; number?: string | null; status?: string | null; amount_due: number; amount_paid: number; currency: string; created: string | null; hosted_invoice_url?: string | null; invoice_pdf?: string | null; }>>([]);
  const [isInvoicesLoading, setInvoicesLoading] = useState(false);
  const [activeAddons, setActiveAddons] = useState<Record<string, boolean>>({});
  const [invoiceStatus, setInvoiceStatus] = useState<'all' | 'open' | 'paid' | 'void' | 'uncollectible' | 'draft'>('all');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [usage, setUsage] = useState<{ messages_used: number; monthly_limit: number } | null>(null);
  const [nowTick, setNowTick] = useState<Date>(new Date());
  const [notifiedRenewal, setNotifiedRenewal] = useState(false);
  const [subs, setSubs] = useState<Array<{ id: string; status: string; current_period_start: string | null; current_period_end: string | null; items: Array<{ id: string; priceId: string; productName?: string; metadata?: Record<string, any> }>; }>>([]);
  const formatMoney = (amountInCents: number, currency: string) => {
    try {
      const code = (currency || 'BRL').toUpperCase();
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: code }).format(amountInCents / 100);
    } catch {
      return `${currency} ${(amountInCents / 100).toFixed(2)}`;
    }
  };

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
  const status = shop?.subscription?.status;
  const isSubscriptionActive = status === 'active' || status === 'trialing';
  const subscriptionEndDate = toDate(shop?.subscription?.currentPeriodEnd);
  const daysToRenewal = subscriptionEndDate ? differenceInDays(subscriptionEndDate, new Date()) : null;
  const addonIa = PLANS.find(p => p.id === 'addon-ia');
  const addonIaActive = addonIa?.priceId ? !!activeAddons[addonIa.priceId] : false;

  // Tick a cada minuto para badges/alertas
  useEffect(() => {
    const id = setInterval(() => setNowTick(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const load = async () => {
      setInvoicesLoading(true);
      try {
        const params = new URLSearchParams({ shopId, status: invoiceStatus, limit: '10' });
        const res = await fetch(`/api/billing/invoices?${params.toString()}`);
        const data = await res.json();
        if (res.ok) {
          setInvoices(data.invoices || []);
          setNextCursor(data.next_cursor || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setInvoicesLoading(false);
      }
    };
    load();
  }, [shopId, invoiceStatus]);

  const handleLoadMoreInvoices = async () => {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams({ shopId, status: invoiceStatus, limit: '10', starting_after: nextCursor });
      const res = await fetch(`/api/billing/invoices?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setInvoices(prev => [...prev, ...(data.invoices || [])]);
        setNextCursor(data.next_cursor || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/billing/subscriptions?shopId=${shopId}`);
        const data = await res.json();
        if (res.ok) {
          const addons: Record<string, boolean> = {};
          for (const s of data.subscriptions || []) {
            for (const it of s.items || []) {
              if (it.metadata?.tipo === 'addon') {
                addons[it.priceId] = true;
              }
            }
          }
          setActiveAddons(addons);
          setSubs(data.subscriptions || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [shopId]);

  // Toast quando faltar < 1 dia para renovação (active) ou término do trial
  useEffect(() => {
    if (!subscriptionEndDate || notifiedRenewal) return;
    const minutesLeft = Math.max(0, differenceInMinutes(subscriptionEndDate, nowTick));
    const daysLeft = Math.max(0, differenceInDays(subscriptionEndDate, nowTick));
    if (minutesLeft <= 24 * 60) {
      const hh = String(Math.floor(minutesLeft / 60)).padStart(2, '0');
      const mm = String(minutesLeft % 60).padStart(2, '0');
      toast({
        title: status === 'trialing' ? 'Seu teste termina em breve' : 'Renovação em breve',
        description: status === 'trialing'
          ? `O período de teste termina hoje. Restam ${hh}:${mm}.`
          : `A próxima cobrança será hoje. Restam ${hh}:${mm}.`,
      });
      setNotifiedRenewal(true);
    }
  }, [subscriptionEndDate, status, nowTick, notifiedRenewal, toast]);

  return (
    <>
      <div className="space-y-8">
        <SubscriptionStatusBanner shop={shop} onManageBilling={handleManageBilling} />
        <Card>
          <CardHeader>
            <CardTitle>Seu Plano Atual</CardTitle>
            <CardDescription className="text-justify">
              {currentPlan.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex flex-col sm:flex-row items-start sm:items-baseline gap-2">
                <span className="text-4xl font-bold">R${currentPlan.price.toFixed(2)}</span>
                <span className="text-muted-foreground">/mês</span>
             </div>
          </CardContent>
          {isSubscriptionActive && (
            <CardFooter>
              <Button variant="outline" onClick={handleManageBilling} disabled={isBillingLoading}>
                 {isBillingLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                Gerenciar Assinatura e Faturas
              </Button>
            </CardFooter>
          )}
        </Card>

        <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Mudar de Plano</h3>
              <p className="text-sm text-muted-foreground">Faça um upgrade para ter acesso a mais recursos.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {PLANS.filter(p => p.id !== 'starter' && p.metadata?.tipo !== 'addon').map((plan, index) => (
                <Card key={plan.id} className={cn("flex flex-col", plan.isFeatured && "border-primary")}>
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-justify">{plan.description}</CardDescription>
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
                            <span className="text-sm text-justify">{feature}</span>
                          </li>
                        ))}
                      </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleCheckout(plan)} 
                      disabled={isBillingLoading || currentPlan.id === plan.id}
                    >
                      {isBillingLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>}
                      {currentPlan.id === plan.id ? 'Plano Atual' : 'Fazer Upgrade'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Add-ons</h3>
            <p className="text-sm text-muted-foreground">Funcionalidades extras que você pode adicionar ao seu plano atual.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {PLANS.filter(p => p.metadata?.tipo === 'addon').map((addon) => {
              const includedInPremium = currentPlan.id === 'premium';
              const alreadySubscribed = addon.priceId ? !!activeAddons[addon.priceId] : false;
              return (
                <Card key={addon.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">{addon.name}</CardTitle>
                    <CardDescription className="text-justify">{addon.description}</CardDescription>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline">Add-on</Badge>
                      {includedInPremium && (
                        <Badge className="w-fit bg-primary text-primary-foreground shadow">Incluído no Premium</Badge>
                      )}
                      {alreadySubscribed && !includedInPremium && (
                        <Badge variant="secondary">Ativo</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">R${addon.price.toFixed(2)}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <ul className="space-y-3">
                      {addon.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-justify">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleCheckout(addon)}
                      disabled={isBillingLoading || includedInPremium || alreadySubscribed || !addon.priceId || !addon.priceId.startsWith('price_')}
                    >
                      {isBillingLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                      {includedInPremium ? 'Já incluído no seu plano' : alreadySubscribed ? 'Add-on já ativo' : 'Adicionar Add-on'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
        {isSubscriptionActive && (
          <Card>
            <CardHeader>
              <CardTitle>Cancelar Assinatura</CardTitle>
              <CardDescription>
                Ao cancelar, seu acesso continuará até o final do período de cobrança atual {subscriptionEndDate ? `(${format(subscriptionEndDate, 'dd/MM/yyyy')})` : ''}.
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

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <CardDescription className="text-justify">Visualize o histórico de cobranças e pagamentos. Integração detalhada com faturas Stripe pode ser adicionada aqui.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">Filtrar:</span>
              <Select value={invoiceStatus} onValueChange={(v) => setInvoiceStatus(v as any)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Em aberto</SelectItem>
                  <SelectItem value="paid">Pagas</SelectItem>
                  <SelectItem value="void">Anuladas</SelectItem>
                  <SelectItem value="uncollectible">Inadimplentes</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isInvoicesLoading ? (
              <p className="text-sm text-muted-foreground">Carregando faturas...</p>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro disponível no momento.</p>
            ) : (
              <div className="divide-y rounded-md border">
                {invoices.map((inv) => (
                  <div key={inv.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 items-center">
                    <div className="font-mono text-xs md:text-sm">{inv.number || inv.id}</div>
                    <div className="text-sm">{inv.created ? fmtDateBR(new Date(inv.created), 'dd/MM/yyyy HH:mm') : '-'}</div>
                    <div className="text-sm uppercase">{formatMoney(inv.amount_paid || inv.amount_due, inv.currency)}</div>
                    <div>
                      <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'open' ? 'secondary' : 'outline'} className="capitalize">
                        {inv.status || '—'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {inv.hosted_invoice_url && (
                        <Button asChild variant="outline" size="sm">
                          <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer">Ver Fatura</a>
                        </Button>
                      )}
                      {inv.invoice_pdf && (
                        <Button asChild variant="ghost" size="sm">
                          <a href={inv.invoice_pdf} target="_blank" rel="noreferrer">PDF</a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {nextCursor && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={handleLoadMoreInvoices} disabled={isLoadingMore}>
                  {isLoadingMore && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  Carregar mais
                </Button>
              </div>
            )}
          </CardContent>
          {status === 'active' || status === 'past_due' ? (
            <CardFooter>
              <Button variant="outline" onClick={handleManageBilling}>
                Abrir portal de faturas
              </Button>
            </CardFooter>
          ) : null}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados da Conta</CardTitle>
            <CardDescription className="text-justify">Informações principais da sua barbearia e assinatura.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Criação da conta</div>
              <div className="font-medium">{shop.createdAt ? fmtDateBR(new Date((shop.createdAt as any).toDate ? (shop.createdAt as any).toDate() : shop.createdAt), 'dd/MM/yyyy HH:mm') : '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Plano atual</div>
              <div className="font-medium">{currentPlan.name}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Próxima cobrança</div>
              <div className="font-medium">{subscriptionEndDate ? fmtDateBR(subscriptionEndDate, 'dd/MM/yyyy HH:mm') : '—'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Assinaturas</CardTitle>
            <CardDescription className="text-justify">Períodos, status e produtos vinculados à sua assinatura.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {subs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum histórico disponível.</p>
            ) : (
              <div className="divide-y rounded-md border">
                {subs.map((s) => (
                  <div key={s.id} className="p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-mono text-xs md:text-sm">{s.id}</div>
                      <Badge className="capitalize" variant={s.status === 'active' ? 'default' : s.status === 'trialing' ? 'secondary' : 'outline'}>{s.status}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Início do período</div>
                        <div>{s.current_period_start ? fmtDateBR(new Date(s.current_period_start), 'dd/MM/yyyy HH:mm') : '—'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Fim do período</div>
                        <div>{s.current_period_end ? fmtDateBR(new Date(s.current_period_end), 'dd/MM/yyyy HH:mm') : '—'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Produtos</div>
                        <div className="space-y-1">
                          {s.items?.map(it => (
                            <div key={it.id} className="flex items-center gap-2">
                              <span className="inline-block rounded-sm border px-2 py-0.5 text-xs">{it.productName || it.priceId}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
