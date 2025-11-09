
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Store,
  Users,
  LayoutGrid,
  Filter,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from "@/components/ui/checkbox"
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

import { useFirestore, useUser, useAuth } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Appointment, Customer, Barber, Service } from '@/lib/types';
import { CalendarView } from './calendar-view';
import { CashierDialog } from '../cashier-dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
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


export default function AppointmentsPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [isCashierOpen, setIsCashierOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Controls which barbers are visible in the columns
  const [visibleBarberIds, setVisibleBarberIds] = useState<string[]>([]);

  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [barbers, setBarbers] = useState<Barber[] | null>(null);
  const [services, setServices] = useState<Service[] | null>(null);
  const [listsLoading, setListsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user || !shopId || !auth?.currentUser) {
        setAppointments(null);
        setCustomers(null);
        setBarbers(null);
        setServices(null);
        setListsLoading(false);
        return;
      }
      setListsLoading(true);
      try {
        const token = await auth.currentUser.getIdToken();
        const headers = { Authorization: `Bearer ${token}` } as HeadersInit;
        const [a, c, b, s] = await Promise.all([
          fetch(`/api/shops/${shopId}/appointments`, { headers }),
          fetch(`/api/shops/${shopId}/customers`, { headers }),
          fetch(`/api/shops/${shopId}/barbers`, { headers }),
          fetch(`/api/shops/${shopId}/services`, { headers }),
        ]);
        if (cancelled) return;
        const [aj, cj, bj, sj] = await Promise.all([a.json(), c.json(), b.json(), s.json()]);
        setAppointments(aj.items || []);
        setCustomers(cj.items || []);
        setBarbers(bj.items || []);
        setServices(sj.items || []);
        
        // Initially, set all barbers as visible
        if (bj.items) {
          setVisibleBarberIds(bj.items.map((barber: Barber) => barber.id));
        }

      } catch (err) {
        console.error('Erro ao carregar listas', err);
        setAppointments([]);
        setCustomers([]);
        setBarbers([]);
        setServices([]);
      } finally {
        if (!cancelled) setListsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user, shopId, auth]);

  const isLoading = listsLoading;

  const handleBarberVisibilityChange = (barberId: string, checked: boolean | 'indeterminate') => {
    setVisibleBarberIds(prev => {
        if (checked) {
            return [...prev, barberId];
        } else {
            return prev.filter(id => id !== barberId);
        }
    });
  };
  
  const filteredBarbers = useMemo(() => {
    if (!barbers) return [];
    return barbers.filter(b => visibleBarberIds.includes(b.id));
  }, [barbers, visibleBarberIds]);

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
      <div className="flex flex-col h-full gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
              <LayoutGrid />
              Agenda
            </h1>
            <p className="text-muted-foreground">
              Visualize e gerencie os agendamentos do seu time.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <Button variant="outline" onClick={goToday}>Hoje</Button>
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
        
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 -mx-4 -mb-4 sm:-mx-6 sm:-mb-8">
            {/* Left Sidebar */}
            <div className="hidden lg:flex flex-col gap-6 p-4 border-r">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{format(selectedDate, 'MMMM yyyy', { locale: ptBR })}</h3>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => changeDate(-1)}><ChevronLeft/></Button>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => changeDate(1)}><ChevronRight/></Button>
                    </div>
                </div>
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={ptBR}
                    className="rounded-md border"
                />
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><Filter/> Profissionais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {barbers?.map(barber => (
                            <div key={barber.id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`barber-${barber.id}`} 
                                    checked={visibleBarberIds.includes(barber.id)}
                                    onCheckedChange={(checked) => handleBarberVisibilityChange(barber.id, checked)}
                                />
                                <label
                                    htmlFor={`barber-${barber.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {barber.firstName} {barber.lastName}
                                </label>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Main Calendar View */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0 pr-4 sm:pr-6 pb-4 sm:pb-6">
                <CalendarView 
                    appointments={appointments || []}
                    barbers={filteredBarbers}
                    customers={customers || []}
                    services={services || []}
                    isLoading={isLoading}
                    selectedDate={selectedDate}
                    onEdit={handleEdit}
                    onReschedule={handleReschedule}
                    onCancel={(appt) => setAppointmentToCancel(appt)}
                    onComplete={handleComplete}
                />
            </div>
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
