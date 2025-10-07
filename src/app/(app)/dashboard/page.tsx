
'use client';

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
import { shops } from "@/lib/data"
import { Activity, MoreVertical, DollarSign, Users, Calendar, ExternalLink, Shield, Ticket, CreditCard, Settings, FileText, Store } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"


const chartConfig = {
  shops: {
    label: "Lojas",
    color: "hsl(var(--primary))",
  },
}
const chartData = [
  { month: "Jan", shops: 18 },
  { month: "Fev", shops: 20 },
  { month: "Mar", shops: 22 },
  { month: "Abr", shops: 27 },
  { month: "Mai", shops: 30 },
  { month: "Jun", shops: 35 },
];


export default function AdminDashboard() {
    const totalRevenue = shops.reduce((acc, shop) => acc + (shop.totalRevenue || 0), 0)
    const totalClients = shops.reduce((acc, shop) => acc + shop.totalClients, 0)
    const totalAppointments = shops.reduce((acc, shop) => acc + shop.todayAppointments, 0) // Assuming this is total not just today

  return (
    <div className="flex flex-1 flex-col gap-8">
       <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <Shield className="h-7 w-7 md:h-8 md:w-8"/> Painel do Administrador
        </h1>
        <p className="text-muted-foreground">
          Gerencie suas barbearias parceiras, finanças e performance geral.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita Total (Mês)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R${totalRevenue.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              +5.2% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Barbearias Ativas
            </CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shops.length}</div>
            <p className="text-xs text-muted-foreground">
              +1 no último mês
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
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">
              em toda a plataforma
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Agendamentos (Hoje)
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAppointments}</div>
             <p className="text-xs text-muted-foreground">
              em todas as lojas
            </p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-8 lg:grid-cols-3">
         <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Crescimento de Lojas na Plataforma</CardTitle>
                <CardDescription>
                  Novas barbearias que se juntaram nos últimos 6 meses.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer config={chartConfig} className="w-full h-[300px]">
                  <BarChart accessibilityLayer data={chartData}>
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
                    <Bar dataKey="shops" fill="var(--color-shops)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Barbearias Parceiras</CardTitle>
                    <CardDescription>Uma lista de todas as barbearias na sua plataforma.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[250px]">Barbearia</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden md:table-cell">Clientes</TableHead>
                                <TableHead className="hidden lg:table-cell">Plano</TableHead>
                                <TableHead className="hidden md:table-cell">Status Pag.</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shops.map(shop => (
                                <TableRow key={shop.id}>
                                    <TableCell>
                                        <div className="font-medium">{shop.name}</div>
                                        <div className="text-sm text-muted-foreground">{shop.location}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={shop.status === 'Ativo' ? 'default' : 'destructive'}
                                            className={cn(shop.status === 'Ativo' && 'bg-green-500 hover:bg-green-500/80')}
                                        >
                                            {shop.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground"/>
                                            <span>{shop.totalClients}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">{shop.plan}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <Badge 
                                            variant={
                                                shop.paymentStatus === 'Pago' ? 'secondary' : 
                                                shop.paymentStatus === 'Pendente' ? 'outline' : 'destructive'
                                            }
                                            className={cn(
                                                shop.paymentStatus === 'Pago' && 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                                                shop.paymentStatus === 'Pendente' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'
                                            )}
                                        >
                                            {shop.paymentStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/${shop.id}`}>
                                                        <ExternalLink className="mr-2 h-4 w-4" />
                                                        Ver Dashboard
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <CreditCard className="mr-2 h-4 w-4" />
                                                    Gerenciar Fatura
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-500">Desativar</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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
                {shops.slice(0, 4).map((shop, index) => (
                    <div className="flex items-start gap-4" key={shop.id}>
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>{shop.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                                Nova barbearia cadastrada!
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Bem-vinda, {shop.name}.
                            </p>
                        </div>
                    </div>
                ))}
            </CardContent>
           </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Ferramentas</CardTitle>
                    <CardDescription>Acessos rápidos para gerenciamento da plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                    <Button variant="outline" className="justify-start gap-2" asChild>
                        <Link href="#"><Users className="h-4 w-4"/> Gerenciar Usuários</Link>
                    </Button>
                    <Button variant="outline" className="justify-start gap-2" asChild>
                        <Link href="/dashboard/documents"><FileText className="h-4 w-4"/> Gerenciar Documentos</Link>
                    </Button>
                     <Button variant="outline" className="justify-start gap-2" asChild>
                        <Link href="#"><Settings className="h-4 w-4"/> Configurações Gerais</Link>
                    </Button>
                </CardContent>
            </Card>
         </div>
       </div>
    </div>
  )
}
