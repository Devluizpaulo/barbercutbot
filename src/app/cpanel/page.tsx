
"use client";

import { useState, useMemo, useRef } from 'react';
import type { BarberShop, Customer, FinancialRecord, UserProfile } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, collectionGroup, getDocs, query, Timestamp } from 'firebase/firestore';
import { getMonth } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { DollarSign, Users, ExternalLink, Shield, Ticket, CreditCard, Store, Activity, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const chartConfig = {
  shops: {
    label: "Lojas",
    color: "hsl(var(--primary))",
  },
}

const initialChartData = [
  { month: "Jan", shops: 0 },
  { month: "Fev", shops: 0 },
  { month: "Mar", shops: 0 },
  { month: "Abr", shops: 0 },
  { month: "Mai", shops: 0 },
  { month: "Jun", shops: 0 },
  { month: "Jul", shops: 0 },
  { month: "Ago", shops: 0 },
  { month: "Set", shops: 0 },
  { month: "Out", shops: 0 },
  { month: "Nov", shops: 0 },
  { month: "Dez", shops: 0 },
];


export default function AdminDashboard() {
    const { toast } = useToast();
    const [shopToDeactivate, setShopToDeactivate] = useState<BarberShop | null>(null);
    const firestore = useFirestore();
    const { user } = useUser();

    const shopsQuery = useMemoFirebase(() => user ? collection(firestore, 'barberShops') : null, [firestore, user]);
    const { data: shops, isLoading: isLoadingShops } = useCollection<BarberShop>(shopsQuery);
    
    const customersQuery = useMemoFirebase(() => user ? query(collectionGroup(firestore, 'customers')) : null, [firestore, user]);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);

    const financialRecordsQuery = useMemoFirebase(() => user ? query(collectionGroup(firestore, 'financialRecords')) : null, [firestore, user]);
    const { data: financialRecords, isLoading: isLoadingFinancialRecords } = useCollection<FinancialRecord>(financialRecordsQuery);

    const usersQuery = useMemoFirebase(() => user ? collection(firestore, 'users') : null, [firestore, user]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

    const toDate = (timestamp: Timestamp | Date | string): Date => {
      if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
      }
      return new Date(timestamp);
    }
    
    const totalRevenue = useMemo(() => {
        if (!financialRecords) return 0;
        return financialRecords.reduce((acc, record) => record.type === 'income' ? acc + record.amount : acc, 0)
    }, [financialRecords]);

    const newShopsChartData = useMemo(() => {
        const data = JSON.parse(JSON.stringify(initialChartData));
        if (!shops) return data;
        shops.forEach(shop => {
            if (shop.createdAt) {
                const monthIndex = getMonth(toDate(shop.createdAt));
                data[monthIndex].shops++;
            }
        })
        return data;
    }, [shops])


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

    const isLoading = isLoadingShops || isLoadingCustomers || isLoadingFinancialRecords || isLoadingUsers;

  return (
    <>
      <div className="flex flex-1 flex-col gap-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <Shield className="h-7 w-7 md:h-8 md:w-8"/> Painel do Administrador
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus negócios parceiros, finanças e performance geral.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Total (Mês)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">R${totalRevenue.toLocaleString('pt-BR')}</div>}
              <p className="text-xs text-muted-foreground">
                +5.2% em relação ao mês passado (simulado)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Negócios Ativos
              </CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{shops?.filter(s => s.status === 'active').length || 0}</div>}
              <p className="text-xs text-muted-foreground">
                {shops?.length || 0} no total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Clientes
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{customers?.length || 0}</div>}
              <p className="text-xs text-muted-foreground">
                em toda a plataforma
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tickets de Suporte
              </CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Abertos no momento (simulado)
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">Crescimento de Negócios na Plataforma</CardTitle>
                  <CardDescription>
                    Novos negócios que se juntaram nos últimos meses.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <ChartContainer config={chartConfig} className="w-full h-[300px]">
                    <BarChart accessibilityLayer data={newShopsChartData}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis
                        dataKey="shops"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        allowDecimals={false}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Bar dataKey="shops" fill="var(--color-shops)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                  <CardHeader>
                      <CardTitle className="font-headline">Negócios Parceiros</CardTitle>
                      <CardDescription>Uma lista de todos os negócios na sua plataforma.</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                              {isLoading && Array.from({length: 3}).map((_, i) => (
                                  <TableRow key={i}>
                                      <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                                  </TableRow>
                              ))}
                              {shops?.map(shop => (
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
                              {!isLoading && shops?.length === 0 && (
                                  <TableRow>
                                      <TableCell colSpan={5} className="h-24 text-center">Nenhum negócio encontrado.</TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </CardContent>
              </Card>
          </div>
          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5"/> Atividades Recentes</CardTitle>
                  <CardDescription>Últimas ações importantes na plataforma.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  {isLoading && <Skeleton className="h-24 w-full" />}
                  {users?.slice(0, 4).map((user, index) => (
                      <div className="flex items-start gap-4" key={user.id}>
                          <Avatar className="h-9 w-9">
                              <AvatarFallback>{user.firstName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">
                                  Novo usuário cadastrado!
                              </p>
                              <p className="text-sm text-muted-foreground">
                                  Bem-vindo(a), {user.firstName}.
                              </p>
                          </div>
                      </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
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
  )
}
