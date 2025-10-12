
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle, PenSquare, DollarSign, Package, Tag, Image as ImageIcon, Hash, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Product } from '@/lib/types';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  name: z.string().min(1, 'O nome do produto é obrigatório.'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'O preço não pode ser negativo.'),
  cost: z.coerce.number().min(0, 'O custo não pode ser negativo.').optional(),
  stockQuantity: z.coerce.number().min(0, 'O estoque não pode ser negativo.'),
  sku: z.string().optional(),
  imageUrl: z.string().url('URL inválida.').optional().or(z.literal('')),
  ativo: z.boolean().default(true),
});

type AddProductFormValues = z.infer<typeof formSchema>;

interface AddProductFormProps {
  shopId: string;
  initialData?: Product;
  onSuccess?: () => void;
}

export function AddProductForm({ shopId, initialData, onSuccess }: AddProductFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<AddProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      imageUrl: initialData.imageUrl || '',
      description: initialData.description || '',
      cost: initialData.cost || 0,
      sku: initialData.sku || '',
      ativo: initialData.ativo === undefined ? true : initialData.ativo,
    } : {
      name: '',
      description: '',
      price: 0,
      cost: 0,
      stockQuantity: 0,
      sku: '',
      imageUrl: '',
      ativo: true,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: AddProductFormValues) => {
    try {
        const productData = {
            ...values,
            barberShopId: shopId,
        };

        if (initialData) {
            const productRef = doc(firestore, 'barberShops', shopId, 'products', initialData.id);
            setDocumentNonBlocking(productRef, productData, { merge: true });
        } else {
            const productRef = collection(firestore, 'barberShops', shopId, 'products');
            addDocumentNonBlocking(productRef, {...productData, createdAt: serverTimestamp()});
        }

        toast({
            title: initialData ? 'Produto Atualizado!' : 'Produto Adicionado!',
            description: `O produto "${values.name}" foi salvo com sucesso.`,
        });
        onSuccess?.();
        if (!initialData) form.reset();

    } catch(error) {
        console.error("Error saving product: ", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao salvar',
            description: 'Não foi possível salvar o produto.',
        });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Produto</FormLabel>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="Ex: Pomada Modeladora" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <div className="relative">
                <PenSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Textarea
                    placeholder="Descrição do produto, benefícios, etc."
                    {...field}
                    className="pl-10"
                    value={field.value || ''}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Preço de Venda (R$)</FormLabel>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                    <Input type="number" placeholder="50.00" {...field} className="pl-10" />
                    </FormControl>
                </div>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Preço de Custo (R$)</FormLabel>
                  <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                      <Input type="number" placeholder="25.00" {...field} className="pl-10" />
                      </FormControl>
                  </div>
                  <FormMessage />
                  </FormItem>
              )}
              />
            <FormField
            control={form.control}
            name="stockQuantity"
            render={({ field }) => (
                <FormItem className="lg:col-span-1">
                <FormLabel>Quantidade em Estoque</FormLabel>
                <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                    <Input type="number" placeholder="10" {...field} className="pl-10" />
                    </FormControl>
                </div>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>SKU / Código de Barras</FormLabel>
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                        <Input placeholder="Código único do produto" {...field} value={field.value || ''} className="pl-10" />
                        </FormControl>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>URL da Foto do Produto</FormLabel>
                    <div className="relative">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                        <Input
                            placeholder="https://exemplo.com/foto.jpg"
                            {...field}
                            className="pl-10"
                            value={field.value || ''}
                        />
                        </FormControl>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <FormField
            control={form.control}
            name="ativo"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <FormLabel className="text-base">
                        Produto Ativo
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                        Desative para ocultar este produto do ponto de venda.
                    </p>
                </div>
                <FormControl>
                    <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    />
                </FormControl>
                </FormItem>
            )}
        />
        

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            {initialData ? 'Salvar Alterações' : 'Salvar Produto'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
