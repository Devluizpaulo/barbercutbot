
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  DollarSign,
  PenSquare,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { doc, Timestamp } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { Appointment, Customer, Barber, Service } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppointmentDetailsPage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const appointmentId = params.appointmentId as string;
  const firestore = useFirestore();

  // Create document reference
  const appointmentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'barberShops', shopId, 'appointments', appointmentId) : null),
    [firestore, shopId, appointmentId]
  );
  const { data: appointment, isLoading, error } = useDoc<Appointment>(appointmentRef);

  // Fetch related data based on IDs from the appointment
  const customerRef = useMemoFirebase(
    () => (firestore && appointment ? doc(firestore, 'barberShops', shopId, 'customers', appointment.customerId) : null),
    [firestore, shopId, appointment]
  );
  const { data: customer } = useDoc<Customer>(customerRef);

  const barberRef = useMemoFirebase(
    () => (firestore && appointment ? doc(firestore, 'barberShops', shopId, 'barbers', appointment.barberId) : null),
    [firestore, shopId, appointment]
  );
  const { data: barber } = useDoc<Barber>(barberRef);
  
  const serviceRef = useMemoFirebase(
    () => (firestore && appointment ? doc(firestore, 'barberShops', shopId, 'services', appointment.serviceIds[0]) : null),
    [firestore, shopId, appointment]
  );
  const { data: service } = useDoc<Service>(serviceRef);


  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Agendamento não encontrado</h2>
        <p className="text-muted-foreground mb-4">
          {error ? error.message : 'O agendamento que você está procurando não existe.'}
        </p>
        <Button asChild>
          <Link href={`/dashboard/${shopId}/appointments`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para agendamentos
          </Link>
        </Button>
      </div>
    );
  }

  const getStatusVariant = (status: Appointment['status']) => {
    switch (status) {
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'confirmed': return 'default';
      default: return 'outline';
    }
  };
  
  const getStatusLabel = (status: Appointment['status']) => {
      const labels: Record<Appointment['status'], string> = {
          pending: "Pendente",
          confirmed: "Confirmado",
          completed: "Concluído",
          cancelled: "Cancelado",
          'no-show': "Não Compareceu"
      };
      return labels[status] || "Desconhecido";
  }

  const startTime = (appointment.startTime as Timestamp).toDate();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="shrink-0">
            <Link href={`/dashboard/${shopId}/appointments`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
              Detalhes do Agendamento
            </h1>
            <p className="text-muted-foreground">
              Agendamento de {customer ? `${customer.firstName} ${customer.lastName}` : '...'}
            </p>
          </div>
        </div>
        <Badge variant={getStatusVariant(appointment.status)} className="w-fit text-base">
          {getStatusLabel(appointment.status)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              Data e Hora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{format(startTime, "PPP", { locale: ptBR })}</p>
            <p className="text-muted-foreground text-lg">{format(startTime, "HH:mm")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {customer ? `${customer.firstName} ${customer.lastName}` : <Skeleton className="h-6 w-3/4" />}
            </p>
            <p className="text-muted-foreground text-sm">{customer?.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              Barbeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {barber ? `${barber.firstName} ${barber.lastName}` : <Skeleton className="h-6 w-3/4" />}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-muted-foreground" />
              Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
                <p className="text-lg font-semibold">{service ? service.name : <Skeleton className="h-6 w-1/2" />}</p>
                <p className="text-muted-foreground">{service?.description}</p>
             </div>
             <div className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground"/>
                    <span>{service ? `${service.duration} min` : <Skeleton className="h-5 w-12" />}</span>
                </div>
                <div className="flex items-center gap-2 font-bold">
                    <DollarSign className="h-5 w-5 text-muted-foreground"/>
                    <span>{appointment.price ? `R$${appointment.price.toFixed(2)}` : <Skeleton className="h-5 w-16" />}</span>
                </div>
             </div>
          </CardContent>
        </Card>

        {appointment.notes && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <PenSquare className="h-5 w-5 text-muted-foreground" />
                    Anotações
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground italic">"{appointment.notes}"</p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
