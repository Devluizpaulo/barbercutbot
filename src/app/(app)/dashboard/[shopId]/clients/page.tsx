
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { collection, query, where } from 'firebase/firestore';
import {
  Search,
  UserPlus,
  ChevronRight,
  LoaderCircle,
  AlertCircle,
} from 'lucide-react';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Customer } from '@/lib/types';

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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddClientForm } from './add-client-form';

export default function ClientsPage() {
  const [isAddClientOpen, setAddClientOpen] = useState(false);
  const firestore = useFirestore();
  const params = useParams();
  const shopId = params.shopId as string;

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || !shopId) return null;
    return query(
      collection(firestore, `/barberShops/${shopId}/customers`),
      where('barberShopId', '==', shopId)
    );
  }, [firestore, shopId]);

  const {
    data: clients,
    isLoading,
    error,
  } = useCollection<Customer>(clientsQuery);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="font-headline text-2xl">
                Gerenciamento de Clientes
              </CardTitle>
              <CardDescription>
                Visualize, gerencie e adicione novos clientes.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar clientes..." className="pl-8 w-full" />
              </div>
              <Dialog open={isAddClientOpen} onOpenChange={setAddClientOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Adicionar Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                  </DialogHeader>
                  <AddClientForm
                    shopId={shopId}
                    onSuccess={() => setAddClientOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                <TableHead>
                  <span className="sr-only">Ver</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              )}
              {error && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-destructive"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      <span>
                        Ocorreu um erro ao carregar os clientes. Tente novamente.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !error && clients?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhum cliente encontrado. Comece adicionando um novo cliente.
                  </TableCell>
                </TableRow>
              )}
              {clients?.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/${shopId}/clients/${client.id}`}
                      className="hover:underline"
                    >
                      {client.firstName} {client.lastName}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {client.email || '-'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {client.phone || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="icon" asChild>
                      <Link
                        href={`/dashboard/${shopId}/clients/${client.id}`}
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Ver Cliente</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
