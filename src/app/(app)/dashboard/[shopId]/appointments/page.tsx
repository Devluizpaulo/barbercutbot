
"use client";

import { useState } from "react";
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
import { Calendar as CalendarIcon, MoreHorizontal, PlusCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { appointments } from "@/lib/data"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddAppointmentForm } from "./add-appointment-form";
import { useParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AppointmentsPage() {
  const [isAddAppointmentOpen, setAddAppointmentOpen] = useState(false);
  const params = useParams();
  const shopId = params.shopId as string;

  return (
    <div className="grid gap-8 mt-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
            Agendamentos
          </h1>
          <p className="text-muted-foreground">
            Aqui está uma lista de todos os seus agendamentos.
          </p>
        </div>
        <Dialog open={isAddAppointmentOpen} onOpenChange={setAddAppointmentOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
              <DialogDescription>
                Preencha os detalhes abaixo para criar um novo agendamento.
              </DialogDescription>
            </DialogHeader>
            <AddAppointmentForm 
              shopId={shopId} 
              onSuccess={() => setAddAppointmentOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Barbeiro</TableHead>
                    <TableHead className="hidden md:table-cell">Data e Hora</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
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
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ações</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                            <DropdownMenuItem>Marcar como Concluído</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Cancelar</DropdownMenuItem>
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
        <div className="lg:col-span-1 flex flex-col gap-8">
          <Card>
            <CardContent className="flex justify-center p-0">
              <Calendar
                mode="single"
                selected={new Date()}
                className="rounded-md"
                locale={ptBR}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
