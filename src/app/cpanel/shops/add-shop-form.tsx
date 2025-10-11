
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle, Building, User, MapPin } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(1, 'O nome do negócio é obrigatório.'),
  ownerId: z.string().min(1, 'O ID do proprietário é obrigatório.'),
  address: z.string().optional(),
});

type AddShopFormValues = z.infer<typeof formSchema>;

interface AddShopFormProps {
  initialData?: BarberShop;
  onSuccess?: () => void;
}

export function AddShopForm({ initialData, onSuccess }: AddShopFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<AddShopFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      ownerId: '',
      address: '',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: AddShopFormValues) => {
    try {
      if (initialData) {
        const shopRef = doc(firestore, 'barberShops', initialData.id);
        setDocumentNonBlocking(shopRef, values, { merge: true });
      } else {
        const shopsRef = collection(firestore, 'barberShops');
        addDocumentNonBlocking(shopsRef, { 
            ...values, 
            status: 'active',
            createdAt: serverTimestamp() 
        });
      }

      toast({
        title: initialData ? 'Negócio Atualizado!' : 'Negócio Adicionado!',
        description: `O negócio "${values.name}" foi salvo com sucesso.`,
      });
      onSuccess?.();
      if (!initialData) form.reset();
    } catch (error) {
      console.error("Error saving shop: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o negócio.',
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
              <FormLabel>Nome do Negócio</FormLabel>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="Ex: Barbearia do Zé" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ownerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID do Proprietário (Firebase UID)</FormLabel>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="Firebase User ID" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="Rua, Número, Cidade" {...field} value={field.value || ''} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
       
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            {initialData ? 'Salvar Alterações' : 'Salvar Negócio'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
