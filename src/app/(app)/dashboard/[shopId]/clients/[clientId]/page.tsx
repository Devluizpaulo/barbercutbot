
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
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { clients, appointments as allAppointments } from '@/lib/data';
import type { Client, Appointment } from '@/lib/data';

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

export default function ClientDetailsPage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const clientId = params.clientId as string;

  // Simulate fetching data
  const client = clients.find(c => `client-${c.id}` === clientId);
  const clientAppointments = allAppointments.filter(a => a.clientName.includes(client?.name.split(' ')[0] ?? ''));

  const totalSpent = clientAppointments.reduce((acc, appt) => {
    // Placeholder price for mock data
    return acc + 50; 
  }, 0);

  const lastVisit = client?.lastVisit || "N/A";


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
                {client.name}
            </h1>
            <p className="text-muted-foreground">Perfil e Histórico do Cliente</p>
            </div>
        </div>
        <Button className="w-full sm:w-auto">
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
                <TableHead className="hidden sm:table-cell">Serviço</TableHead>
                <TableHead className="hidden md:table-cell">Barbeiro</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div className="font-medium">
                      {format(new Date(appointment.dateTime), "dd/MM/yy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                     <div className="text-sm text-muted-foreground sm:hidden">
                       {appointment.service}
                     </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{appointment.service}</TableCell>
                  <TableCell className="hidden md:table-cell">{appointment.barber}</TableCell>
                  <TableCell>
                    <Badge
                      variant={appointment.status === 'Concluído' ? 'secondary' : appointment.status === 'Cancelado' ? 'destructive' : 'default'}
                    >
                      {appointment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {clientAppointments.length === 0 && (
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
  );
}
