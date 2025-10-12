

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle, Type, MessageSquare } from 'lucide-react';
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
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';

const formSchema = z.object({
  subject: z.string().min(5, 'O assunto deve ter pelo menos 5 caracteres.'),
  description: z.string().min(20, 'A descrição deve ter pelo menos 20 caracteres.'),
});

type AddTicketFormValues = z.infer<typeof formSchema>;

interface AddTicketFormProps {
  shopId: string;
  onSuccess?: () => void;
}

export function AddTicketForm({ shopId, onSuccess }: AddTicketFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<AddTicketFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: '',
      description: '',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: AddTicketFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Usuário não autenticado',
        description: 'Você precisa estar logado para abrir um ticket.',
      });
      return;
    }

    try {
      const ticketsRef = collection(firestore, 'tickets');
      const ticketData = {
        ...values,
        shopId,
        userId: user.uid,
        status: 'Aberto',
        createdAt: serverTimestamp(),
        lastUpdatedAt: serverTimestamp(),
      };
      await addDocumentNonBlocking(ticketsRef, ticketData);
      
      toast({
        title: 'Ticket Aberto!',
        description: 'Sua solicitação foi enviada para nossa equipe de suporte.',
      });
      onSuccess?.();
      form.reset();
    } catch (error) {
      console.error("Error creating ticket:", error);
       toast({
        variant: 'destructive',
        title: 'Erro ao abrir ticket',
        description: 'Não foi possível enviar sua solicitação. Tente novamente.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assunto</FormLabel>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="Ex: Problema com fatura" {...field} className="pl-10" />
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
              <FormLabel>Descrição Detalhada</FormLabel>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Textarea
                    placeholder="Descreva seu problema ou dúvida em detalhes..."
                    {...field}
                    className="pl-10 min-h-[120px]"
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
            Enviar Ticket
          </Button>
        </div>
      </form>
    </Form>
  );
}
