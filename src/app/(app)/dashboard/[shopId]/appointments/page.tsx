
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
import { Calendar as CalendarIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { appointments } from "@/lib/data"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function AppointmentsPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Todos os Agendamentos</CardTitle>
            <CardDescription>
              Aqui está uma lista de todos os agendamentos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Barbeiro</TableHead>
                  <TableHead className="hidden md:table-cell">Data e Hora</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="font-medium">{appointment.clientName}</div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.service}
                      </div>
                       <div className="text-sm text-muted-foreground md:hidden">
                        {format(appointment.dateTime, "MMM d, HH:mm", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{appointment.barber}</TableCell>
                    <TableCell className="hidden md:table-cell">{format(appointment.dateTime, "MMM d, yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell>
                      <Badge variant={appointment.status === 'Concluído' ? 'secondary' : appointment.status === 'Cancelado' ? 'destructive' : 'default'}>
                        {appointment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1 flex flex-col gap-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <CardTitle className="font-headline">Calendário</CardTitle>
              <Button>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Novo Agendamento
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={new Date()}
              className="rounded-md border"
              locale={ptBR}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
