
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { PlusCircle, Search, Mail, Phone, MoreVertical, Edit, Trash2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddBarberForm } from './add-barber-form';
import { barbers as mockedBarbers } from '@/lib/data';
import type { Barber } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function BarbersPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | undefined>(undefined);
  const params = useParams();
  const shopId = params.shopId as string;

  // Replace with actual data fetching
  const barbers = mockedBarbers;

  const handleEdit = (barber: Barber) => {
    setSelectedBarber(barber);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedBarber(undefined);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setSelectedBarber(undefined);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
            Barbeiros
          </h1>
          <p className="text-muted-foreground">
            Gerencie os profissionais da sua barbearia.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative flex-1 md:grow-0">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input placeholder="Buscar barbeiro..." className="pl-8 w-full md:w-[200px] lg:w-[320px]" />
           </div>
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedBarber(undefined); setFormOpen(isOpen); }}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Barbeiro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{selectedBarber ? 'Editar Barbeiro' : 'Adicionar Novo Barbeiro'}</DialogTitle>
                <p className="text-sm text-muted-foreground pt-1">
                  Preencha os detalhes do novo profissional.
                </p>
              </DialogHeader>
              <AddBarberForm
                shopId={shopId}
                initialData={selectedBarber}
                onSuccess={handleFormSuccess}
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
                <TableHead className="hidden md:table-cell">Contato</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {barbers.map((barber) => (
                <TableRow key={barber.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={barber.avatar} alt={`${barber.firstName} ${barber.lastName}`} />
                        <AvatarFallback>{barber.firstName.charAt(0)}{barber.lastName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{`${barber.firstName} ${barber.lastName}`}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Mail className="h-4 w-4" />
                      <span>{barber.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Phone className="h-4 w-4" />
                      <span>{barber.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(barber)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {barbers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhum barbeiro encontrado.
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
