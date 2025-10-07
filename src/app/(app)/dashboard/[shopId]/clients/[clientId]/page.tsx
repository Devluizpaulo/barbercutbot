'use client';

import Link from 'next/link';
import { doc, collection, query, where } from 'firebase/firestore';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  DollarSign,
  Calendar as CalendarIcon,
  LoaderCircle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Customer, Appointment } from '@/lib/types';

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

export default function ClientDetailsPage({
  params,
}: {
  params: { shopId: string; clientId: string };
}) {
  const firestore = useFirestore();

  const clientRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, `/barberShops/${params.shopId}/customers/${params.clientId}`);
  }, [firestore, params.shopId, params.clientId]);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, `/barberShops/${params.shopId}/appointments`),
      where('customerId', '==', params.clientId)
    );
  }, [firestore, params.shopId, params.clientId]);

  const { data: client, isLoading: isClientLoading, error: clientError } = useDoc<Customer>(clientRef);
  const { data: appointments, isLoading: areAppointmentsLoading } = useCollection<Appointment>(appointmentsQuery);

  const clientAppointments = appointments || [];

  const totalSpent = clientAppointments.reduce((acc, appt) => {
    // Assuming you'll add price to appointments later
    return acc + 50; // Placeholder value
  }, 0);

  const lastVisit = clientAppointments.length > 0 
    ? format(new Date(Math.max(...clientAppointments.map(a => a.startTime.getTime()))), "dd/MM/yyyy", { locale: ptBR })
    : "N/A";


  if (isClientLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (clientError || !client) {
    return (
      <div className="text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-4" />
        <p className="text-lg mb-2">
            {clientError ? "Ocorreu um erro ao carregar o cliente." : "Cliente não encontrado."}
        </p>
        <Button asChild variant="link">
          <Link href={`/dashboard/${params.shopId}/clients`}>
            Voltar para clientes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/${params.shopId}/clients`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {client.firstName} {client.lastName}
          </h1>
          <p className="text-muted-foreground">Perfil e Histórico do Cliente</p>
        </div>
        <Button className="ml-auto">
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
            {client.email && (
                <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">{client.email}</span>
                </div>
            )}
            {client.phone && (
                <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">{client.phone}</span>
                </div>
            )}
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
                <p className="font-bold">R${totalSpent.toFixed(2)}</p>
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
                <TableHead>Serviço</TableHead>
                <TableHead>Barbeiro</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areAppointmentsLoading && (
                 <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              )}
              {clientAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    {format(appointment.startTime, "MMM d, yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>{appointment.serviceIds.join(', ')}</TableCell>
                  <TableCell>{appointment.barberId}</TableCell>
                  <TableCell>
                    <Badge
                      variant={'default'}
                    >
                      Confirmado
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!areAppointmentsLoading && clientAppointments.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
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
  );
}
