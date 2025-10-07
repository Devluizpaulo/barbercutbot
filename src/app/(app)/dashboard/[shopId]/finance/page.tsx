
"use client"

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { transactions as mockedTransactions } from '@/lib/data';
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
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { DollarSign, ArrowUpRight, ArrowDownLeft, LoaderCircle, PlusCircle, MoreHorizontal } from "lucide-react"
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


// Chart data is still mocked as aggregation would require backend functions
const financialData = [
  { month: "Jan", income: 4230, expense: 2200 },
  { month: "Fev", income: 3890, expense: 2000 },
  { month: "Mar", income: 4500, expense: 2500 },
  { month: "Abr", income: 4880, expense: 2600 },
  { month: "Mai", income: 5120, expense: 2800 },
  { month: "Jun", income: 5500, expense: 3000 },
  { month: "Jul", income: 5800, expense: 3100 },
  { month: "Ago", income: 6200, expense: 3300 },
  { month: "Set", income: 5900, expense: 3200 },
  { month: "Out", income: 6500, expense: 3500 },
  { month: "Nov", income: 6800, expense: 3700 },
  { month: "Dez", income: 7200, expense: 3900 },
];

const chartConfig = {
  income: {
    label: "Receita",
    color: "hsl(var(--chart-2))",
  },
  expense: {
    label: "Despesa",
    color: "hsl(var(--chart-5))",
  },
}


export default function FinancePage() {
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const params = useParams();
  const shopId = params.shopId as string;

  const transactions = mockedTransactions;
  const isLoading = false;

  const { totalIncome, totalExpense, netProfit, recentTransactions } = useMemo(() => {
    const records = transactions || [];
    const totals = records.reduce(
      (acc, record) => {
        if (record.type === 'Receita') {
          acc.totalIncome += record.amount;
        } else {
          acc.totalExpense += record.amount;
        }
        return acc;
      },
      { totalIncome: 0, totalExpense: 0 }
    );
    const netProfit = totals.totalIncome - totals.totalExpense;
    const recent = records.slice(0, 5);
    return { ...totals, netProfit, recentTransactions: recent };
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
          <DialogContent>
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
              <div className="text-2xl font-bold">R${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            )}
             <p className="text-xs text-muted-foreground">Receita total menos despesas.</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader>
              <CardTitle className="font-headline">Receita vs. Despesa (Anual)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
              <ChartContainer config={chartConfig} className="w-full h-[300px]">
                <AreaChart accessibilityLayer data={financialData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${Number(value) / 1000}k`} />
                    <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Area type="monotone" dataKey="income" stackId="1" stroke="var(--color-income)" fill="var(--color-income)" name="Receita" />
                    <Area type="monotone" dataKey="expense" stackId="1" stroke="var(--color-expense)" fill="var(--color-expense)" name="Despesa" />
                </AreaChart>
              </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
           <CardHeader>
              <CardTitle className="font-headline">Transações Recentes</CardTitle>
              <CardDescription>As últimas 5 transações registradas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                   {isLoading && Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                    {recentTransactions.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="font-medium">{record.description}</div>
                          <Badge variant={record.type === 'Receita' ? 'secondary' : 'destructive'} className="capitalize mt-1">{record.type}</Badge>
                        </TableCell>
                         <TableCell>{record.date}</TableCell>
                        <TableCell className={`text-right font-medium ${record.type === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                          R${record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && recentTransactions.length === 0 && (
                       <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center">Nenhuma transação encontrada.</TableCell>
                       </TableRow>
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
