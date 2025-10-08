
"use client"

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
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
import { DollarSign, Users, Calendar, Scissors, Store } from "lucide-react"
import { format, getMonth, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button";
import { CashierDialog } from "./cashier-dialog";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, Timestamp } from "firebase/firestore";
import type { Appointment, Customer, FinancialRecord, Service } from "@/lib/types";

const chartConfig = {
  revenue: {
    label: "Receita",
    color: "hsl(var(--primary))",
  },
}

export default function ShopDashboardPage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const [isCashierOpen, setCashierOpen] = useState(false);
  const firestore = useFirestore();

  // --- Data Fetching ---
  const financialRecordsQuery = useMemoFirebase(() => collection(firestore, 'barberShops', shopId, 'financialRecords'), [firestore, shopId]);
  const { data: financialRecords } = useCollection<FinancialRecord>(financialRecordsQuery);

  const customersQuery = useMemoFirebase(() => collection(firestore, 'barberShops', shopId, 'customers'), [firestore, shopId]);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const appointmentsQuery = useMemoFirebase(() => query(
      collection(firestore, 'barberShops', shopId, 'appointments'),
      where('startTime', '>=', todayStart),
      where('startTime', '<=', todayEnd)
  ), [firestore, shopId, todayStart, todayEnd]);
  const { data: todayAppointments } = useCollection<Appointment>(appointmentsQuery);

  const servicesQuery = useMemoFirebase(() => collection(firestore, 'barberShops', shopId, 'services'), [firestore, shopId]);
  const { data: services } = useCollection<Service>(servicesQuery);

  // --- Memoized Calculations ---
  const totalRevenueMonth = useMemo(() => {
    if (!financialRecords) return 0;
    const currentMonth = getMonth(new Date());
    return financialRecords
      .filter(r => r.type === 'income' && getMonth(r.date instanceof Timestamp ? r.date.toDate() : new Date(r.date)) === currentMonth)
      .reduce((acc, r) => acc + r.amount, 0);
  }, [financialRecords]);
  
  const mostPopularService = useMemo(() => {
    if (!todayAppointments || !services) return { name: 'N/A', percentage: 0 };
    const serviceCounts: Record<string, number> = {};
    let totalServices = 0;

    todayAppointments.forEach(appt => {
        appt.serviceIds.forEach(serviceId => {
            if(serviceCounts[serviceId]) {
                serviceCounts[serviceId]++;
            } else {
                serviceCounts[serviceId] = 1;
            }
            totalServices++;
        });
    });

    if (totalServices === 0) return { name: 'N/A', percentage: 0 };
    
    const [mostPopularId] = Object.entries(serviceCounts).sort(([, a], [, b]) => b - a)[0] || [];
    const service = services.find(s => s.id === mostPopularId);
    const count = serviceCounts[mostPopularId];
    const percentage = (count / totalServices) * 100;
    
    return { name: service?.name || 'N/A', percentage: Math.round(percentage) };
  }, [todayAppointments, services]);


  const monthlyRevenueChartData = useMemo(() => {
    const revenueData = Array.from({ length: 12 }, (_, i) => ({
        month: format(new Date(2024, i, 1), 'MMM', { locale: ptBR }),
        revenue: 0,
    }));

    financialRecords?.forEach(t => {
        const transactionDate = t.date instanceof Timestamp ? t.date.toDate() : new Date(t.date);
        const monthIndex = getMonth(transactionDate);
        if (t.type === 'income') {
            revenueData[monthIndex].revenue += t.amount;
        }
    });
    return revenueData;
  }, [financialRecords]);

  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  return (
    <>
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Visão Geral
        </h1>
        <p className="text-muted-foreground">
          Aqui está uma visão geral do desempenho da sua barbearia.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita do Mês
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R${totalRevenueMonth.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% do último mês (simulado)
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
            <div className="text-2xl font-bold">+{customers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              +10% do último mês (simulado)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos de Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {todayAppointments?.filter(a => a.status === 'completed').length || 0} concluídos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviço Mais Popular</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mostPopularService.name}</div>
            <p className="text-xs text-muted-foreground">
              {mostPopularService.percentage}% das reservas de hoje
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-headline">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={monthlyRevenueChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                 <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={(value) => `R$${value / 1000}k`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Agendamentos Recentes</CardTitle>
            <CardDescription>
              Uma lista de agendamentos recentes e futuros.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Hora</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayAppointments?.slice(0, 5).map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="font-medium">{customers?.find(c => c.id === appointment.customerId)?.firstName}</div>
                      <div className="text-sm text-muted-foreground md:hidden">
                         {format(toDate(appointment.startTime), "HH:mm", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{format(toDate(appointment.startTime), "MMM d, HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell>
                      <Badge variant={appointment.status === 'completed' ? 'secondary' : appointment.status === 'cancelled' ? 'destructive' : 'default'}>
                        {appointment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                 {todayAppointments?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center h-24">
                            Nenhum agendamento para hoje.
                        </TableCell>
                    </TableRow>
                 )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
    <CashierDialog open={isCashierOpen} onOpenChange={setCashierOpen} shopId={shopId} />
      <Button
        onClick={() => setCashierOpen(true)}
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg"
        size="icon"
      >
        <Store className="h-8 w-8" />
        <span className="sr-only">Abrir Caixa</span>
      </Button>
    </>
  )
}
