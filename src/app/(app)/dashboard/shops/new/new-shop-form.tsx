
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle, Building, MapPin } from 'lucide-react';
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
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';

const formSchema = z.object({
  name: z.string().min(2, 'O nome da barbearia é obrigatório.'),
  address: z.string().optional(),
});

type NewShopFormValues = z.infer<typeof formSchema>;

interface NewShopFormProps {
  onSuccess: (shopId: string) => void;
}

export function NewShopForm({ onSuccess }: NewShopFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<NewShopFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: NewShopFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para criar uma loja.',
      });
      return;
    }

    try {
      const shopsRef = collection(firestore, 'barberShops');
      const docRef = await addDocumentNonBlocking(shopsRef, {
        ...values,
        ownerId: user.uid,
        status: 'active',
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Barbearia Criada!',
        description: `Sua barbearia "${values.name}" foi criada com sucesso.`,
      });
      
      if (docRef?.id) {
        onSuccess(docRef.id);
      }

    } catch (error) {
      console.error("Error creating shop: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao criar loja',
        description: 'Não foi possível criar sua barbearia. Tente novamente.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Barbearia</FormLabel>
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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço Principal (Opcional)</FormLabel>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="Rua das Flores, 123 - Centro" {...field} value={field.value || ''} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
       
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            Criar Minha Barbearia
          </Button>
        </div>
      </form>
    </Form>
  );
}
