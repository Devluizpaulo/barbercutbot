
'use client';

import { useState } from 'react';
import {
  MoreHorizontal,
  PlusCircle,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddAppointmentForm } from './add-appointment-form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { appointments as mockedAppointments } from '@/lib/data';
import type { Appointment } from '@/lib/data';

export default function AppointmentsPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);

  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const shopId = params.shopId as string;

  // Use mock data
  const appointments = mockedAppointments;
  const isLoading = false;

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedAppointment(undefined);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setSelectedAppointment(undefined);
    toast({
      title: selectedAppointment
        ? 'Agendamento Atualizado!'
        : 'Agendamento Criado!',
      description: 'As informações foram salvas com sucesso (simulação).',
    });
  };

  const handleStatusUpdate = async (
    appointmentId: string,
    status: 'Concluído' | 'Cancelado'
  ) => {
    console.log(`Simulating update status for ${appointmentId} to ${status}`);
    toast({
      title: 'Status Atualizado!',
      description: `O agendamento foi marcado como ${status}.`,
    });
    if (status === 'Cancelado') {
      setAppointmentToCancel(null);
    }
  };

  const getStatusVariant = (status: Appointment['status']) => {
    switch (status) {
      case 'Concluído': return 'secondary';
      case 'Cancelado': return 'destructive';
      case 'Confirmado': return 'default';
      default: return 'outline';
    }
  };

  return (
    <>
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
          <Dialog
            open={isFormOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) setSelectedAppointment(undefined);
              setFormOpen(isOpen);
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedAppointment
                    ? 'Editar Agendamento'
                    : 'Novo Agendamento'}
                </DialogTitle>
                <DialogDescription>
                  {selectedAppointment
                    ? 'Atualize os detalhes do agendamento.'
                    : 'Preencha os detalhes abaixo para criar um novo agendamento.'}
                </DialogDescription>
              </DialogHeader>
              <AddAppointmentForm
                shopId={shopId}
                initialData={selectedAppointment}
                onSuccess={handleFormSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Barbeiro
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Data e Hora
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <span className="sr-only">Ações</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={5}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        </TableRow>
                      ))}
                    {appointments?.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="font-medium">
                            {appointment.clientName}
                          </div>
                          <div className="text-sm text-muted-foreground md:hidden">
                            {appointment.barber}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {appointment.barber}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {format(
                            new Date(appointment.dateTime),
                            "dd/MM/yyyy 'às' HH:mm",
                            { locale: ptBR }
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(appointment.status)}>
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
                              <DropdownMenuItem
                                onClick={() => handleEdit(appointment)}
                              >
                                <Edit className="mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/${shopId}/appointments/${appointment.id}`
                                  )
                                }
                              >
                                <Eye className="mr-2" /> Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusUpdate(
                                    appointment.id,
                                    'Concluído'
                                  )
                                }
                                disabled={appointment.status === 'Concluído'}
                              >
                                <CheckCircle className="mr-2" /> Marcar como
                                Concluído
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  setAppointmentToCancel(appointment)
                                }
                                disabled={appointment.status === 'Cancelado'}
                              >
                                <XCircle className="mr-2" /> Cancelar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && appointments?.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground"
                        >
                          Nenhum agendamento encontrado.
                        </TableCell>
                      </TableRow>
                    )}
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

      <AlertDialog
        open={!!appointmentToCancel}
        onOpenChange={(isOpen) => !isOpen && setAppointmentToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá marcar o agendamento
              como cancelado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                handleStatusUpdate(appointmentToCancel!.id, 'Cancelado')
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
