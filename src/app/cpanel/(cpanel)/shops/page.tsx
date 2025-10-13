
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Store, MoreVertical, ExternalLink, CreditCard, LoaderCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
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
import { useCPanel } from '../context';
import type { BarberShop } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { createStripePortalSession } from '@/ai/flows/create-stripe-portal-session-flow';
import { cancelStripeSubscription } from '@/ai/flows/cancel-stripe-subscription-flow';

export default function CPanelShopsPage() {
  const { shops, isLoading } = useCPanel();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [searchTerm, setSearchTerm] = useState('');
  const [shopToAction, setShopToAction] = useState<{ shop: BarberShop; action: 'deactivate' | 'cancel_subscription' } | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState<string | null>(null);

  const filteredShops = shops?.filter(shop => 
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.ownerId && shop.ownerId.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleManageBilling = async (shop: BarberShop) => {
    if (!shop.subscription?.stripeCustomerId) {
        toast({
            variant: 'destructive',
            title: 'Cliente não encontrado na Stripe',
            description: 'Esta loja não possui uma assinatura ativa ou ID de cliente na Stripe.',
        });
        return;
    }

    setIsBillingLoading(shop.id);
    try {
        const { portalUrl } = await createStripePortalSession({
            shopId: shop.id,
            stripeCustomerId: shop.subscription.stripeCustomerId,
        });

        if (portalUrl) {
            window.open(portalUrl, '_blank');
        } else {
            throw new Error('URL do portal não foi retornada.');
        }

    } catch (error: any) {
        console.error('Error creating Stripe portal session:', error);
        toast({
            variant: 'destructive',
            title: 'Erro ao abrir portal',
            description: 'Não foi possível conectar com a Stripe. Tente novamente mais tarde.',
        });
    } finally {
        setIsBillingLoading(null);
    }
  };

  const handleDeactivateShop = (shop: BarberShop) => {
    const shopRef = doc(firestore, 'barberShops', shop.id);
    setDocumentNonBlocking(shopRef, { status: 'inactive' }, { merge: true });
    toast({
        title: 'Loja Desativada',
        description: `O negócio "${shop.name}" foi desativado com sucesso.`,
    });
    setShopToAction(null);
  };
  
  const handleCancelSubscription = async (shop: BarberShop) => {
    if (!shop.subscription?.stripeSubscriptionId) {
        toast({ variant: 'destructive', title: 'ID da Assinatura não encontrado' });
        return;
    }

    try {
        await cancelStripeSubscription({ stripeSubscriptionId: shop.subscription.stripeSubscriptionId });
        
        const shopRef = doc(firestore, 'barberShops', shop.id);
        await setDocumentNonBlocking(shopRef, { 
            status: 'inactive',
            'subscription.status': 'canceled' 
        }, { merge: true });

        toast({
            title: 'Assinatura Cancelada!',
            description: `A assinatura da loja "${shop.name}" foi cancelada e a loja foi desativada.`,
        });

    } catch (error: any) {
        console.error("Error canceling subscription:", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Cancelar',
            description: 'Não foi possível cancelar a assinatura na Stripe. Verifique o painel da Stripe.',
        });
    } finally {
        setShopToAction(null);
    }
  };

  const handleActionConfirm = () => {
    if (!shopToAction) return;
    if (shopToAction.action === 'deactivate') {
        handleDeactivateShop(shopToAction.shop);
    } else if (shopToAction.action === 'cancel_subscription') {
        handleCancelSubscription(shopToAction.shop);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
              <Store />
              Lojas
            </h1>
            <p className="text-muted-foreground">
              Visualize e gerencie todos os negócios parceiros na plataforma.
            </p>
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou ID do dono..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="border rounded-lg">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[250px]">Negócio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Plano</TableHead>
                <TableHead className="hidden md:table-cell">Status Pag.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading && Array.from({length: 5}).map((_, i) => (
                <TableRow key={i}>
                    <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
                ))}
                {filteredShops?.map((shop) => (
                <TableRow key={shop.id}>
                    <TableCell>
                    <div className="font-medium">{shop.name}</div>
                    <div className="text-sm text-muted-foreground">{shop.address}</div>
                    </TableCell>
                    <TableCell>
                    <Badge 
                        variant={shop.status === 'active' ? 'default' : 'destructive'}
                        className={cn(shop.status === 'active' && 'bg-green-500 hover:bg-green-500/80')}
                    >
                        {shop.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{shop.subscription?.plan || 'N/A'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                    <Badge 
                        variant={'secondary'}
                        className={cn(
                            shop.subscription?.status === 'active' && 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                            shop.subscription?.status === 'past_due' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
                            shop.subscription?.status === 'canceled' && 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                        )}
                    >
                        {shop.subscription?.status || 'N/A'}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/${shop.id}`}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Ver Dashboard
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageBilling(shop)} disabled={isBillingLoading === shop.id}>
                                {isBillingLoading === shop.id ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> : <CreditCard className="mr-2 h-4 w-4" />}
                                Gerenciar Fatura
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setShopToAction({ shop, action: 'cancel_subscription'})}
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancelar Assinatura
                            </DropdownMenuItem>
                             <DropdownMenuItem
                                onClick={() => setShopToAction({ shop, action: 'deactivate'})}
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Desativar Loja
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
                {!isLoading && filteredShops?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">Nenhuma loja encontrada.</TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </div>

       <AlertDialog
          open={!!shopToAction}
          onOpenChange={(isOpen) => !isOpen && setShopToAction(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              {shopToAction?.action === 'deactivate' ? (
                <AlertDialogDescription>
                    Esta ação irá desativar a loja "{shopToAction.shop.name}". O proprietário não poderá mais acessar o dashboard, mas a assinatura na Stripe **não** será cancelada.
                </AlertDialogDescription>
              ) : (
                 <AlertDialogDescription>
                    Esta ação irá **cancelar permanentemente** a assinatura da loja "{shopToAction?.shop.name}" na Stripe e desativar o acesso. A ação não pode ser desfeita.
                </AlertDialogDescription>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleActionConfirm}
                className="bg-destructive hover:bg-destructive/90"
              >
                Sim, confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

