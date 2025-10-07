
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
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area } from "recharts"
import { DollarSign, ArrowUpRight, ArrowDownLeft, LoaderCircle, PlusCircle, MoreHorizontal } from "lucide-react"
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { monthlyRevenue } from "@/lib/data"
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
            Finanças
          </h1>
          <p className="text-muted-foreground">
            Acompanhe a receita e as despesas da sua barbearia.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Transação
        </Button>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 text-white">
          <CardHeader>
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R${(totalIncome - totalExpense).toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">+22% do último mês</p>
            <AreaChart data={financialData.slice(0,6)} margin={{ top: 20, right: 0, left: 0, bottom: 0 }} width={200} height={80}>
                <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="income" stroke="hsl(var(--primary))" fill="url(#colorIncome)" strokeWidth={2} />
            </AreaChart>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rascunhos</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-bold">R$137.6k</div>
            <p className="text-xs text-muted-foreground">+5% do último mês</p>
             <AreaChart data={financialData.slice(2,8)} margin={{ top: 20, right: 0, left: 0, bottom: 0 }} width={200} height={80}>
                <defs>
                    <linearGradient id="colorDraft" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="income" stroke="hsl(var(--chart-4))" fill="url(#colorDraft)" strokeWidth={2} />
            </AreaChart>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pagos</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-bold">R${totalIncome.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">+15% do último mês</p>
            <AreaChart data={financialData.slice(4,10)} margin={{ top: 20, right: 0, left: 0, bottom: 0 }} width={200} height={80}>
                <defs>
                    <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="income" stroke="hsl(var(--chart-5))" fill="url(#colorPaid)" strokeWidth={2} />
            </AreaChart>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Abertos</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-bold">R${totalExpense.toLocaleString('pt-BR')}</div>
             <p className="text-xs text-muted-foreground">+10% do último mês</p>
             <AreaChart data={financialData.slice(1,7)} margin={{ top: 20, right: 0, left: 0, bottom: 0 }} width={200} height={80}>
                <defs>
                    <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="income" stroke="hsl(var(--primary))" fill="url(#colorOpen)" strokeWidth={2} />
            </AreaChart>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-headline">Pagamentos</CardTitle>
             <Select defaultValue="monthly">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <BarChart accessibilityLayer data={financialData}>
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
                <Bar dataKey="income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
