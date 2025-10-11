
'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PlusCircle, MoreVertical, Trash2, Edit, EyeOff, Eye, Search } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AddServiceForm } from './add-service-form';
import type { Service } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { ImageIcon, Clock } from 'lucide-react';

export default function ServicesPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();

  const servicesQuery = useMemoFirebase(
    () => user ? collection(firestore, 'barberShops', shopId, 'services') : null,
    [firestore, shopId, user]
  );
  const { data: services, isLoading } = useCollection<Service>(servicesQuery);

  const filteredServices = useMemo(() => {
    if (!services) return [];
    if (!searchTerm) return services;
    const lowercasedTerm = searchTerm.toLowerCase();
    return services.filter(service =>
      service.name.toLowerCase().includes(lowercasedTerm)
    );
  }, [services, searchTerm]);

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
  };

  const handleDelete = () => {
    if (!serviceToDelete) return;
    const serviceRef = doc(firestore, 'barberShops', shopId, 'services', serviceToDelete.id);
    deleteDocumentNonBlocking(serviceRef);
    toast({
      title: 'Serviço Removido',
      description: `O serviço "${serviceToDelete.name}" foi removido.`,
    });
    setServiceToDelete(null);
  };
  
  const handleToggleStatus = (service: Service) => {
    const newStatus = !(service.ativo === undefined ? true : service.ativo);
    const serviceRef = doc(firestore, 'barberShops', shopId, 'services', service.id);
    setDocumentNonBlocking(serviceRef, { ativo: newStatus }, { merge: true });
    toast({
      title: `Serviço ${newStatus ? 'Ativado' : 'Inativado'}`,
      description: `O serviço "${service.name}" agora está ${newStatus ? 'ativo' : 'inativo'}.`,
    });
  };

  return (
    <>
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
            Serviços
          </h1>
          <p className="text-muted-foreground">
            Gerencie os serviços oferecidos pelo seu negócio.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviço..."
                className="pl-8 w-full md:w-[200px] lg:w-[320px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Preço</TableHead>
                <TableHead className="hidden sm:table-cell">Duração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({length: 3}).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-8 w-full" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-8 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))}
              {filteredServices?.map((service) => {
                const isAtivo = service.ativo === undefined ? true : service.ativo;
                return (
                <TableRow key={service.id} className={!isAtivo ? 'text-muted-foreground' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="rounded-md">
                        <AvatarImage src={service.imageUrl} alt={service.name} className="object-cover"/>
                        <AvatarFallback className="rounded-md">
                          <ImageIcon />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div>{service.name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px] md:hidden">
                            {service.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <span>R${service.price.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{service.duration} min</span>
                    </div>
                  </TableCell>
                   <TableCell>
                    <Badge variant={isAtivo ? 'default' : 'secondary'} className={isAtivo ? 'bg-green-500 hover:bg-green-500/90' : ''}>
                      {isAtivo ? 'Ativo' : 'Inativo'}
                    </Badge>
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
                        <DropdownMenuItem onClick={() => handleToggleStatus(service)}>
                            {isAtivo ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                            <span>{isAtivo ? 'Inativar' : 'Ativar'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setServiceToDelete(service)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
              {!isLoading && filteredServices?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {searchTerm ? `Nenhum serviço encontrado para "${searchTerm}"` : "Nenhum serviço encontrado."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    <AlertDialog
      open={!!serviceToDelete}
      onOpenChange={(isOpen) => !isOpen && setServiceToDelete(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso irá remover o serviço{' '}
            <strong>{serviceToDelete?.name}</strong> permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90"
          >
            Sim, remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
