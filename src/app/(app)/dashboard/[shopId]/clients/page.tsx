
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Search,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';

import { clients as mockedClients } from '@/lib/data';
import type { Client } from '@/lib/data';

import {
  Card,
  CardContent,
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
  const params = useParams();
  const shopId = params.shopId as string;

  const clients = mockedClients;
  const isLoading = false; // Simulation: no loading state
  const error = null; // Simulation: no error state

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
        
          <Card>
            <CardContent className="pt-6">
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
                  {clients?.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/${shopId}/clients/client-${client.id}`}
                          className="hover:underline"
                        >
                          {client.name}
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
                            href={`/dashboard/${shopId}/clients/client-${client.id}`}
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
      </div>
    </>
  );
}
