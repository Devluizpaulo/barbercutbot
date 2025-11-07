
'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PlusCircle, MoreVertical, Trash2, Edit, Search, Package, EyeOff, Eye } from 'lucide-react';
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
  DialogDescription,
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
import { AddProductForm } from './add-product-form';
import type { Product } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();

  const productsQuery = useMemoFirebase(
    () => (user && shopId) ? query(
        collection(firestore, 'barberShops', shopId, 'products'),
        where('barberShopId', '==', shopId) // Regra de segurança
    ) : null,
    [firestore, shopId, user]
  );
  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchTerm) return products;
    const lowercasedTerm = searchTerm.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(lowercasedTerm) ||
      (product.sku && product.sku.toLowerCase().includes(lowercasedTerm))
    );
  }, [products, searchTerm]);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedProduct(undefined);
    setFormOpen(true);
  };
  
  const handleFormSuccess = () => {
    setFormOpen(false);
    setSelectedProduct(undefined);
  };

  const handleDelete = () => {
    if (!productToDelete) return;
    const productRef = doc(firestore, 'barberShops', shopId, 'products', productToDelete.id);
    deleteDocumentNonBlocking(productRef);
    toast({
      title: 'Produto Removido',
      description: `O produto "${productToDelete.name}" foi removido.`,
    });
    setProductToDelete(null);
  };
  
  const handleToggleStatus = (product: Product) => {
    const newStatus = !(product.ativo === undefined ? true : product.ativo);
    const productRef = doc(firestore, 'barberShops', shopId, 'products', product.id);
    setDocumentNonBlocking(productRef, { ativo: newStatus }, { merge: true });
    toast({
      title: `Produto ${newStatus ? 'Ativado' : 'Inativado'}`,
      description: `O produto "${product.name}" agora está ${newStatus ? 'ativo' : 'inativo'}.`,
    });
  };

  return (
    <>
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <Package />
            Produtos
          </h1>
          <p className="text-muted-foreground">
            Gerencie o inventário de produtos à venda.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                className="pl-8 w-full md:w-[200px] lg:w-[320px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedProduct(undefined); setFormOpen(isOpen); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes do produto para venda.
                  </DialogDescription>
                </DialogHeader>
                <AddProductForm
                  shopId={shopId}
                  initialData={selectedProduct}
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
                <TableHead>Produto</TableHead>
                <TableHead className="hidden md:table-cell">Preço</TableHead>
                <TableHead className="hidden sm:table-cell">Estoque</TableHead>
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
              {filteredProducts?.map((product) => {
                const isAtivo = product.ativo === undefined ? true : product.ativo;
                return (
                <TableRow key={product.id} className={!isAtivo ? 'text-muted-foreground' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="rounded-md">
                        <AvatarImage src={product.imageUrl} alt={product.name} className="object-cover"/>
                        <AvatarFallback className="rounded-md">
                          <Package />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div>{product.name}</div>
                        <div className="text-sm text-muted-foreground">SKU: {product.sku || 'N/A'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    R${product.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={product.stockQuantity > 5 ? "secondary" : "destructive"}>{product.stockQuantity} unid.</Badge>
                  </TableCell>
                   <TableCell>
                    <Badge variant={isAtivo ? 'default' : 'outline'} className={isAtivo ? 'bg-green-500 hover:bg-green-500/90' : ''}>
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
                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(product)}>
                            {isAtivo ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                            <span>{isAtivo ? 'Inativar' : 'Ativar'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setProductToDelete(product)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
              {!isLoading && filteredProducts?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {searchTerm ? `Nenhum produto encontrado para "${searchTerm}"` : "Nenhum produto encontrado."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    <AlertDialog
      open={!!productToDelete}
      onOpenChange={(isOpen) => !isOpen && setProductToDelete(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso irá remover o produto{' '}
            <strong>{productToDelete?.name}</strong> permanentemente.
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
