
"use client"

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import type { FinancialRecord, Service, Barber, Appointment } from '@/lib/types';
// Dynamically import heavy libs when needed to reduce initial bundle
import dynamic from 'next/dynamic';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { DollarSign, Users, Calendar, Scissors, Store, ArrowUpRight, ArrowDownLeft, PlusCircle, Download } from "lucide-react"
import { format, getMonth, startOfDay, endOfDay, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { CashierDialog } from "../cashier-dialog";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { Timestamp } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";
import { AddTransactionForm } from './add-transaction-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PeriodNavigator, type Period } from './period-navigator';
import { calculateInterval } from '@/lib/date-utils';

const AnnualBarChart = dynamic(() => import('./Charts').then(m => m.AnnualBarChart), { ssr: false, loading: () => <Skeleton className="w-full h-[250px]" /> })
const PieRevenueByBarber = dynamic(() => import('./Charts').then(m => m.PieRevenueByBarber), { ssr: false, loading: () => <Skeleton className="w-full h-[250px]" /> })
const PieRevenueByPayment = dynamic(() => import('./Charts').then(m => m.PieRevenueByPayment), { ssr: false, loading: () => <Skeleton className="w-full h-[250px]" /> })


const annualChartConfig = {
  income: { label: "Receita", color: "hsl(var(--chart-2))" },
  expense: { label: "Despesa", color: "hsl(var(--chart-5))" },
}

const serviceChartConfig = {
  revenue: { label: "Receita", color: "hsl(var(--chart-1))" },
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];


export default function FinancePage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const [period, setPeriod] = useState<Period>('month');
  const [dateOffset, setDateOffset] = useState(0);

  const { user } = useUser();
  const auth = useAuth();

  // --- Data Fetching via API ---
  const { start, end } = useMemo(() => calculateInterval(period, dateOffset), [period, dateOffset]);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[] | null>(null);
  const [allFinancialRecords, setAllFinancialRecords] = useState<FinancialRecord[] | null>(null);
  const [allAppointments, setAllAppointments] = useState<Appointment[] | null>(null);
  const [barbers, setBarbers] = useState<Barber[] | null>(null);
  const [loadingLists, setLoadingLists] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user || !auth?.currentUser || !shopId) {
        setFinancialRecords([]); setAllFinancialRecords([]); setAllAppointments([]); setBarbers([]); setLoadingLists(false);
        return;
      }
      setLoadingLists(true);
      try {
        const token = await auth.currentUser.getIdToken();
        const headers = { Authorization: `Bearer ${token}` } as HeadersInit;
        const [frAll, ap, bb] = await Promise.all([
          fetch(`/api/shops/${shopId}/financial-records`, { headers }),
          fetch(`/api/shops/${shopId}/appointments`, { headers }),
          fetch(`/api/shops/${shopId}/barbers`, { headers }),
        ]);
        if (cancelled) return;
        const [frAllJson, apJson, bbJson] = await Promise.all([frAll.json(), ap.json(), bb.json()]);
        setAllFinancialRecords(frAllJson.items || []);
        setAllAppointments(apJson.items || []);
        setBarbers(bbJson.items || []);
        // Filter financialRecords by period locally (date is a Firestore Timestamp-like object when returned via Admin SDK)
        const inRange = (d: any) => {
          const dt = (d?.toDate ? d.toDate() : new Date(d)) as Date;
          return dt >= start && dt <= end;
        };
        const frPeriod = (frAllJson.items || []).filter((r: any) => inRange(r.date));
        setFinancialRecords(frPeriod);
      } catch (e) {
        if (!cancelled) {
          setFinancialRecords([]); setAllFinancialRecords([]); setAllAppointments([]); setBarbers([]);
        }
      } finally {
        if (!cancelled) setLoadingLists(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user, auth, shopId, start.getTime(), end.getTime()]);

  const annualChartRef = useRef<HTMLDivElement>(null);
  const barberChartRef = useRef<HTMLDivElement>(null);
  const paymentChartRef = useRef<HTMLDivElement>(null);
  
  const handleDownloadPdf = async (chartRef: React.RefObject<HTMLDivElement>, fileName: string) => {
    if (!chartRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;
    const canvas = await html2canvas(chartRef.current, { backgroundColor: null });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'px', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 15, 15, pdfWidth - 30, pdfHeight - 30);
    pdf.save(`${fileName}.pdf`);
  };

  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  // --- Memoized Calculations ---
  const { totalIncome, totalExpense, netProfit } = useMemo(() => {
    let income = 0;
    let expense = 0;
    financialRecords?.forEach(record => {
      if (record.type === 'income') income += record.amount;
      else expense += record.amount;
    });
    return { totalIncome: income, totalExpense: expense, netProfit: income - expense };
  }, [financialRecords]);

  const monthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
        month: format(new Date(2024, i, 1), 'MMM', { locale: ptBR }),
        income: 0,
        expense: 0,
        projectedIncome: 0,
        projectedExpense: 0,
    }));

    const now = new Date();
    
    allFinancialRecords?.forEach(t => {
        const transactionDate = toDate(t.date);
        const monthIndex = getMonth(transactionDate);
        if (t.type === 'income') {
            data[monthIndex].income += t.amount;
        } else {
            data[monthIndex].expense += t.amount;
            if(t.isRecurring) {
                // Project for future months of the year
                for (let i = getMonth(now) + 1; i < 12; i++) {
                   data[i].projectedExpense += t.amount;
                }
            }
        }
    });

    allAppointments?.forEach(a => {
        if(a.status === 'confirmed') {
            const appointmentDate = toDate(a.startTime);
            if (appointmentDate > now) {
                const monthIndex = getMonth(appointmentDate);
                if (monthIndex < data.length) {
                    data[monthIndex].projectedIncome += a.totalPrice || 0;
                }
            }
        }
    });

    return data;
  }, [allFinancialRecords, allAppointments]);

  const revenueByBarber = useMemo(() => {
    const barberRevenue: { [key: string]: number } = {};
    if (!financialRecords || !barbers) return [];
    
    financialRecords.forEach(t => {
        if (t.type === 'income' && t.items) {
            t.items.forEach(item => {
                const barber = barbers.find(b => b.id === item.barberId);
                if (barber) {
                    const barberName = `${barber.firstName}`;
                    if (barberRevenue[barberName]) {
                        barberRevenue[barberName] += item.price;
                    } else {
                        barberRevenue[barberName] = item.price;
                    }
                }
            })
        }
    });
    return Object.entries(barberRevenue).map(([name, revenue]) => ({ name, revenue }));
  }, [financialRecords, barbers]);

  const revenueByPaymentMethod = useMemo(() => {
      const paymentData: { [key: string]: number } = {};
      if (!financialRecords) return [];

      financialRecords.forEach(t => {
          if (t.type === 'income' && t.paymentMethod) {
              if (paymentData[t.paymentMethod]) {
                  paymentData[t.paymentMethod] += t.amount;
              } else {
                  paymentData[t.paymentMethod] = t.amount;
              }
          }
      });
      return Object.entries(paymentData).map(([method, revenue]) => ({ method, revenue }));
  }, [financialRecords]);
  
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    setDateOffset(0);
  };
  
  const isLoading = loadingLists;

  return (
    <>
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
            Finanças
          </h1>
          <p className="text-muted-foreground">
            Acompanhe a receita e as despesas do seu negócio.
          </p>
        </div>

      {!isLoading && (allFinancialRecords?.length || 0) === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div role="button" tabIndex={0} onClick={() => setAddTransactionOpen(true)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setAddTransactionOpen(true)} className="flex items-center justify-between rounded-md border p-4 hover:bg-muted/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Registre sua primeira transação</div>
                    <div className="text-sm text-muted-foreground">Receita ou despesa</div>
                  </div>
                </div>
                <Button size="sm">Abrir</Button>
              </div>
              <div role="button" tabIndex={0} onClick={() => {}} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && {}} className="flex items-center justify-between rounded-md border p-4 hover:bg-muted/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Store className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Abrir caixa</div>
                    <div className="text-sm text-muted-foreground">Lançar recebimento</div>
                  </div>
                </div>
                <Button size="sm">Abrir</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
        <div className="flex items-center gap-4">
            <PeriodNavigator 
                period={period} 
                onPeriodChange={handlePeriodChange}
                dateOffset={dateOffset}
                onDateOffsetChange={setDateOffset}
            />
            <Dialog open={isAddTransactionOpen} onOpenChange={setAddTransactionOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Transação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Transação</DialogTitle>
                </DialogHeader>
                <AddTransactionForm 
                  shopId={shopId} 
                  onSuccess={() => setAddTransactionOpen(false)}
                />
              </DialogContent>
            </Dialog>
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : (
              <div className="text-2xl font-bold">R${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            )}
            <p className="text-xs text-muted-foreground">Total de entradas no período.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : (
              <div className="text-2xl font-bold">R${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            )}
            <p className="text-xs text-muted-foreground">Total de saídas no período.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-3/4" /> : (
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>R${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            )}
             <p className="text-xs text-muted-foreground">Receita total menos despesas.</p>
          </CardContent>
        </Card>
      </div>

       <Card ref={annualChartRef}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Desempenho Anual e Projeções</CardTitle>
            <CardDescription>Receitas e despesas realizadas e projetadas para o ano.</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={() => handleDownloadPdf(annualChartRef, 'relatorio-desempenho-anual')}>
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
            <AnnualBarChart data={monthlyData} />
        </CardContent>
      </Card>
      
      <div className="space-y-8">
        <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight font-headline">
                Relatórios Detalhados
            </h2>
            <p className="text-muted-foreground">
                Análises específicas para o seu negócio no período selecionado.
            </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
            <Card ref={barberChartRef}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Receita por Profissional</CardTitle>
                    <CardDescription>Performance de vendas por barbeiro.</CardDescription>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => handleDownloadPdf(barberChartRef, 'relatorio-receita-profissional')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <PieRevenueByBarber data={revenueByBarber} colors={COLORS} />
                </CardContent>
            </Card>
            <Card ref={paymentChartRef}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Forma de Pagamento</CardTitle>
                      <CardDescription>Distribuição da receita por forma de pagamento.</CardDescription>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => handleDownloadPdf(paymentChartRef, 'relatorio-forma-pagamento')}>
                      <Download className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <PieRevenueByPayment data={revenueByPaymentMethod} colors={COLORS} />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
    </>
  )
}
