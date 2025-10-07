
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { PlusCircle, MoreVertical, Trash2, Edit, Phone, User } from 'lucide-react';
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
import { AddSupplierForm } from './add-supplier-form';
import { suppliers as mockedSuppliers } from '@/lib/data';
import type { Supplier } from '@/lib/data';

export default function SuppliersPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>(undefined);
  const params = useParams();
  const shopId = params.shopId as string;

  const suppliers = mockedSuppliers;

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedSupplier(undefined);
    setFormOpen(true);
  };
  
  const handleFormSuccess = () => {
    setFormOpen(false);
    setSelectedSupplier(undefined);
    // Here you would typically refetch the data
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
            Fornecedores
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus contatos e anotações de fornecedores.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedSupplier(undefined); setFormOpen(isOpen); }}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{selectedSupplier ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}</DialogTitle>
              <p className="text-sm text-muted-foreground pt-1">
                Preencha os detalhes do contato.
              </p>
            </DialogHeader>
            <AddSupplierForm
              shopId={shopId}
              initialData={selectedSupplier}
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
                <TableHead>Fornecedor</TableHead>
                <TableHead className="hidden md:table-cell">Contato</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    {supplier.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {supplier.contactPerson && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{supplier.contactPerson}</span>
                        </div>
                    )}
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{supplier.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{supplier.category}</Badge>
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
                        <DropdownMenuItem onClick={() => handleEdit(supplier)}>
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
              {suppliers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhum fornecedor encontrado.
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
