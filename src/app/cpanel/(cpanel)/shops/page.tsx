
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
import { Search, Store, MoreVertical, ExternalLink, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

export default function CPanelShopsPage() {
  const { shops, isLoading } = useCPanel();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [searchTerm, setSearchTerm] = useState('');
  const [shopToDeactivate, setShopToDeactivate] = useState<BarberShop | null>(null);

  const filteredShops = shops?.filter(shop => 
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.ownerId && shop.ownerId.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleManageBilling = (shopId: string) => {
    toast({
        title: 'Em breve!',
        description: `A funcionalidade de gerenciar faturas para a loja ${shopId} está em desenvolvimento.`,
    });
  };

  const handleDeactivateShop = (shop: BarberShop | null) => {
    if (!shop) return;
    const shopRef = doc(firestore, 'barberShops', shop.id);
    setDocumentNonBlocking(shopRef, { status: 'inactive' }, { merge: true });

    toast({
        title: 'Loja Desativada',
        description: `O negócio "${shop.name}" foi desativado com sucesso.`,
        variant: 'destructive',
    });
    setShopToDeactivate(null);
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
                <TableCell className="hidden lg:table-cell">{shop.subscription?.plan === 'pro' ? 'Pro' : 'Gratuito'}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge 
                      variant={'secondary'}
                      className={cn(
                          shop.subscription?.status === 'active' && 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                          shop.subscription?.status === 'past_due' && 'bg-yellow-100 text-yellow-800'
                      )}
                  >
                      {shop.subscription?.status === 'active' ? 'Pago' : 'Pendente'}
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
                          <DropdownMenuItem onClick={() => handleManageBilling(shop.id)}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Gerenciar Fatura
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={() => setShopToDeactivate(shop)}
                          >
                            Desativar
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

       <AlertDialog
          open={!!shopToDeactivate}
          onOpenChange={(isOpen) => !isOpen && setShopToDeactivate(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá desativar o negócio "{shopToDeactivate?.name}".
                Isso pode ser revertido, mas bloqueará o acesso do proprietário.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeactivateShop(shopToDeactivate)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Sim, desativar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
