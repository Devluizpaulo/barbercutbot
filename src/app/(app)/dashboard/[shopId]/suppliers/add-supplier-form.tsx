
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle, PenSquare, Phone, User, Building, Tag } from 'lucide-react';
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
  name: z.string().min(1, 'O nome do fornecedor é obrigatório.'),
  contactPerson: z.string().optional(),
  phone: z.string().min(1, 'O telefone é obrigatório.'),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  notes: z.string().optional(),
});

type AddSupplierFormValues = z.infer<typeof formSchema>;

interface AddSupplierFormProps {
  shopId: string;
  initialData?: AddSupplierFormValues & { id: string };
  onSuccess?: () => void;
}

export function AddSupplierForm({ shopId, initialData, onSuccess }: AddSupplierFormProps) {
  const { toast } = useToast();

  const form = useForm<AddSupplierFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      contactPerson: '',
      phone: '',
      category: '',
      notes: '',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: AddSupplierFormValues) => {
    // NOTE: Database functionality is disabled for simulation.
    console.log("Simulating add/edit supplier for shop:", shopId, values);
    toast({
      title: initialData ? 'Fornecedor Atualizado!' : 'Fornecedor Adicionado!',
      description: `O fornecedor "${values.name}" foi salvo com sucesso.`,
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
              <FormLabel>Nome do Fornecedor</FormLabel>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="Ex: Cosméticos Pro" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="Ex: Produtos de Cabelo, Equipamentos" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Pessoa de Contato</FormLabel>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                    <Input placeholder="Ex: Fernanda" {...field} value={field.value || ''} className="pl-10" />
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
                    <Input placeholder="(11) 99999-9999" {...field} className="pl-10" />
                    </FormControl>
                </div>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anotações</FormLabel>
              <div className="relative">
                <PenSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Textarea
                    placeholder="Detalhes sobre o fornecedor, pedidos, etc."
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
            Salvar Fornecedor
          </Button>
        </div>
      </form>
    </Form>
  );
}
