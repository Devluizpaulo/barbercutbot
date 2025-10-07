
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, UserPlus, ChevronRight } from "lucide-react"
import { clients } from "@/lib/data"
import Link from "next/link"

export default function ClientsPage({ params }: { params: { shopId: string } }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <CardTitle className="font-headline">Gerenciamento de Clientes</CardTitle>
                <CardDescription>
                Visualize, gerencie e adicione novos clientes.
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar clientes..." className="pl-8" />
                </div>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Adicionar Cliente
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Telefone</TableHead>
              <TableHead className="hidden lg:table-cell">Última Visita</TableHead>
              <TableHead className="text-right">Total Gasto</TableHead>
              <TableHead><span className="sr-only">Ver</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/${params.shopId}/clients/${client.id}`} className="hover:underline">
                    {client.name}
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{client.email}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{client.phone}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">{client.lastVisit}</TableCell>
                <TableCell className="text-right font-mono">R${client.totalSpent.toFixed(2)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/${params.shopId}/clients/${client.id}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
