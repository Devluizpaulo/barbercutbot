'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { addDocumentNonBlocking, useFirestore } from '@/firebase';
import type { FinancialRecord } from '@/lib/types';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, LoaderCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  description: z.string().min(1, { message: 'A descrição é obrigatória.' }),
  amount: z.coerce.number().positive({ message: 'O valor deve ser positivo.' }),
  type: z.enum(['income', 'expense'], {
    required_error: 'O tipo é obrigatório.',
  }),
  date: z.date({
    required_error: 'A data é obrigatória.',
  }),
});

type AddTransactionFormValues = z.infer<typeof formSchema>;

interface AddTransactionFormProps {
  shopId: string;
  onSuccess?: () => void;
}

export function AddTransactionForm({ shopId, onSuccess }: AddTransactionFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<AddTransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: 0,
      type: 'income',
      date: new Date(),
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: AddTransactionFormValues) => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Serviço de banco de dados indisponível.',
      });
      return;
    }

    const transactionsRef = collection(
      firestore,
      `/barberShops/${shopId}/financialRecords`
    );

    const newRecord: Omit<FinancialRecord, 'id'> = {
      barberShopId: shopId,
      description: values.description,
      amount: values.amount,
      type: values.type,
      date: values.date.toISOString(),
      createdAt: new Date(), // Managed by client for consistency
    };

    addDocumentNonBlocking(transactionsRef, newRecord);

    toast({
      title: 'Sucesso!',
      description: 'Transação adicionada.',
    });

    onSuccess?.();
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Corte de cabelo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data da Transação</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: ptBR })
                      ) : (
                        <span>Escolha uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar Transação
          </Button>
        </div>
      </form>
    </Form>
  );
}
