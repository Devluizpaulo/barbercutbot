
'use client';

import { useState } from 'react';
import {
  PlusCircle,
} from 'lucide-react';
import { useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';

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

export default function AppointmentsPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);

  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();
  const { user } = useUser();

  const appointmentsQuery = useMemoFirebase(
    () => user ? collection(firestore, 'barberShops', shopId, 'appointments') : null,
    [firestore, shopId, user]
  );
  const { data: appointments, isLoading: areAppointmentsLoading } = useCollection<Appointment>(appointmentsQuery);

  const customersQuery = useMemoFirebase(() => user ? collection(firestore, 'barberShops', shopId, 'customers') : null, [firestore, shopId, user]);
  const { data: customers, isLoading: areCustomersLoading } = useCollection<Customer>(customersQuery);

  const barbersQuery = useMemoFirebase(() => user ? collection(firestore, 'barberShops', shopId, 'barbers') : null, [firestore, shopId, user]);
  const { data: barbers, isLoading: areBarbersLoading } = useCollection<Barber>(barbersQuery);

  const servicesQuery = useMemoFirebase(() => user ? collection(firestore, 'barberShops', shopId, 'services') : null, [firestore, shopId, user]);
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

  return (
    <>
      <div className="flex h-full flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
              Agenda
            </h1>
            <p className="text-muted-foreground">
              Visualize e gerencie os agendamentos do seu time.
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

        <div className="flex-1 overflow-auto -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 md:-mx-8 md:-mb-8">
            <CalendarView 
                appointments={appointments || []}
                barbers={barbers || []}
                customers={customers || []}
                services={services || []}
                isLoading={isLoading}
            />
        </div>
      </div>
    </>
  );
}

