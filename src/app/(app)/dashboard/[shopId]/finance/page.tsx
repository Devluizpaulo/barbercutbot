
"use client"

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import type { FinancialRecord, Service, Barber, Appointment } from '@/lib/types';
import dynamic from 'next/dynamic';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, ArrowUpRight, ArrowDownLeft, PlusCircle, Download, Search } from "lucide-react"
import { format, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useAuth, useFirestore, useUser } from "@/firebase";
import { doc, Timestamp } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";
import { AddTransactionForm } from './add-transaction-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PeriodNavigator, type Period } from './period-navigator';
import { calculateInterval } from '@/lib/date-utils';
import { TransactionsTable } from './transactions-table';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


const AnnualBarChart = dynamic(() => import('./Charts').then(m => m.AnnualBarChart), { ssr: false, loading: () => <Skeleton className="w-full h-[250px]" /> })
const PieRevenueByBarber = dynamic(() => import('./Charts').then(m => m.PieRevenueByBarber), { ssr: false, loading: () => <Skeleton className="w-full h-[250px]" /> })
const PieRevenueByPayment = dynamic(() => import('./Charts').then(m => m.PieRevenueByPayment), { ssr: false, loading: () => <Skeleton className="w-full h-[250px]" /> })


const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];


export default function FinancePage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const [period, setPeriod] = useState<Period>('month');
  const [dateOffset, setDateOffset] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialRecord | undefined>(undefined);
  const [transactionToDelete, setTransactionToDelete] = useState<FinancialRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

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
  }, [user, auth, shopId, start, end]);

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
  const { incomeRecords, expenseRecords, totalIncome, totalExpense, netProfit } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const incomes: FinancialRecord[] = [];
    const expenses: FinancialRecord[] = [];

    const lowercasedTerm = searchTerm.toLowerCase();
    
    financialRecords?.forEach(record => {
      if (record.type === 'income') {
        income += record.amount;
        if (!searchTerm || record.description.toLowerCase().includes(lowercasedTerm) || record.category.toLowerCase().includes(lowercasedTerm)) {
            incomes.push(record);
        }
      } else {
        expense += record.amount;
        if (!searchTerm || record.description.toLowerCase().includes(lowercasedTerm) || record.category.toLowerCase().includes(lowercasedTerm)) {
            expenses.push(record);
        }
      }
    });

    return { incomeRecords: incomes, expenseRecords: expenses, totalIncome: income, totalExpense: expense, netProfit: income - expense };
  }, [financialRecords, searchTerm]);

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

  const handleFormSuccess = () => {
    setAddTransactionOpen(false);
    setSelectedTransaction(undefined);
  }

  const handleDelete = () => {
    if (!transactionToDelete) return;
    const recordRef = doc(firestore, 'barberShops', shopId, 'financialRecords', transactionToDelete.id);
    deleteDocumentNonBlocking(recordRef);
    toast({
      title: 'Transação Removida',
      description: `A transação foi removida.`,
    });
    setTransactionToDelete(null);
  }

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
                  initialData={selectedTransaction}
                  onSuccess={handleFormSuccess}
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

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-8 mt-6">
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
        </TabsContent>
        <TabsContent value="income">
            <Card>
                <CardHeader>
                  <CardTitle>Histórico de Receitas</CardTitle>
                  <CardDescription>Todas as entradas de dinheiro no período selecionado.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TransactionsTable 
                        transactions={incomeRecords} 
                        isLoading={isLoading} 
                        onEdit={(t) => { setSelectedTransaction(t); setAddTransactionOpen(true); }}
                        onDelete={setTransactionToDelete}
                    />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="expenses">
            <Card>
                <CardHeader>
                  <CardTitle>Histórico de Despesas</CardTitle>
                  <CardDescription>Todas as saídas de dinheiro no período selecionado.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TransactionsTable 
                        transactions={expenseRecords} 
                        isLoading={isLoading} 
                        onEdit={(t) => { setSelectedTransaction(t); setAddTransactionOpen(true); }}
                        onDelete={setTransactionToDelete}
                    />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
     <AlertDialog
        open={!!transactionToDelete}
        onOpenChange={(isOpen) => !isOpen && setTransactionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover a transação de <strong>{transactionToDelete?.description}</strong> permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

    