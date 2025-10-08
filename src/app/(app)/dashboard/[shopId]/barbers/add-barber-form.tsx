
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  LoaderCircle,
  Mail,
  PenSquare,
  Phone,
  User,
  Image as ImageIcon,
} from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Barber } from '@/lib/types';
import { useFirestore }s
import {
  setDocumentNonBlocking,
  addDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { collection, doc, serverTimestamp } from 'firebase/firestore';

const formSchema = z.object({
  firstName: z.string().min(1, 'O nome é obrigatório.'),
  lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
  email: z.string().email('Email inválido.').optional().or(z.literal('')),
  phone: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().url('URL inválida.').optional().or(z.literal('')),
});

type AddBarberFormValues = z.infer<typeof formSchema>;

interface AddBarberFormProps {
  shopId: string;
  initialData?: Barber;
  onSuccess?: () => void;
}

export function AddBarberForm({
  shopId,
  initialData,
  onSuccess,
}: AddBarberFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<AddBarberFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          email: initialData.email || '',
          phone: initialData.phone || '',
          bio: initialData.bio || '',
          avatar: initialData.avatar || '',
        }
      : {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          bio: '',
          avatar: '',
        },
  });

  const { isSubmitting } = form.formState;
  const avatarUrl = form.watch('avatar');
  const firstName = form.watch('firstName');

  const onSubmit = async (values: AddBarberFormValues) => {
    try {
      if (initialData) {
        // Update existing barber
        const barberRef = doc(
          firestore,
          'barberShops',
          shopId,
          'barbers',
          initialData.id
        );
        setDocumentNonBlocking(barberRef, values, { merge: true });
      } else {
        // Create new barber
        const barbersRef = collection(firestore, 'barberShops', shopId, 'barbers');
        await addDocumentNonBlocking(barbersRef, {
          ...values,
          barberShopId: shopId,
          createdAt: serverTimestamp(),
        });
      }

      toast({
        title: initialData ? 'Barbeiro Atualizado!' : 'Barbeiro Adicionado!',
        description: `O profissional ${values.firstName} foi salvo com sucesso.`,
      });
      onSuccess?.();
      if (!initialData) {
        form.reset();
      }
    } catch (error) {
      console.error('Error saving barber:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Ocorreu um problema ao salvar o barbeiro.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl} alt={firstName} />
            <AvatarFallback>
              {firstName ? (
                firstName.charAt(0)
              ) : (
                <User className="h-8 w-8" />
              )}
            </AvatarFallback>
          </Avatar>
          <FormField
            control={form.control}
            name="avatar"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>URL da Foto</FormLabel>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input placeholder="João" {...field} className="pl-10" />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sobrenome</FormLabel>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input placeholder="Silva" {...field} className="pl-10" />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input
                    placeholder="joao.silva@email.com"
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

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input
                    placeholder="(11) 99999-9999"
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

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio (Opcional)</FormLabel>
              <div className="relative">
                <PenSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Textarea
                    placeholder="Especialista em cortes clássicos e modernos..."
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

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            {initialData ? 'Salvar Alterações' : 'Salvar Barbeiro'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
