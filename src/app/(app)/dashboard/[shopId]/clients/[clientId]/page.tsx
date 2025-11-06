
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  DollarSign,
  Calendar as CalendarIcon,
  AlertCircle,
  LoaderCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { Customer, Appointment, Service, Barber } from '@/lib/types';

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
import {
  useCollection,
  useDoc,
  useFirestore,
  useMemoFirebase,
  useUser
} from '@/firebase';
import { collection, doc, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddClientForm } from '../add-client-form';

export default function ClientDetailsPage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const clientId = params.clientId as string;
  const firestore = useFirestore();
  const [isFormOpen, setFormOpen] = useState(false);
  const { user } = useUser();


  const clientRef = useMemoFirebase(
    () => (user && shopId && clientId) ? doc(firestore, 'barberShops', shopId, 'customers', clientId) : null,
    [firestore, shopId, clientId, user]
  );
  const { data: client, isLoading: isClientLoading } = useDoc<Customer>(clientRef);

  const appointmentsQuery = useMemoFirebase(
    () =>
      user && client && shopId
        ? query(
            collection(firestore, 'barberShops', shopId, 'appointments'),
            where('customerId', '==', client.id),
            // Ensure the query is scoped by shopId to satisfy security rules
            where('barberShopId', '==', shopId), 
            orderBy('startTime', 'desc')
          )
        : null,
    [firestore, shopId, client, user]
  );
  const { data: clientAppointments, isLoading: areAppointmentsLoading } =
    useCollection<Appointment>(appointmentsQuery);

  // Fetch services and barbers to map names
  const servicesQuery = useMemoFirebase(() => (user && shopId) ? query(collection(firestore, 'barberShops', shopId, 'services'), where('barberShopId', '==', shopId)) : null, [firestore, shopId, user]);
  const { data: services } = useCollection<Service>(servicesQuery);
  const barbersQuery = useMemoFirebase(() => (user && shopId) ? query(collection(firestore, 'barberShops', shopId, 'barbers'), where('barberShopId', '==', shopId)) : null, [firestore, shopId, user]);
  const { data: barbers } = useCollection<Barber>(barbersQuery);

  const getServiceName = (serviceId: string) => {
    return services?.find(s => s.id === serviceId)?.name || serviceId;
  }
  const getBarberName = (barberId: string) => {
    const barber = barbers?.find(b => b.id === barberId);
    return barber ? `${barber.firstName} ${barber.lastName}` : barberId;
  }


  const totalSpent = clientAppointments
    ?.filter(appt => appt.status === 'completed')
    .reduce((acc, appt) => acc + (appt.totalPrice || 0), 0);
  
  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  const lastVisit = clientAppointments?.[0]?.startTime ? format(toDate(clientAppointments[0].startTime), 'dd/MM/yyyy', { locale: ptBR }) : "N/A";

  if (isClientLoading) {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">
            Cliente não encontrado
        </h2>
        <p className="text-muted-foreground mb-4">
            O cliente que você está procurando não existe.
        </p>
        <Button asChild>
          <Link href={`/dashboard/${shopId}/clients`}>
            <ArrowLeft className="mr-2 h-4 w-4"/>
            Voltar para clientes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild className="shrink-0">
            <Link href={`/dashboard/${shopId}/clients`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar</span>
            </Link>
            </Button>
            <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
                {client.firstName} {client.lastName}
            </h1>
            <p className="text-muted-foreground">Perfil e Histórico do Cliente</p>
            </div>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Cliente
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.email ? (
                <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <a href={`mailto:${client.email}`} className="text-muted-foreground truncate hover:underline">{client.email}</a>
                </div>
            ) : null}
            {client.phone ? (
                <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <a href={`tel:${client.phone}`} className="text-muted-foreground hover:underline">{client.phone}</a>
                </div>
            ) : null}
             {!client.email && !client.phone && (
                <p className="text-sm text-muted-foreground">Nenhuma informação de contato disponível.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-bold">R${(totalSpent || 0).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Gasto</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-bold">{lastVisit}</p>
                <p className="text-xs text-muted-foreground">Última Visita</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">
            Histórico de Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data e Hora</TableHead>
                <TableHead className="hidden sm:table-cell">Serviço(s)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areAppointmentsLoading && <TableRow><TableCell colSpan={3}><LoaderCircle className="mx-auto animate-spin" /></TableCell></TableRow>}
              {clientAppointments?.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div className="font-medium">
                      {format(toDate(appointment.startTime), "dd/MM/yy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                     <div className="text-sm text-muted-foreground sm:hidden">
                       {appointment.items.map(item => getServiceName(item.serviceId)).join(', ')}
                     </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{appointment.items.map(item => getServiceName(item.serviceId)).join(', ')}</TableCell>
                  <TableCell>
                    <Badge
                      variant={appointment.status === 'completed' ? 'secondary' : appointment.status === 'cancelled' ? 'destructive' : 'default'}
                    >
                      {appointment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!areAppointmentsLoading && clientAppointments?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhum agendamento encontrado para este cliente.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
     <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <AddClientForm
            shopId={shopId}
            initialData={client}
            onSuccess={() => setFormOpen(false)}
        />
        </DialogContent>
      </Dialog>
    </>
  );
}
