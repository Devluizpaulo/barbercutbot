
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
import { MoreVertical, DollarSign, Users, Calendar, BarChart, ExternalLink, Shield } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminDashboard() {
    const totalRevenue = shops.reduce((acc, shop) => acc + (shop.totalRevenue || 0), 0)
    const totalClients = shops.reduce((acc, shop) => acc + shop.totalClients, 0)
    const totalAppointments = shops.reduce((acc, shop) => acc + shop.todayAppointments, 0) // Assuming this is total not just today

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
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

       <Card>
        <CardHeader>
            <CardTitle className="font-headline">Barbearias Parceiras</CardTitle>
            <CardDescription>Uma lista de todas as barbearias na sua plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Barbearia</TableHead>
                        <TableHead className="hidden md:table-cell">Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Plano</TableHead>
                        <TableHead className="hidden md:table-cell">Receita (Mês)</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {shops.map(shop => (
                        <TableRow key={shop.id}>
                            <TableCell>
                                <div className="font-medium">{shop.name}</div>
                                <div className="text-sm text-muted-foreground md:hidden">{shop.location}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                <Badge variant={shop.status === 'Ativo' ? 'secondary' : 'destructive'}>{shop.status}</Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">{shop.plan}</TableCell>
                            <TableCell className="hidden md:table-cell font-mono">
                                R${(shop.totalRevenue || 0).toLocaleString('pt-BR')}
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
                                        <DropdownMenuItem>Gerenciar Fatura</DropdownMenuItem>
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
