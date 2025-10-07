
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
  collection,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';

import type { Appointment, Customer, Barber } from '@/lib/types';
import { updateAppointmentStatus } from '@/lib/actions';

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

type AppointmentWithId = Appointment & { id: string };

export default function AppointmentsPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [
    appointmentToCancel,
    setAppointmentToCancel,
  ] = useState<AppointmentWithId | null>(null);
  const [
    selectedAppointment,
    setSelectedAppointment,
  ] = useState<AppointmentWithId | undefined>(undefined);

  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const shopId = params.shopId as string;

  const firestore = useFirestore();

  const appointmentsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'barberShops', shopId, 'appointments') : null),
    [firestore, shopId]
  );
  
  const {
    data: appointments,
    isLoading,
    error,
  } = useCollection<Appointment>(appointmentsCollection);

  // Fetch related customer and barber data to display names
  const { data: customers } = useCollection<Customer>(
    useMemoFirebase(() => (firestore ? collection(firestore, 'barberShops', shopId, 'customers') : null), [firestore, shopId])
  );
  const { data: barbers } = useCollection<Barber>(
    useMemoFirebase(() => (firestore ? collection(firestore, 'barberShops', shopId, 'barbers') : null), [firestore, shopId])
  );
  
  const getCustomerName = (customerId: string) => {
    const customer = customers?.find(c => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : 'Cliente não encontrado';
  };

  const getBarberName = (barberId: string) => {
    const barber = barbers?.find(b => b.id === barberId);
    return barber ? `${barber.firstName} ${barber.lastName}` : 'Barbeiro não encontrado';
  };


  const handleEdit = (appointment: AppointmentWithId) => {
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
      description: 'As informações foram salvas com sucesso.',
    });
  };

  const handleStatusUpdate = async (
    appointmentId: string,
    status: 'completed' | 'cancelled'
  ) => {
    const result = await updateAppointmentStatus(shopId, appointmentId, status);
    if (result.success) {
      toast({
        title: 'Status Atualizado!',
        description: `O agendamento foi marcado como ${
          status === 'completed' ? 'concluído' : 'cancelado'
        }.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: result.error,
      });
    }
    if (status === 'cancelled') {
      setAppointmentToCancel(null);
    }
  };

  const getStatusVariant = (status: Appointment['status']) => {
    switch (status) {
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'confirmed':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: Appointment['status']) => {
    const labels: Record<Appointment['status'], string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      'no-show': 'Não Compareceu',
    };
    return labels[status] || 'Desconhecido';
  };

  // Helper to convert Firestore Timestamp to Date for formatting
  const getDateFromTimestamp = (timestamp: any): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    // Fallback for cases where it might already be a Date or string
    return new Date(timestamp);
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
                            {getCustomerName(appointment.customerId)}
                          </div>
                          <div className="text-sm text-muted-foreground md:hidden">
                            {getBarberName(appointment.barberId)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {getBarberName(appointment.barberId)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {format(
                            getDateFromTimestamp(appointment.startTime),
                            "dd/MM/yyyy 'às' HH:mm",
                            { locale: ptBR }
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(appointment.status)}>
                            {getStatusLabel(appointment.status)}
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
                                    'completed'
                                  )
                                }
                                disabled={appointment.status === 'completed'}
                              >
                                <CheckCircle className="mr-2" /> Marcar como
                                Concluído
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  setAppointmentToCancel(appointment)
                                }
                                disabled={appointment.status === 'cancelled'}
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
                handleStatusUpdate(appointmentToCancel!.id, 'cancelled')
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
