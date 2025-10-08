
'use client';

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, Timestamp } from "firebase/firestore";
import type { BarberShop, Ticket } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminTicketsPage() {
    const firestore = useFirestore();
    
    const ticketsQuery = useMemoFirebase(() => query(collection(firestore, 'tickets')), [firestore]);
    const { data: tickets, isLoading: isLoadingTickets } = useCollection<Ticket>(ticketsQuery);

    const shopsQuery = useMemoFirebase(() => collection(firestore, 'barberShops'), [firestore]);
    const { data: shops, isLoading: isLoadingShops } = useCollection<BarberShop>(shopsQuery);

    const findShopName = (shopId: string) => shops?.find(s => s.id === shopId)?.name || 'N/A';
    const isLoading = isLoadingTickets || isLoadingShops;

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
                Tickets de Suporte
                </h1>
                <p className="text-muted-foreground">
                Gerencie todas as solicitações de suporte dos seus parceiros.
                </p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Tabs defaultValue="abertos">
                        <TabsList>
                            <TabsTrigger value="abertos">Abertos</TabsTrigger>
                            <TabsTrigger value="andamento">Em Andamento</TabsTrigger>
                            <TabsTrigger value="fechados">Fechados</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="abertos" className="mt-4">
                            <TicketsTable 
                                tickets={tickets?.filter(t => t.status === 'Aberto')} 
                                findShopName={findShopName} 
                                isLoading={isLoading}
                            />
                        </TabsContent>
                        <TabsContent value="andamento" className="mt-4">
                            <TicketsTable 
                                tickets={tickets?.filter(t => t.status === 'Em Andamento')} 
                                findShopName={findShopName} 
                                isLoading={isLoading}
                            />
                        </TabsContent>
                        <TabsContent value="fechados" className="mt-4">
                             <TicketsTable 
                                tickets={tickets?.filter(t => t.status === 'Fechado')} 
                                findShopName={findShopName} 
                                isLoading={isLoading}
                             />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}


function TicketsTable({ tickets, findShopName, isLoading }: { tickets?: Ticket[], findShopName: (id: string) => string, isLoading: boolean }) {
    
    const getStatusVariant = (status: Ticket['status']) => {
        switch (status) {
            case 'Aberto': return 'destructive';
            case 'Em Andamento': return 'default';
            case 'Fechado': return 'secondary';
        }
    };
    
    const toDate = (timestamp: Timestamp | Date | string): Date => {
        if (timestamp instanceof Timestamp) {
            return timestamp.toDate();
        }
        return new Date(timestamp);
    }
    
    return (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Barbearia</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Última Atualização</TableHead>
                    <TableHead><span className="sr-only">Ações</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading && Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={5}><Skeleton className="h-8 w-full"/></TableCell>
                    </TableRow>
                ))}
                {!isLoading && tickets && tickets.length > 0 ? tickets.map(ticket => (
                    <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{findShopName(ticket.shopId)}</TableCell>
                        <TableCell>
                            <div>{ticket.subject}</div>
                            <div className="text-sm text-muted-foreground md:hidden">
                                {formatDistanceToNow(toDate(ticket.lastUpdatedAt), { addSuffix: true, locale: ptBR })}
                            </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                             <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                            {formatDistanceToNow(toDate(ticket.lastUpdatedAt), { addSuffix: true, locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="outline" size="sm">Responder</Button>
                        </TableCell>
                    </TableRow>
                )) : (
                     !isLoading && <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">Nenhum ticket encontrado nesta categoria.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}
