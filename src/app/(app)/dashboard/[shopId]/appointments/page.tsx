
'use client';

import { useState } from 'react';
import {
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Store,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
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
import { collection, Timestamp } from 'firebase/firestore';
import type { Appointment, Customer, Barber, Service } from '@/lib/types';
import { CalendarView } from './calendar-view';
import { CashierDialog } from '../cashier-dialog';

export default function AppointmentsPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [isCashierOpen, setIsCashierOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBarberId, setSelectedBarberId] = useState<string | 'all'>('all');

  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();
  const { user } = useUser();

  const appointmentsQuery = useMemoFirebase(
    () => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'appointments') : null,
    [firestore, shopId, user]
  );
  const { data: appointments, isLoading: areAppointmentsLoading } = useCollection<Appointment>(appointmentsQuery);

  const customersQuery = useMemoFirebase(() => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'customers') : null, [firestore, shopId, user]);
  const { data: customers, isLoading: areCustomersLoading } = useCollection<Customer>(customersQuery);

  const barbersQuery = useMemoFirebase(() => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'barbers') : null, [firestore, shopId, user]);
  const { data: barbers, isLoading: areBarbersLoading } = useCollection<Barber>(barbersQuery);

  const servicesQuery = useMemoFirebase(() => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'services') : null, [firestore, shopId, user]);
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
    setSelectedDate(prev => new Date(prev.setDate(prev.getDate() + amount)));
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
            />
        </div>
      </div>
      <CashierDialog 
        open={isCashierOpen} 
        onOpenChange={setIsCashierOpen} 
        shopId={shopId} 
       />
      <Button
          onClick={() => setIsCashierOpen(true)}
          className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg"
          size="icon"
      >
          <Store className="h-8 w-8" />
          <span className="sr-only">Abrir Caixa</span>
      </Button>
    </>
  );
}
