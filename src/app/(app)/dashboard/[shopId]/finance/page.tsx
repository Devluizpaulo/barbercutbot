
"use client"

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { transactions as mockedTransactions, revenueByService, revenueByPaymentMethod } from '@/lib/data';
import type { Transaction as FinancialRecord } from '@/lib/data';

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
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { DollarSign, ArrowUpRight, ArrowDownLeft, PlusCircle, MoreHorizontal } from "lucide-react"
import { format } from 'date-fns';
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


const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const annualChartConfig = {
  income: { label: "Receita", color: "hsl(var(--chart-2))" },
  expense: { label: "Despesa", color: "hsl(var(--chart-5))" },
}

const serviceChartConfig = {
  revenue: { label: "Receita", color: "hsl(var(--chart-1))" },
}

export default function FinancePage() {
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const params = useParams();
  const shopId = params.shopId as string;

  const transactions = mockedTransactions;
  const isLoading = false;

  const { totalIncome, totalExpense, netProfit, incomeRecords, expenseRecords } = useMemo(() => {
    const records = transactions || [];
    let totalIncome = 0;
    let totalExpense = 0;
    const incomeRecords: FinancialRecord[] = [];
    const expenseRecords: FinancialRecord[] = [];

    records.forEach(record => {
      if (record.type === 'Receita') {
        totalIncome += record.amount;
        incomeRecords.push(record);
      } else {
        totalExpense += record.amount;
        expenseRecords.push(record);
      }
    });

    const netProfit = totalIncome - totalExpense;
    return { totalIncome, totalExpense, netProfit, incomeRecords, expenseRecords };
  }, [transactions]);
  

  return (
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
            <p className="text-xs text-muted-foreground">Total de entradas registradas.</p>
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
            <p className="text-xs text-muted-foreground">Total de saídas registradas.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-3/4" /> : (
              <div className={`text-2xl font-bold ${netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>R${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            )}
             <p className="text-xs text-muted-foreground">Receita total menos despesas.</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-8">
        <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight font-headline">
                Relatórios
            </h2>
            <p className="text-muted-foreground">
                Análises detalhadas do desempenho do seu negócio.
            </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Receita por Serviço</CardTitle>
                    <CardDescription>Performance de vendas dos principais serviços.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={serviceChartConfig} className="w-full h-[250px]">
                        <BarChart accessibilityLayer data={revenueByService} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid horizontal={false} />
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                            <XAxis type="number" dataKey="revenue" hide />
                            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="revenue" radius={4} fill="var(--color-revenue)" />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Forma de Pagamento</CardTitle>
                    <CardDescription>Distribuição da receita por forma de pagamento.</CardDescription>
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
            <CardDescription>Visualize todas as receitas e despesas registradas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="income">Receitas</TabsTrigger>
              <TabsTrigger value="expenses">Despesas</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
               <TransactionsTable transactions={transactions} isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="income" className="mt-4">
              <TransactionsTable transactions={incomeRecords} isLoading={isLoading} />
            </TabsContent>
             <TabsContent value="expenses" className="mt-4">
               <TransactionsTable transactions={expenseRecords} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function TransactionsTable({ transactions, isLoading }: { transactions: FinancialRecord[], isLoading: boolean }) {
  return (
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
              {transactions.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="font-medium">{record.description}</div>
                    {record.paymentMethod && <div className="text-sm text-muted-foreground md:hidden">{record.paymentMethod}</div>}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{record.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{record.date}</TableCell>
                  <TableCell className={`text-right font-medium ${record.type === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                    {record.type === 'Despesa' && '-'}R${record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500">Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && transactions.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">Nenhuma transação encontrada.</TableCell>
                 </TableRow>
              )}
          </TableBody>
      </Table>
  )
}

    