
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
import { MoreVertical, DollarSign, Users, Calendar, BarChart, ExternalLink, Shield, Ticket, CreditCard, Settings, FileText } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
            <BarChart className="h-4 w-4 text-muted-foreground" />
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
              +180.1% em relação ao mês passado
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

      <div className="space-y-4">
        <h2 className="text-xl font-bold font-headline">Ferramentas do Administrador</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Gerenciar Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Adicione, remova ou edite os usuários da plataforma.</p>
            </CardContent>
            <CardContent>
                <Button variant="outline" asChild>
                    <Link href="#">Acessar Usuários</Link>
                </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
               <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Gerenciar Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Edite os termos de uso, contratos e FAQs.</p>
            </CardContent>
             <CardContent>
                <Button variant="outline" asChild>
                    <Link href="#">Acessar Documentos</Link>
                </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
               <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Configurações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Ajuste as configurações gerais da plataforma.</p>
            </CardContent>
             <CardContent>
                <Button variant="outline" asChild>
                    <Link href="#">Acessar Configurações</Link>
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>

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
                        <TableHead>Clientes</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status Pag.</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Tickets</TableHead>
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
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground"/>
                                    <span>{shop.totalClients}</span>
                                </div>
                            </TableCell>
                            <TableCell>{shop.plan}</TableCell>
                             <TableCell>
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
                             <TableCell>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground"/>
                                    <span>{shop.planDueDate}</span>
                                </div>
                             </TableCell>
                            <TableCell>
                                <div className={cn(
                                    "flex items-center gap-2",
                                    shop.openTickets > 0 && "font-bold text-destructive"
                                )}>
                                    <Ticket className="h-4 w-4 text-muted-foreground"/>
                                    <span>{shop.openTickets}</span>
                                </div>
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
  )
}
