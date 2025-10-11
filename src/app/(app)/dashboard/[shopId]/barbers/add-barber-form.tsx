
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  LoaderCircle,
  Mail,
  PenSquare,
  Phone,
  User,
  Image as ImageIcon,
  DollarSign,
  Percent,
  Scissors,
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
import type { Barber, Service } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import {
  setDocumentNonBlocking,
  addDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const commissionSchema = z.object({
    serviceId: z.string(),
    commissionType: z.enum(['fixed', 'percentage']).optional(),
    commissionValue: z.coerce.number().optional(),
});

const formSchema = z.object({
  firstName: z.string().min(1, 'O nome é obrigatório.'),
  lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
  email: z.string().email('Email inválido.').optional().or(z.literal('')),
  phone: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().url('URL inválida.').optional().or(z.literal('')),
  services: z.array(commissionSchema),
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

  const servicesQuery = useMemoFirebase(() => collection(firestore, 'barberShops', shopId, 'services'), [firestore, shopId]);
  const { data: availableServices } = useCollection<Service>(servicesQuery);

  const form = useForm<AddBarberFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          email: initialData.email || '',
          phone: initialData.phone || '',
          bio: initialData.bio || '',
          avatar: initialData.avatar || '',
          services: initialData.services || [],
        }
      : {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          bio: '',
          avatar: '',
          services: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'services'
  });

  const selectedServiceIds = new Set((form.watch('services') || []).map(s => s.serviceId));

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
        
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="services">
                <AccordionTrigger>
                    <div className='flex items-center gap-2'>
                        <Scissors className="h-4 w-4" />
                        Serviços e Comissões
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-2">
                    {availableServices?.map(service => {
                        const fieldIndex = fields.findIndex(f => f.serviceId === service.id);
                        const isSelected = fieldIndex !== -1;
                        const serviceCommissionType = form.watch(`services.${fieldIndex}.commissionType`);

                        return (
                            <div key={service.id} className="p-3 border rounded-lg space-y-3">
                               <FormItem className="flex flex-row items-center justify-between">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">{service.name}</FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                       Preço: R${service.price.toFixed(2)} | Duração: {service.duration} min
                                    </p>
                                  </div>
                                  <FormControl>
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          append({ 
                                              serviceId: service.id, 
                                              commissionType: service.partnership?.commissionType || 'percentage', 
                                              commissionValue: service.partnership?.commissionValue || 0
                                          });
                                        } else {
                                          const indexToRemove = fields.findIndex(f => f.serviceId === service.id);
                                          if (indexToRemove > -1) remove(indexToRemove);
                                        }
                                      }}
                                    />
                                  </FormControl>
                                </FormItem>
                                {isSelected && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-3 border-t">
                                        <FormField
                                            control={form.control}
                                            name={`services.${fieldIndex}.commissionType`}
                                            render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                <FormLabel className="text-sm">Tipo de Comissão</FormLabel>
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
                                                        <FormLabel className="font-normal text-sm">Porcentagem (%)</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                        <RadioGroupItem value="fixed" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal text-sm">Valor Fixo (R$)</FormLabel>
                                                    </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                         <FormField
                                            control={form.control}
                                            name={`services.${fieldIndex}.commissionValue`}
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm">Valor da Comissão</FormLabel>
                                                <div className="relative">
                                                {serviceCommissionType === 'fixed' ? (
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                )}
                                                <FormControl>
                                                    <Input type="number" placeholder="50" {...field} className="pl-10" />
                                                </FormControl>
                                                </div>
                                                <p className="text-xs text-muted-foreground pt-1">
                                                    Padrão do serviço: {service.partnership?.commissionValue || 0}{service.partnership?.commissionType === 'fixed' ? ' R$' : '%'}
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </AccordionContent>
            </AccordionItem>
        </Accordion>

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
