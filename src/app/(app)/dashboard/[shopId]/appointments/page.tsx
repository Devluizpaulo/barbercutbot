
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Store,
  Users,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { AddAppointmentForm } from './add-appointment-form';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, Timestamp, doc, updateDoc, query, where } from 'firebase/firestore';
import type { Appointment, Customer, Barber, Service } from '@/lib/types';
import { CalendarView } from './calendar-view';
import { CashierDialog } from '../cashier-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
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
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


export default function AppointmentsPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [isCashierOpen, setIsCashierOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBarberId, setSelectedBarberId] = useState<string | 'all'>('all');

  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const appointmentsQuery = useMemoFirebase(
    () => (user && shopId) ? query(
        collection(firestore, 'barberShops', shopId, 'appointments'),
        where('barberShopId', '==', shopId) // Regra de segurança
    ) : null,
    [firestore, shopId, user]
  );
  const { data: appointments, isLoading: areAppointmentsLoading } = useCollection<Appointment>(appointmentsQuery);

  const customersQuery = useMemoFirebase(() => (user && shopId) ? query(
      collection(firestore, 'barberShops', shopId, 'customers'),
      where('barberShopId', '==', shopId) // Regra de segurança
  ) : null, [firestore, shopId, user]);
  const { data: customers, isLoading: areCustomersLoading } = useCollection<Customer>(customersQuery);

  const barbersQuery = useMemoFirebase(() => (user && shopId) ? query(
      collection(firestore, 'barberShops', shopId, 'barbers'),
      where('barberShopId', '==', shopId) // Regra de segurança
  ) : null, [firestore, shopId, user]);
  const { data: barbers, isLoading: areBarbersLoading } = useCollection<Barber>(barbersQuery);

  const servicesQuery = useMemoFirebase(() => (user && shopId) ? query(
      collection(firestore, 'barberShops', shopId, 'services'),
      where('barberShopId', '==', shopId) // Regra de segurança
  ) : null, [firestore, shopId, user]);
  const { data: services, isLoading: areServicesLoading } = useCollection<Service>(servicesQuery);

  const isLoading = areAppointmentsLoading || areCustomersLoading || areBarbersLoading || areServicesLoading;


  const handleAddNew = () => {
    setSelectedAppointment(undefined);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setSelectedAppointment(undefined);
  };

  const changeDate = (amount: number) => {
    setSelectedDate(prev => addDays(prev, amount));
  };

  const goToday = () => setSelectedDate(new Date());

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setFormOpen(true);
  };

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setFormOpen(true);
  };

  const handleCancel = async () => {
    if (!appointmentToCancel) return;
    try {
      const apptRef = doc(firestore, 'barberShops', shopId, 'appointments', appointmentToCancel.id);
      await updateDoc(apptRef, { status: 'cancelled' });
      toast({ title: "Agendamento Cancelado", description: "O agendamento foi marcado como cancelado." });
    } catch (err) {
      console.error('Erro ao cancelar agendamento', err);
      toast({ variant: 'destructive', title: "Erro", description: "Não foi possível cancelar o agendamento." });
    } finally {
      setAppointmentToCancel(null);
    }
  };

  const handleComplete = async (appointment: Appointment) => {
    try {
      const apptRef = doc(firestore, 'barberShops', shopId, 'appointments', appointment.id);
      await updateDoc(apptRef, { status: 'completed' });
      toast({ title: "Agendamento Concluído", description: "O agendamento foi marcado como concluído." });
    } catch (err) {
      console.error('Erro ao concluir agendamento', err);
       toast({ variant: 'destructive', title: "Erro", description: "Não foi possível concluir o agendamento." });
    }
  };

  return (
    <>
      <div className="flex h-full flex-col gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
              Agenda
            </h1>
            <p className="text-muted-foreground">
              Visualize e gerencie os agendamentos do seu time.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Dialog
              open={isFormOpen}
              onOpenChange={(isOpen) => {
                if (!isOpen) setSelectedAppointment(undefined);
                setFormOpen(isOpen);
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto">
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
        </div>
        
        {!isLoading && (
          (() => {
            const hasAppointments = (appointments?.length || 0) > 0;
            const hasCustomers = (customers?.length || 0) > 0;
            const hasBarbers = (barbers?.length || 0) > 0;
            const hasServices = (services?.length || 0) > 0;
            if (hasAppointments && hasCustomers && hasBarbers && hasServices) return null;
            return (
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {!hasAppointments && (
                      <div
                        onClick={handleAddNew}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') handleAddNew();
                        }}
                        className="flex items-center justify-between rounded-md border p-4 hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="h-5 w-5" />
                          <div>
                            <div className="font-medium">Crie um agendamento</div>
                            <div className="text-sm text-muted-foreground">Cliente, serviço e horário</div>
                          </div>
                        </div>
                        <Button size="sm">Abrir</Button>
                      </div>
                    )}
                    {!hasCustomers && (
                      <div className="flex items-center justify-between rounded-md border p-4 hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5" />
                          <div>
                            <div className="font-medium">Adicione um cliente</div>
                            <div className="text-sm text-muted-foreground">Necessário para agendar</div>
                          </div>
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/dashboard/${shopId}/clients`}>Abrir</Link>
                        </Button>
                      </div>
                    )}
                    {!hasBarbers && (
                      <div className="flex items-center justify-between rounded-md border p-4 hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Store className="h-5 w-5" />
                          <div>
                            <div className="font-medium">Adicione um profissional</div>
                            <div className="text-sm text-muted-foreground">Atribua aos atendimentos</div>
                          </div>
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/dashboard/${shopId}/barbers`}>Abrir</Link>
                        </Button>
                      </div>
                    )}
                    {!hasServices && (
                      <div className="flex items-center justify-between rounded-md border p-4 hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Store className="h-5 w-5" />
                          <div>
                            <div className="font-medium">Cadastre um serviço</div>
                            <div className="text-sm text-muted-foreground">Preço e duração</div>
                          </div>
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/dashboard/${shopId}/services`}>Abrir</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })()
        )}

        <header className="flex flex-none flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold hidden md:block">Agenda</h2>
                <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Todos os Barbeiros" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Barbeiros</SelectItem>
                        {barbers?.map(barber => (
                            <SelectItem key={barber.id} value={barber.id}>{barber.firstName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(selectedDate, 'PPP', { locale: ptBR })}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                        locale={ptBR}
                    />
                    </PopoverContent>
                </Popover>
                <Button variant="secondary" onClick={goToday}>Hoje</Button>
                <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </header>

        <div className="flex-1 -mt-8 -mx-4 -mb-4 sm:-mx-6 sm:-mb-8">
            <CalendarView 
                appointments={appointments || []}
                barbers={barbers || []}
                customers={customers || []}
                services={services || []}
                isLoading={isLoading}
                selectedDate={selectedDate}
                selectedBarberId={selectedBarberId}
                onEdit={handleEdit}
                onReschedule={handleReschedule}
                onCancel={(appt) => setAppointmentToCancel(appt)}
                onComplete={handleComplete}
            />
        </div>
      </div>
      <CashierDialog 
        open={isCashierOpen} 
        onOpenChange={setIsCashierOpen} 
        shopId={shopId} 
       />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
                onClick={() => setIsCashierOpen(true)}
                className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg"
                size="icon"
            >
                <Store className="h-8 w-8" />
                <span className="sr-only">Abrir Caixa</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={10}>Abrir caixa</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AlertDialog open={!!appointmentToCancel} onOpenChange={(isOpen) => !isOpen && setAppointmentToCancel(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar Agendamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel} className="bg-destructive hover:bg-destructive/80">
                      Sim, Cancelar
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
