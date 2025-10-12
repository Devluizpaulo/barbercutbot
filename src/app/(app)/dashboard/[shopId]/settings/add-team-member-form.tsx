
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle, User, Mail, Phone } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import type { TeamMember } from '@/lib/types';
import { useEffect } from 'react';

const formSchema = z.object({
  firstName: z.string().min(1, 'O nome é obrigatório.'),
  lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
  email: z.string().email('Email inválido.').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.string().min(1, 'O perfil é obrigatório.'),
});

type AddTeamMemberFormValues = z.infer<typeof formSchema>;

interface AddTeamMemberFormProps {
  shopId: string;
  initialData?: TeamMember;
  onSuccess?: () => void;
}

export function AddTeamMemberForm({ shopId, initialData, onSuccess }: AddTeamMemberFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<AddTeamMemberFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'barber',
    },
  });
  
  useEffect(() => {
    if (initialData) {
        form.reset(initialData);
    }
  }, [initialData, form]);

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: AddTeamMemberFormValues) => {
    try {
      const memberData = {
        ...values,
        barberShopId: shopId,
      };

      if (initialData) {
        const memberRef = doc(firestore, 'barberShops', shopId, 'teamMembers', initialData.id);
        await setDocumentNonBlocking(memberRef, memberData, { merge: true });
      } else {
        const membersRef = collection(firestore, 'barberShops', shopId, 'teamMembers');
        await addDocumentNonBlocking(membersRef, { ...memberData, createdAt: serverTimestamp() });
      }

      toast({
        title: initialData ? 'Membro Atualizado!' : 'Membro Adicionado!',
        description: `O membro da equipe ${values.firstName} foi salvo.`,
      });
      onSuccess?.();
      if (!initialData) form.reset();
    } catch (error) {
      console.error("Error saving team member:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o membro da equipe.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="João" {...field} />
                </FormControl>
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
                <FormControl>
                  <Input placeholder="Silva" {...field} />
                </FormControl>
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
                  <Input type="email" placeholder="joao@email.com" {...field} value={field.value || ''} className="pl-10" />
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
                  <Input placeholder="(11) 99999-9999" {...field} value={field.value || ''} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Perfil de Acesso</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger>
                    <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    <SelectItem value="barber">Barbeiro</SelectItem>
                    <SelectItem value="cashier">Caixa</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            {initialData ? 'Salvar Alterações' : 'Adicionar Membro'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
