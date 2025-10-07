
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
import { appointments, clients, barbers, services } from '@/lib/data';
import type { Appointment, Client, Barber, Service } from '@/lib/data';

export default function AppointmentDetailsPage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const appointmentId = params.appointmentId as string;

  // Simulate fetching data
  const appointment = appointments.find(a => a.id === appointmentId);
  const customer = clients.find(c => appointment?.clientName.includes(c.name.split(' ')[0]));
  const barber = barbers.find(b => appointment?.barber.includes(b.firstName));
  const service = services.find(s => s.name === appointment?.service);

  const isLoading = false;
  const error = null;

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
          {error ? 'Ocorreu um erro' : 'O agendamento que você está procurando não existe.'}
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
      case 'Concluído': return 'secondary';
      case 'Cancelado': return 'destructive';
      case 'Confirmado': return 'default';
      default: return 'outline';
    }
  };

  const startTime = appointment.dateTime;

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
              Agendamento de {customer ? `${customer.name}` : '...'}
            </p>
          </div>
        </div>
        <Badge variant={getStatusVariant(appointment.status)} className="w-fit text-base">
          {appointment.status}
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
            <div className="text-lg font-semibold">
              {customer ? `${customer.name}` : <Skeleton className="h-6 w-3/4" />}
            </div>
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
            <div className="text-lg font-semibold">
              {barber ? `${barber.firstName} ${barber.lastName}` : <Skeleton className="h-6 w-3/4" />}
            </div>
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
                <div className="text-lg font-semibold">{service ? service.name : <Skeleton className="h-6 w-1/2" />}</div>
                <p className="text-muted-foreground">{service?.description}</p>
             </div>
             <div className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground"/>
                    <span>{service ? `${service.duration} min` : <Skeleton className="h-5 w-12" />}</span>
                </div>
                <div className="flex items-center gap-2 font-bold">
                    <DollarSign className="h-5 w-5 text-muted-foreground"/>
                    <span>{service ? `R$${service.price.toFixed(2)}` : <Skeleton className="h-5 w-16" />}</span>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
