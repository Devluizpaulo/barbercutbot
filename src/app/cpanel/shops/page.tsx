
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, PlusCircle, Search, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import type { BarberShop } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddShopForm } from './add-shop-form';

export default function AdminShopsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const shopsQuery = useMemoFirebase(() => user ? collection(firestore, 'barberShops') : null, [firestore, user]);
    const { data: shops, isLoading } = useCollection<BarberShop>(shopsQuery);
    
    const [isFormOpen, setFormOpen] = useState(false);
    const [selectedShop, setSelectedShop] = useState<BarberShop | undefined>(undefined);

    const handleEdit = (shop: BarberShop) => {
        setSelectedShop(shop);
        setFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedShop(undefined);
        setFormOpen(true);
    };
    
    const handleFormSuccess = () => {
        setFormOpen(false);
        setSelectedShop(undefined);
    };


  return (
    <>
    <div className="flex flex-1 flex-col gap-8">
       <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <Store />
            Gerenciamento de Lojas
        </h1>
        <p className="text-muted-foreground">
          Visualize, adicione e gerencie todas as barbearias da plataforma.
        </p>
      </div>

        <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 md:grow-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar loja..." className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]" />
            </div>
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedShop(undefined); setFormOpen(isOpen); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Loja
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>{selectedShop ? 'Editar Loja' : 'Adicionar Nova Loja'}</DialogTitle>
                </DialogHeader>
                <AddShopForm
                  initialData={selectedShop}
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
                        <TableHead>Barbearia</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Proprietário</TableHead>
                        <TableHead><span className="sr-only">Ações</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && Array.from({length: 5}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell>
                        </TableRow>
                    ))}
                    {shops?.map(shop => {
                         return (
                            <TableRow key={shop.id}>
                                <TableCell>
                                    <div className="font-medium">{shop.name}</div>
                                    <div className="text-sm text-muted-foreground">{shop.address}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge 
                                        variant={shop.status === 'active' ? 'default' : 'destructive'}
                                        className={cn(shop.status === 'active' && 'bg-green-500 hover:bg-green-500/80')}
                                    >
                                        {shop.status === 'active' ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{shop.ownerId}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(shop)}>Editar</DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-500">Suspender</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                         )
                    })}
                    {!isLoading && shops?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">Nenhuma loja encontrada.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
    </>
  )
}
