
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Search, ChevronRight, PlusCircle } from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
} from '@/firebase';
import { collection } from 'firebase/firestore';

import type { Customer } from '@/lib/types';

import { Card, CardContent } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientsPage() {
  const [isAddClientOpen, setAddClientOpen] = useState(false);
  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();

  const customersQuery = useMemoFirebase(
    () => collection(firestore, 'barberShops', shopId, 'customers'),
    [firestore, shopId]
  );
  const { data: clients, isLoading } = useCollection<Customer>(customersQuery);

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
              Clientes
            </h1>
            <p className="text-muted-foreground">
              Visualize, gerencie e adicione novos clientes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar clientes..." className="pl-8 w-full" />
            </div>
            <Dialog open={isAddClientOpen} onOpenChange={setAddClientOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
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

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Telefone
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Ver</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-5 w-48" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))}
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
                      <Button variant="ghost" size="icon" asChild>
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
                 {!isLoading && clients?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            Nenhum cliente encontrado. Adicione o primeiro!
                        </TableCell>
                    </TableRow>
                 )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
