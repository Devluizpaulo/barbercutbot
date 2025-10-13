
'use client';

import { useState, useMemo } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { MoreVertical, Ticket, Search, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import type { Ticket as TicketType } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CPanelTicketsPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const ticketsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'tickets'), orderBy('lastUpdatedAt', 'desc'));
  }, [firestore]);

  const { data: tickets, isLoading } = useCollection<TicketType>(ticketsQuery);

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    if (!searchTerm) return tickets;
    const lowercasedTerm = searchTerm.toLowerCase();
    return tickets.filter(ticket => 
      ticket.subject.toLowerCase().includes(lowercasedTerm) ||
      ticket.shopId.toLowerCase().includes(lowercasedTerm) ||
      ticket.userId.toLowerCase().includes(lowercasedTerm)
    );
  }, [tickets, searchTerm]);

  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  const getStatusVariant = (status: TicketType['status']) => {
    switch (status) {
        case 'Aberto': return 'destructive';
        case 'Em Andamento': return 'default';
        case 'Fechado': return 'secondary';
        default: return 'outline';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <Ticket />
            Tickets de Suporte
          </h1>
          <p className="text-muted-foreground">
            Gerencie e responda às solicitações de suporte dos seus clientes.
          </p>
        </div>
        <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por assunto, loja ou usuário..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>
      
      <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assunto</TableHead>
                <TableHead className="hidden md:table-cell">Loja ID</TableHead>
                <TableHead className="hidden sm:table-cell">Última Atualização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading && Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                ))}
                {filteredTickets?.map((ticket) => (
                    <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.subject}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-xs">{ticket.shopId}</TableCell>
                        <TableCell className="hidden sm:table-cell">{format(toDate(ticket.lastUpdatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem>
                                        <MessageSquare className="mr-2 h-4 w-4"/>
                                        Responder
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <CheckCircle className="mr-2 h-4 w-4"/>
                                        Marcar como Resolvido
                                    </DropdownMenuItem>
                                     <DropdownMenuItem className="text-red-500">
                                        <XCircle className="mr-2 h-4 w-4"/>
                                        Fechar Ticket
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
                {!isLoading && filteredTickets?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">Nenhum ticket encontrado.</TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
      </div>
    </div>
  );
}
