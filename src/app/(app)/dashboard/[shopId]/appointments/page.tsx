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
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-2">
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
                  <TableHead>Barbeiro</TableHead>
                  <TableHead>Data e Hora</TableHead>
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
                    </TableCell>
                    <TableCell>{appointment.barber}</TableCell>
                    <TableCell>{format(appointment.dateTime, "MMM d, yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
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
      <div className="md:col-span-1 flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Calendário</CardTitle>
             <Button className="mt-4">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </CardHeader>
          <CardContent>
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
