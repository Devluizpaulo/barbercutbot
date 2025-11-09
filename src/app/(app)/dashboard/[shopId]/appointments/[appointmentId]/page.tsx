
'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  DollarSign,
  AlertCircle,
  Edit,
  CalendarPlus,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Appointment, Customer, Barber, Service } from '@/lib/types';
import { useDoc, useFirestore, useMemoFirebase, useUser, setDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, Timestamp, updateDoc, collection, query, where } from 'firebase/firestore';
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
import { useState, useEffect } from 'react';

export default function AppointmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const shopId = params.shopId as string;
  const appointmentId = params.appointmentId as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const [isCancelAlertOpen, setCancelAlertOpen] = useState(false);

  const appointmentRef = useMemoFirebase(() => (user && shopId && appointmentId) ? doc(firestore, 'barberShops', shopId, 'appointments', appointmentId) : null, [firestore, shopId, appointmentId, user]);
  const { data: appointment, isLoading, error } = useDoc<Appointment>(appointmentRef);

  const customerRef = useMemoFirebase(() => (user && shopId && appointment) ? doc(firestore, 'barberShops', shopId, 'customers', appointment.customerId) : null, [firestore, shopId, appointment, user]);
  const { data: customer } = useDoc<Customer>(customerRef);
  
  const servicesQuery = useMemoFirebase(() => user && shopId ? query(collection(firestore, 'barberShops', shopId, 'services'), where('barberShopId', '==', shopId)) : null, [firestore, shopId, user]);
  const { data: allServices } = useCollection<Service>(servicesQuery);

  const barbersQuery = useMemoFirebase(() => user && shopId ? query(collection(firestore, 'barberShops', shopId, 'barbers'), where('barberShopId', '==', shopId)) : null, [firestore, shopId, user]);
  const { data: allBarbers } = useCollection<Barber>(barbersQuery);
  
  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  const handleUpdateStatus = async (newStatus: Appointment['status']) => {
    if (!appointment) return;
    try {
      const appointmentDocRef = doc(firestore, 'barberShops', shopId, 'appointments', appointment.id);
      await updateDoc(appointmentDocRef, { status: newStatus });
      toast({ title: "Status Atualizado!", description: `O agendamento foi marcado como ${newStatus}.` });
    } catch (err) {
      console.error("Failed to update status", err);
      toast({ variant: 'destructive', title: "Erro", description: "Não foi possível atualizar o status." });
    }
  };

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
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'confirmed': return 'default';
      default: return 'outline';
    }
  };
  
  const getStatusLabel = (status: Appointment['status']) => {
      switch (status) {
        case 'completed': return 'Concluído';
        case 'cancelled': return 'Cancelado';
        case 'confirmed': return 'Confirmado';
        case 'pending': return 'Pendente';
        default: return 'Desconhecido';
      }
  }

  const startTime = toDate(appointment.startTime);

  return (
    <>
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
          <CardContent className="space-y-3">
            <div className="text-lg font-semibold">
              {customer ? `${customer.firstName} ${customer.lastName}` : <Skeleton className="h-6 w-3/4" />}
            </div>
            {customer?.email && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4" />{customer.email}</div>}
            {customer?.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" />{customer.phone}</div>}
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                Total
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">R$ {appointment.totalPrice?.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-muted-foreground">{appointment.totalDuration || '0'} min</p>
            </CardContent>
        </Card>
      </div>
      
       <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-muted-foreground" />
              Serviços Realizados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {appointment.items.map((item, index) => {
                const service = allServices?.find(s => s.id === item.serviceId);
                const barber = allBarbers?.find(b => b.id === item.barberId);
                return (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <div>
                            <p className="font-semibold">{service?.name || <Skeleton className="h-5 w-24" />}</p>
                            <p className="text-sm text-muted-foreground">com {barber ? `${barber.firstName} ${barber.lastName}` : <Skeleton className="h-4 w-20" />}</p>
                        </div>
                        <div className="text-right">
                           <p className="font-semibold">R$ {item.price.toFixed(2)}</p>
                           <p className="text-sm text-muted-foreground">{item.duration} min</p>
                        </div>
                    </div>
                )
             })}
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline"><Edit className="mr-2" />Editar</Button>
                <Button variant="outline"><CalendarPlus className="mr-2" />Reagendar</Button>
                <Button variant="default" onClick={() => handleUpdateStatus('confirmed')}><CheckCircle className="mr-2" />Confirmar</Button>
                <Button variant="destructive" onClick={() => setCancelAlertOpen(true)}><XCircle className="mr-2" />Cancelar</Button>
            </CardContent>
        </Card>
    </div>
     <AlertDialog open={isCancelAlertOpen} onOpenChange={setCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleUpdateStatus('cancelled');
                setCancelAlertOpen(false);
              }}
              className="bg-destructive hover:bg-destructive/80"
            >
              Sim, Cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
