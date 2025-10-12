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
import { format, getMonth, startOfDay, endOfDay, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button";
import { CashierDialog } from "./cashier-dialog";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { Appointment, Customer, FinancialRecord, Service } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";


const chartConfig = {
  revenue: {
    label: "Receita",
    color: "hsl(var(--primary))",
  },
}

type Period = 'today' | 'week' | 'month' | 'year';


export default function ShopDashboardPage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const [isCashierOpen, setCashierOpen] = useState(false);
  const [period, setPeriod] = useState<Period>('month');
  const firestore = useFirestore();
  const { user } = useUser();

  // --- Data Fetching ---
  const financialRecordsQuery = useMemoFirebase(() => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'financialRecords') : null, [firestore, shopId, user]);
  const { data: financialRecords, isLoading: isFinancialLoading } = useCollection<FinancialRecord>(financialRecordsQuery);

  const customersQuery = useMemoFirebase(() => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'customers') : null, [firestore, shopId, user]);
  const { data: customers, isLoading: isCustomersLoading } = useCollection<Customer>(customersQuery);
  
  const appointmentsQuery = useMemoFirebase(() => (user && shopId) ? query(
      collection(firestore, 'barberShops', shopId, 'appointments')
  ) : null, [firestore, shopId, user]);
  const { data: allAppointments, isLoading: isAppointmentsLoading } = useCollection<Appointment>(appointmentsQuery);
  
  const servicesQuery = useMemoFirebase(() => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'services') : null, [firestore, shopId, user]);
  const { data: services, isLoading: isServicesLoading } = useCollection<Service>(servicesQuery);
  
  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  // --- Memoized Calculations ---
  const filteredData = useMemo(() => {
    if (!financialRecords || !allAppointments) return { revenue: 0, appointments: [] };

    const now = new Date();
    let interval: { start: Date; end: Date };

    switch (period) {
      case 'today':
        interval = { start: startOfDay(now), end: endOfDay(now) };
        break;
      case 'week':
        interval = { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
        break;
      case 'month':
        interval = { start: startOfMonth(now), end: endOfMonth(now) };
        break;
      case 'year':
        interval = { start: startOfYear(now), end: endOfYear(now) };
        break;
    }

    const revenue = financialRecords
      .filter(r => r.type === 'income' && isWithinInterval(toDate(r.date), interval))
      .reduce((acc, r) => acc + r.amount, 0);
      
    const appointments = allAppointments.filter((a: Appointment) => isWithinInterval(toDate(a.startTime), interval));
    
    return { revenue, appointments };
  }, [financialRecords, allAppointments, period]);
  
  const mostPopularService = useMemo(() => {
    if (!filteredData.appointments || !services || filteredData.appointments.length === 0) return { name: 'N/A', percentage: 0 };
    const serviceCounts: Record<string, number> = {};
    let totalServices = 0;

    filteredData.appointments.forEach((appt: Appointment) => {
        appt.items.forEach(item => {
            if(serviceCounts[item.serviceId]) {
                serviceCounts[item.serviceId]++;
            } else {
                serviceCounts[item.serviceId] = 1;
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
  }, [filteredData.appointments, services]);


  const monthlyRevenueChartData = useMemo(() => {
    const revenueData = Array.from({ length: 12 }, (_, i) => ({
        month: format(new Date(2024, i, 1), 'MMM', { locale: ptBR }),
        revenue: 0,
    }));

    financialRecords?.forEach(t => {
        const transactionDate = toDate(t.date);
        const monthIndex = getMonth(transactionDate);
        if (t.type === 'income') {
            revenueData[monthIndex].revenue += t.amount;
        }
    });
    return revenueData;
  }, [financialRecords]);

  const isLoading = isFinancialLoading || isCustomersLoading || isAppointmentsLoading || isServicesLoading;

  return (
    <>
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
            Visão Geral
          </h1>
          <p className="text-muted-foreground">
            Aqui está uma visão geral do desempenho do seu negócio.
          </p>
        </div>
        <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-4 sm:w-auto">
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="year">Ano</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita no Período
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">R${filteredData.revenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>}
            <p className="text-xs text-muted-foreground">
              Total de receita para o período selecionado.
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
            {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">+{customers?.length || 0}</div>}
            <p className="text-xs text-muted-foreground">
              +10% do último mês (simulado)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos no Período</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{filteredData.appointments?.length || 0}</div>}
            <p className="text-xs text-muted-foreground">
              {filteredData.appointments?.filter((a: Appointment) => a.status === 'completed').length || 0} concluídos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviço Mais Popular</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-2/4" /> : <div className="text-2xl font-bold">{mostPopularService.name}</div>}
            <p className="text-xs text-muted-foreground">
              {mostPopularService.percentage}% das reservas no período
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-headline">Receita Mensal (Anual)</CardTitle>
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
            <CardTitle className="font-headline">Agendamentos de Hoje</CardTitle>
            <CardDescription>
              Uma lista dos agendamentos de hoje.
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
                {isLoading && Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={3}><Skeleton className="h-6 w-full" /></TableCell>
                    </TableRow>
                ))}
                {filteredData.appointments?.slice(0, 5).map((appointment: Appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="font-medium">{customers?.find(c => c.id === appointment.customerId)?.firstName}</div>
                      <div className="text-sm text-muted-foreground md:hidden">
                         {format(toDate(appointment.startTime), "HH:mm", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{format(toDate(appointment.startTime), "HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell>
                      <Badge variant={appointment.status === 'completed' ? 'secondary' : appointment.status === 'cancelled' ? 'destructive' : 'default'}>
                        {appointment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                 {!isLoading && filteredData.appointments?.length === 0 && (
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
    <CashierDialog 
      open={isCashierOpen} 
      onOpenChange={setCashierOpen}
      shopId={shopId} 
    />
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
