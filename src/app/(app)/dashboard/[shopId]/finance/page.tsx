
"use client"

import { useParams } from 'next/navigation';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { FinancialRecord } from '@/lib/types';
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
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { DollarSign, ArrowUpRight, ArrowDownLeft, LoaderCircle } from "lucide-react"
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { monthlyRevenue } from "@/lib/data"


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

// Chart data is still mocked as aggregation would require backend functions
const financialData = monthlyRevenue.map(item => ({
  month: item.month,
  income: item.revenue,
  expense: Math.floor(Math.random() * (item.revenue * 0.7) + (item.revenue * 0.2)),
}))

export default function FinancePage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !shopId) return null;
    return query(
      collection(firestore, `/barberShops/${shopId}/financialRecords`),
      orderBy('date', 'desc')
    );
  }, [firestore, shopId]);

  const { data: transactions, isLoading } = useCollection<FinancialRecord>(transactionsQuery);

  const financialRecords = transactions || [];

  const { totalIncome, totalExpense } = financialRecords.reduce(
    (acc, record) => {
      if (record.type === 'income') {
        acc.totalIncome += record.amount;
      } else {
        acc.totalExpense += record.amount;
      }
      return acc;
    },
    { totalIncome: 0, totalExpense: 0 }
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Finanças
        </h1>
        <p className="text-muted-foreground">
          Acompanhe a receita e as despesas da sua barbearia.
        </p>
      </div>

       <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <Skeleton className="h-8 w-32" />
            ) : (
                <div className="text-2xl font-bold">R${totalIncome.toLocaleString('pt-BR')}</div>
            )}
            <p className="text-xs text-muted-foreground">+15% do último mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
             {isLoading ? (
                <Skeleton className="h-8 w-32" />
            ) : (
                <div className="text-2xl font-bold">R${totalExpense.toLocaleString('pt-BR')}</div>
            )}
            <p className="text-xs text-muted-foreground">+5% do último mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? (
                <Skeleton className="h-8 w-32" />
            ) : (
                <div className="text-2xl font-bold">R${(totalIncome - totalExpense).toLocaleString('pt-BR')}</div>
            )}
            <p className="text-xs text-muted-foreground">+22% do último mês</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="font-headline">Receita vs. Despesas</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
             <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <LineChart
                accessibilityLayer
                data={financialData}
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
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `R$${value / 1000}k`}
                />
                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                <Line
                  dataKey="income"
                  type="monotone"
                  stroke="var(--color-income)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  dataKey="expense"
                  type="monotone"
                  stroke="var(--color-expense)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="font-headline">Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {isLoading && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-primary" />
                            </TableCell>
                        </TableRow>
                    )}
                    {financialRecords.slice(0, 10).map((transaction) => (
                        <TableRow key={transaction.id}>
                            <TableCell className="text-muted-foreground">{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                            <TableCell className="font-medium">{transaction.description}</TableCell>
                            <TableCell>
                                <Badge variant={transaction.type === 'income' ? 'outline' : 'destructive'}>
                                  {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                                </Badge>
                            </TableCell>
                            <TableCell className={`text-right font-mono ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                {transaction.type === 'income' ? '+' : '-'}R${transaction.amount.toFixed(2)}
                            </TableCell>
                        </TableRow>
                    ))}
                    {!isLoading && financialRecords.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                Nenhuma transação encontrada.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  )
}
