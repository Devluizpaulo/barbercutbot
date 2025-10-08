
"use client"

import { useState, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import type { FinancialRecord, Service } from '@/lib/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { DollarSign, ArrowUpRight, ArrowDownLeft, PlusCircle, MoreHorizontal, Download, Edit, Trash2 } from "lucide-react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddTransactionForm } from './add-transaction-form';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const annualChartConfig = {
  income: { label: "Receita", color: "hsl(var(--chart-2))" },
  expense: { label: "Despesa", color: "hsl(var(--chart-5))" },
}

const serviceChartConfig = {
  revenue: { label: "Receita", color: "hsl(var(--chart-1))" },
}

type Period = 'today' | 'week' | 'month' | 'year';

const periodTitles = {
    today: 'Desempenho Diário',
    week: 'Desempenho Semanal',
    month: 'Desempenho Mensal',
    year: 'Desempenho Anual',
};

const periodDescriptions = {
    today: 'Comparativo de receitas e despesas de hoje.',
    week: 'Comparativo de receitas e despesas desta semana.',
    month: 'Comparativo de receitas e despesas deste mês.',
    year: 'Comparativo de receitas e despesas ao longo do ano.',
};


export default function FinancePage() {
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialRecord | undefined>(undefined);
  const [transactionToDelete, setTransactionToDelete] = useState<FinancialRecord | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();
  const { user } = useUser();

  const transactionsQuery = useMemoFirebase(() => user ? collection(firestore, 'barberShops', shopId, 'financialRecords') : null, [firestore, shopId, user]);
  const { data: transactions, isLoading } = useCollection<FinancialRecord>(transactionsQuery);

  const servicesQuery = useMemoFirebase(() => user ? collection(firestore, 'barberShops', shopId, 'services') : null, [firestore, shopId, user]);
  const { data: services } = useCollection<Service>(servicesQuery);

  const serviceChartRef = useRef<HTMLDivElement>(null);
  const paymentChartRef = useRef<HTMLDivElement>(null);
  const annualChartRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = (chartRef: React.RefObject<HTMLDivElement>, fileName: string) => {
    if (!chartRef.current) return;
    html2canvas(chartRef.current, { backgroundColor: null }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'px', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 15, 15, pdfWidth - 30, pdfHeight - 30);
      pdf.save(`${fileName}.pdf`);
    });
  };

  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
        case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date(now.setHours(23, 59, 59, 999));
            break;
        case 'week':
            startDate = startOfWeek(now, { locale: ptBR });
            endDate = endOfWeek(now, { locale: ptBR });
            break;
        case 'month':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
        case 'year':
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            break;
    }
    
    return transactions.filter(t => {
      const transactionDate = toDate(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

}, [period, transactions]);

  const { totalIncome, totalExpense, netProfit, incomeRecords, expenseRecords } = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const incomeRecords: FinancialRecord[] = [];
    const expenseRecords: FinancialRecord[] = [];

    filteredTransactions.forEach(record => {
      if (record.type === 'income') {
        totalIncome += record.amount;
        incomeRecords.push(record);
      } else {
        totalExpense += record.amount;
        expenseRecords.push(record);
      }
    });

    const netProfit = totalIncome - totalExpense;
    return { totalIncome, totalExpense, netProfit, incomeRecords, expenseRecords };
  }, [filteredTransactions]);

  const monthlyRevenue = useMemo(() => {
    const revenueData = Array.from({ length: 12 }, (_, i) => ({
        month: format(new Date(2024, i, 1), 'MMMM', { locale: ptBR }),
        income: 0,
        expense: 0,
    }));

    transactions?.forEach(t => {
        const transactionDate = toDate(t.date);
        const monthIndex = getMonth(transactionDate);
        if (t.type === 'income') {
            revenueData[monthIndex].income += t.amount;
        } else {
            revenueData[monthIndex].expense += t.amount;
        }
    });
    return revenueData;
  }, [transactions]);

  const revenueByService = useMemo(() => {
    const serviceRevenue: { [key: string]: number } = {};
    if (!transactions || !services) return [];
    
    transactions.forEach(t => {
        if (t.type === 'income' && t.category === 'Venda de Serviço') {
            const serviceName = t.description.replace('Serviço - ', '');
            if (serviceRevenue[serviceName]) {
                serviceRevenue[serviceName] += t.amount;
            } else {
                serviceRevenue[serviceName] = t.amount;
            }
        }
    });
    return Object.entries(serviceRevenue).map(([name, revenue]) => ({ name, revenue }));
  }, [transactions, services]);

  const revenueByPaymentMethod = useMemo(() => {
      const paymentData: { [key: string]: number } = {};
      if (!transactions) return [];

      transactions.forEach(t => {
          if (t.type === 'income' && t.paymentMethod) {
              if (paymentData[t.paymentMethod]) {
                  paymentData[t.paymentMethod] += t.amount;
              } else {
                  paymentData[t.paymentMethod] = t.amount;
              }
          }
      });
      return Object.entries(paymentData).map(([method, revenue]) => ({ method, revenue }));
  }, [transactions]);
  

  return (
    <>
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
            Finanças
          </h1>
          <p className="text-muted-foreground">
            Acompanhe a receita e as despesas da sua barbearia.
          </p>
        </div>
        <div className="flex items-center gap-4">
            <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)} className="hidden sm:block">
              <TabsList>
                <TabsTrigger value="today">Hoje</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="month">Mês</TabsTrigger>
                <TabsTrigger value="year">Ano</TabsTrigger>
              </TabsList>
            </Tabs>
            <Dialog open={isAddTransactionOpen} onOpenChange={(isOpen) => { if(!isOpen) setSelectedTransaction(undefined); setAddTransactionOpen(isOpen) }}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Transação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{selectedTransaction ? 'Editar Transação' : 'Adicionar Nova Transação'}</DialogTitle>
                </DialogHeader>
                <AddTransactionForm 
                  shopId={shopId} 
                  initialData={selectedTransaction}
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
            <CardTitle>{periodTitles[period]}</CardTitle>
            <CardDescription>{periodDescriptions[period]}</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={() => handleDownloadPdf(annualChartRef, 'relatorio-desempenho-anual')}>
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
            <ChartContainer config={annualChartConfig} className="w-full h-[250px]">
                <AreaChart
                  data={monthlyRevenue}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="income"
                    type="natural"
                    fill="var(--color-income)"
                    fillOpacity={0.4}
                    stroke="var(--color-income)"
                    stackId="a"
                    name="Receita"
                  />
                  <Area
                    dataKey="expense"
                    type="natural"
                    fill="var(--color-expense)"
                    fillOpacity={0.4}
                    stroke="var(--color-expense)"
                    stackId="b"
                    name="Despesa"
                  />
                </AreaChart>
            </ChartContainer>
        </CardContent>
      </Card>
      
      <div className="space-y-8">
        <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight font-headline">
                Relatórios Detalhados
            </h2>
            <p className="text-muted-foreground">
                Análises específicas para o seu negócio.
            </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
            <Card ref={serviceChartRef}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Receita por Serviço</CardTitle>
                    <CardDescription>Performance de vendas dos principais serviços.</CardDescription>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => handleDownloadPdf(serviceChartRef, 'relatorio-receita-servico')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={serviceChartConfig} className="w-full h-[250px]">
                        <BarChart accessibilityLayer data={revenueByService} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid horizontal={false} />
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={80} />
                            <XAxis type="number" dataKey="revenue" hide />
                            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="revenue" radius={4} fill="var(--color-revenue)" name="Receita" />
                        </BarChart>
                    </ChartContainer>
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
                    <ChartContainer config={{}} className="w-full h-[250px]">
                        <PieChart>
                            <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                            <Pie data={revenueByPaymentMethod} dataKey="revenue" nameKey="method" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>
                                {revenueByPaymentMethod.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="font-headline">Histórico de Transações</CardTitle>
            <CardDescription>Visualize todas as receitas e despesas registradas no período selecionado.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="income">Receitas</TabsTrigger>
              <TabsTrigger value="expenses">Despesas</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
               <TransactionsTable 
                  transactions={filteredTransactions} 
                  isLoading={isLoading} 
                  onEdit={(t) => { setSelectedTransaction(t); setAddTransactionOpen(true); }}
                  onDelete={(t) => setTransactionToDelete(t)}
                />
            </TabsContent>
            <TabsContent value="income" className="mt-4">
              <TransactionsTable 
                transactions={incomeRecords} 
                isLoading={isLoading} 
                onEdit={(t) => { setSelectedTransaction(t); setAddTransactionOpen(true); }}
                onDelete={(t) => setTransactionToDelete(t)}
              />
            </TabsContent>
             <TabsContent value="expenses" className="mt-4">
               <TransactionsTable 
                transactions={expenseRecords} 
                isLoading={isLoading} 
                onEdit={(t) => { setSelectedTransaction(t); setAddTransactionOpen(true); }}
                onDelete={(t) => setTransactionToDelete(t)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
    <AlertDialog
        open={!!transactionToDelete}
        onOpenChange={(isOpen) => !isOpen && setTransactionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá remover a transação de <strong>{transactionToDelete?.description}</strong> permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!transactionToDelete) return;
                const recordRef = doc(firestore, 'barberShops', shopId, 'financialRecords', transactionToDelete.id);
                deleteDocumentNonBlocking(recordRef);
                setTransactionToDelete(null);
              }}
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

function TransactionsTable({ transactions, isLoading, onEdit, onDelete }: { transactions: FinancialRecord[], isLoading: boolean, onEdit: (t: FinancialRecord) => void, onDelete: (t: FinancialRecord) => void }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  return (
    <>
      <Table>
          <TableHeader>
              <TableRow>
                  <TableHead>Detalhes</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[40px]"><span className="sr-only">Ações</span></TableHead>
              </TableRow>
          </TableHeader>
          <TableBody>
             {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}><Skeleton className="h-5 w-full" /></TableCell>
                </TableRow>
              ))}
              {paginatedTransactions.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="font-medium">{record.description}</div>
                    {record.paymentMethod && <div className="text-sm text-muted-foreground md:hidden">{record.paymentMethod}</div>}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{record.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{format(toDate(record.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className={`text-right font-medium ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {record.type === 'expense' && '-'}R${record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                   <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(record)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(record)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && paginatedTransactions.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">Nenhuma transação encontrada para este período.</TableCell>
                 </TableRow>
              )}
          </TableBody>
      </Table>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Anterior
                </Button>
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Próxima
                </Button>
            </div>
        </div>
      )}
    </>
  )
}
