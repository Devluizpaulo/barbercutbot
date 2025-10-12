
'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PlusCircle, MoreVertical, Trash2, Edit, User, Search, Eye, EyeOff } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { AddBarberForm } from './add-barber-form';
import type { Barber } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function BarbersPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | undefined>(undefined);
  const [barberToDelete, setBarberToDelete] = useState<Barber | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();

  const barbersQuery = useMemoFirebase(
    () => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'barbers') : null,
    [firestore, shopId, user]
  );
  const { data: barbers, isLoading } = useCollection<Barber>(barbersQuery);

  const filteredBarbers = useMemo(() => {
    if (!barbers) return [];
    if (!searchTerm) return barbers;
    const lowercasedTerm = searchTerm.toLowerCase();
    return barbers.filter(barber =>
      barber.firstName.toLowerCase().includes(lowercasedTerm) ||
      barber.lastName.toLowerCase().includes(lowercasedTerm) ||
      (barber.email && barber.email.toLowerCase().includes(lowercasedTerm))
    );
  }, [barbers, searchTerm]);

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

  const handleDelete = () => {
    if (!barberToDelete) return;
    const barberRef = doc(firestore, 'barberShops', shopId, 'barbers', barberToDelete.id);
    deleteDocumentNonBlocking(barberRef);
    toast({
      title: 'Profissional Removido',
      description: `O profissional "${barberToDelete.firstName}" foi removido.`,
    });
    setBarberToDelete(null);
  };
  
  const handleToggleStatus = (barber: Barber) => {
    // const newStatus = !(barber.ativo === undefined ? true : barber.ativo);
    // const barberRef = doc(firestore, 'barberShops', shopId, 'barbers', barber.id);
    // setDocumentNonBlocking(barberRef, { ativo: newStatus }, { merge: true });
    // toast({
    //   title: `Profissional ${newStatus ? 'Ativado' : 'Inativado'}`,
    //   description: `O profissional "${barber.name}" agora está ${newStatus ? 'ativo' : 'inativo'}.`,
    // });
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
              <User />
              Profissionais
            </h1>
            <p className="text-muted-foreground">
              Gerencie os barbeiros e outros profissionais do seu negócio.
            </p>
          </div>
          <div className="flex items-center gap-2">
              <div className="relative flex-1 md:grow-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar profissional..."
                  className="pl-8 w-full md:w-[200px] lg:w-[320px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedBarber(undefined); setFormOpen(isOpen); }}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Profissional
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>{selectedBarber ? 'Editar Profissional' : 'Adicionar Novo Profissional'}</DialogTitle>
                    <DialogDescription>
                      Preencha os detalhes do profissional.
                    </DialogDescription>
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
                {isLoading && Array.from({length: 3}).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-10 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-8" /></TableCell>
                  </TableRow>
                ))}
                {filteredBarbers?.map((barber) => (
                  <TableRow key={barber.id}>
                    <TableCell className="font-medium">
                       <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={barber.avatar} alt={barber.firstName} />
                          <AvatarFallback>{barber.firstName?.charAt(0)}{barber.lastName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          {barber.firstName} {barber.lastName}
                          <div className="text-sm text-muted-foreground md:hidden">{barber.email || barber.phone}</div>
                        </div>
                       </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>{barber.email || ''}</div>
                      <div className="text-sm text-muted-foreground">{barber.phone || ''}</div>
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
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setBarberToDelete(barber)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && filteredBarbers?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {searchTerm ? `Nenhum profissional encontrado para "${searchTerm}"` : "Nenhum profissional encontrado."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AlertDialog
        open={!!barberToDelete}
        onOpenChange={(isOpen) => !isOpen && setBarberToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá remover o profissional{' '}
              <strong>{barberToDelete?.firstName}</strong> permanentemente.
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
