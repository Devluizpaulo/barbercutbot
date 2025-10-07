
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle, PenSquare, DollarSign, Clock, Tag } from 'lucide-react';
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

const formSchema = z.object({
  name: z.string().min(1, 'O nome do serviço é obrigatório.'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'O preço não pode ser negativo.'),
  cost: z.coerce.number().min(0, 'O custo não pode ser negativo.'),
  duration: z.coerce.number().min(0, 'A duração deve ser um número positivo em minutos.'),
});

type AddServiceFormValues = z.infer<typeof formSchema>;

interface AddServiceFormProps {
  shopId: string;
  initialData?: AddServiceFormValues & { id: string };
  onSuccess?: () => void;
}

export function AddServiceForm({ shopId, initialData, onSuccess }: AddServiceFormProps) {
  const { toast } = useToast();

  const form = useForm<AddServiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      price: 0,
      cost: 0,
      duration: 30,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: AddServiceFormValues) => {
    // NOTE: Database functionality is disabled for simulation.
    console.log("Simulating add/edit service for shop:", shopId, values);
    toast({
      title: initialData ? 'Serviço Atualizado!' : 'Serviço Adicionado!',
      description: `O serviço "${values.name}" foi salvo com sucesso.`,
    });
    onSuccess?.();
    if (!initialData) form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Serviço</FormLabel>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="Ex: Corte de Cabelo" {...field} className="pl-10" />
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
                    placeholder="Descreva o serviço, ex: Corte clássico ou moderno, na tesoura ou máquina."
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
                <FormLabel>Preço (R$)</FormLabel>
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
                  <FormLabel>Custo (R$)</FormLabel>
                  <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                      <Input type="number" placeholder="15.00" {...field} className="pl-10" />
                      </FormControl>
                  </div>
                  <FormMessage />
                  </FormItem>
              )}
              />
            <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
                <FormItem className="lg:col-span-1">
                <FormLabel>Duração (minutos)</FormLabel>
                <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                    <Input type="number" placeholder="30" {...field} className="pl-10" />
                    </FormControl>
                </div>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar Serviço
          </Button>
        </div>
      </form>
    </Form>
  );
}
