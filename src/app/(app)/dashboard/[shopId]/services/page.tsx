
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { PlusCircle, MoreVertical, Trash2, Edit, DollarSign, Clock } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddServiceForm } from './add-service-form';
import { services as mockedServices } from '@/lib/data';
import type { Service } from '@/lib/data';

export default function ServicesPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);
  const params = useParams();
  const shopId = params.shopId as string;

  const services = mockedServices;

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedService(undefined);
    setFormOpen(true);
  };
  
  const handleFormSuccess = () => {
    setFormOpen(false);
    setSelectedService(undefined);
    // Here you would typically refetch the data
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
            Serviços
          </h1>
          <p className="text-muted-foreground">
            Gerencie os serviços oferecidos pela sua barbearia.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedService(undefined); setFormOpen(isOpen); }}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{selectedService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</DialogTitle>
              <p className="text-sm text-muted-foreground pt-1">
                Preencha os detalhes do serviço.
              </p>
            </DialogHeader>
            <AddServiceForm
              shopId={shopId}
              initialData={selectedService}
              onSuccess={handleFormSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Preço</TableHead>
                <TableHead className="hidden sm:table-cell">Duração</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">
                    <div>{service.name}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-[200px] md:hidden">
                        {service.description}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>R${service.price.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{service.duration} min</span>
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
                        <DropdownMenuItem onClick={() => handleEdit(service)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {services.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhum serviço encontrado.
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
