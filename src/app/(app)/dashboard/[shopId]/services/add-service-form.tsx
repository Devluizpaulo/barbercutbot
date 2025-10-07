
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle, PenSquare, DollarSign, Clock, Tag, Image as ImageIcon, Percent, Users, Film } from 'lucide-react';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  name: z.string().min(1, 'O nome do serviço é obrigatório.'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'O preço não pode ser negativo.'),
  cost: z.coerce.number().min(0, 'O custo não pode ser negativo.'),
  duration: z.coerce.number().min(0, 'A duração deve ser um número positivo em minutos.'),
  imageUrl: z.string().url('URL inválida.').optional().or(z.literal('')),
  isCommissionEnabled: z.boolean().default(false),
  commissionType: z.enum(['fixed', 'percentage']).optional(),
  commissionValue: z.coerce.number().optional(),
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
    defaultValues: initialData ? {
      ...initialData,
      imageUrl: initialData.imageUrl || '',
      description: initialData.description || '',
    } : {
      name: '',
      description: '',
      price: 0,
      cost: 0,
      duration: 30,
      imageUrl: '',
      isCommissionEnabled: false,
      commissionType: 'percentage',
      commissionValue: 0,
    },
  });

  const { isSubmitting } = form.formState;
  const isCommissionEnabled = form.watch('isCommissionEnabled');

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

        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>
                    <div className='flex items-center gap-2'>
                        <Film className="h-4 w-4" />
                        Mídia e Opções Avançadas
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                    <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                            <FormLabel>URL da Foto do Serviço</FormLabel>
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
                             <p className="text-xs text-muted-foreground pt-1">
                                No futuro, você poderá fazer o upload de uma imagem diretamente.
                            </p>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <div className="space-y-4 rounded-lg border p-4">
                         <FormField
                            control={form.control}
                            name="isCommissionEnabled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Habilitar Parceria/Comissão
                                    </FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                        Ative para definir uma comissão para parceiros.
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

                        {isCommissionEnabled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                <FormField
                                control={form.control}
                                name="commissionType"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                    <FormLabel>Tipo de Comissão</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex flex-col space-y-1"
                                        >
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                            <RadioGroupItem value="percentage" />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                            Porcentagem (%)
                                            </FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                            <RadioGroupItem value="fixed" />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                            Valor Fixo (R$)
                                            </FormLabel>
                                        </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                    control={form.control}
                                    name="commissionValue"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor da Comissão</FormLabel>
                                        <div className="relative">
                                        {form.watch('commissionType') === 'fixed' ? (
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        )}
                                        <FormControl>
                                            <Input type="number" placeholder="50" {...field} className="pl-10" />
                                        </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>


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
