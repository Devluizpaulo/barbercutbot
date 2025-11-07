
"use client";

import { useState, useMemo, useRef } from 'react';
import type { BarberShop, UserProfile } from "@/lib/types";
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
import { setDocumentNonBlocking, useFirestore } from '@/firebase';
import { getMonth, format } from 'date-fns';
import { Timestamp, doc } from 'firebase/firestore';
import { useCPanel } from '../context'; 

const initialChartData = Array.from({ length: 12 }, (_, i) => ({
  month: format(new Date(2024, i, 1), 'MMM'),
  shops: 0
}));


export default function AdminDashboard() {
    const { toast } = useToast();
    const { shops, users, isLoading } = useCPanel(); 

    const toDate = (timestamp: Timestamp | Date | string): Date => {
      if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
      }
      return new Date(timestamp);
    }
    
    const newShopsChartData = useMemo(() => {
        if (isLoading || !shops) return initialChartData;
        const data = JSON.parse(JSON.stringify(initialChartData));
        shops.forEach(shop => {
            if (shop.createdAt) {
                const monthIndex = getMonth(toDate(shop.createdAt));
                if(data[monthIndex]) data[monthIndex].shops++;
            }
        })
        return data;
    }, [shops, isLoading])

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
                Receita Total (MRR)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">R$ --</div>}
              <p className="text-xs text-muted-foreground">
                (Em desenvolvimento)
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
                Total de Usuários
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{users?.length || 0}</div>}
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
                  <ChartContainer config={{ shops: { label: "Lojas" } }} className="w-full h-[300px]">
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
                      <Bar dataKey="shops" fill="var(--color-primary)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

             <Card>
                <CardHeader>
                  <CardTitle className="font-headline">Atalhos Rápidos</CardTitle>
                  <CardDescription>Acesse as principais áreas de gerenciamento.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Button variant="outline" asChild>
                    <Link href="/cpanel/shops">Gerenciar Lojas</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/cpanel/users">Gerenciar Usuários</Link>
                  </Button>
                   <Button variant="outline" asChild>
                    <Link href="/cpanel/logs">Ver Logs</Link>
                  </Button>
                   <Button variant="outline" asChild>
                    <Link href="/cpanel/tickets">Ver Tickets</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/cpanel/settings">Configurações</Link>
                  </Button>
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
                  {users && users.slice(0, 4).map((user, index) => (
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
    </>
  )
}
