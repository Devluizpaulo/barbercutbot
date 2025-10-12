
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
  ImageIcon,
  DollarSign,
  Percent,
  Scissors,
  Save,
  Palette,
  Smartphone,
  MapPin,
  Search,
  Building2,
  Hash,
  Map,
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
import { DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

const availableColors = [
    '#e11d48', // rose
    '#f97316', // orange
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
];

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
  whatsapp: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().url('URL inválida.').optional().or(z.literal('')),
  color: z.string().optional(),
  services: z.array(commissionSchema),
  cep: z.string().optional(),
  address: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
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
  const [isCepLoading, setIsCepLoading] = useState(false);

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
          color: initialData.color || '',
          services: initialData.services || [],
          cep: initialData.cep || '',
          address: initialData.address || '',
          number: initialData.number || '',
          complement: initialData.complement || '',
          neighborhood: initialData.neighborhood || '',
          city: initialData.city || '',
          state: initialData.state || '',
        }
      : {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          whatsapp: '',
          bio: '',
          avatar: '',
          color: availableColors[0],
          services: [],
          cep: '',
          address: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'services'
  });

  const { isSubmitting } = form.formState;
  const avatarUrl = form.watch('avatar');
  const firstName = form.watch('firstName');
  const barberColor = form.watch('color');

  const handleCepLookup = async () => {
    const cep = form.getValues('cep')?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) {
      toast({
        variant: 'destructive',
        title: 'CEP inválido',
        description: 'Por favor, insira um CEP com 8 dígitos.',
      });
      return;
    }

    setIsCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (data.erro) {
        toast({
          variant: 'destructive',
          title: 'CEP não encontrado',
          description: 'Não foi possível encontrar o endereço para o CEP informado.',
        });
        form.setValue('address', '');
        form.setValue('neighborhood', '');
        form.setValue('city', '');
        form.setValue('state', '');
      } else {
        form.setValue('address', data.logradouro);
        form.setValue('neighborhood', data.bairro);
        form.setValue('city', data.localidade);
        form.setValue('state', data.uf);
        toast({
          title: 'Endereço encontrado!',
          description: 'Os campos de endereço foram preenchidos.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro na busca',
        description: 'Houve um problema ao buscar o CEP. Tente novamente.',
      });
    } finally {
      setIsCepLoading(false);
    }
  };

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
        title: initialData ? 'Profissional Atualizado!' : 'Profissional Adicionado!',
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
        description: 'Ocorreu um problema ao salvar o profissional.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="address">Endereço</TabsTrigger>
                <TabsTrigger value="services">Serviços e Comissões</TabsTrigger>
            </TabsList>
             <TabsContent value="profile" className="mt-6 space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl} alt={firstName} />
                    <AvatarFallback>
                      {firstName ? (
                        firstName.charAt(0).toUpperCase()
                      ) : (
                        <User className="h-10 w-10" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-4">
                    <FormField
                        control={form.control}
                        name="avatar"
                        render={({ field }) => (
                        <FormItem>
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
                    <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cor de destaque na agenda</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant="outline"
                                        className={cn("w-full justify-start text-left font-normal")}
                                        >
                                        <div className="flex w-full items-center gap-2">
                                            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: barberColor }}/>
                                            <span>{barberColor}</span>
                                        </div>
                                        <Palette className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2">
                                    <div className="grid grid-cols-5 gap-2">
                                        {availableColors.map(color => (
                                            <Button
                                                key={color}
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => form.setValue('color', color)}
                                            >
                                                <div className={cn("h-5 w-5 rounded-full", form.getValues('color') === color && "ring-2 ring-ring ring-offset-2 ring-offset-background")} style={{ backgroundColor: color }} />
                                            </Button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    name="whatsapp"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <div className="relative">
                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                            <Input
                                placeholder="(11) 98888-8888"
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
            </TabsContent>
            <TabsContent value="address" className="mt-6 space-y-6">
                 <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-grow">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                    <Input placeholder="00000-000" {...field} value={field.value || ''} className="pl-10" />
                                </FormControl>
                            </div>
                            <Button type="button" variant="secondary" onClick={handleCepLookup} disabled={isCepLoading}>
                                {isCepLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                <span className="ml-2 hidden sm:inline">Buscar CEP</span>
                            </Button>
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
                        <FormLabel>Logradouro</FormLabel>
                        <div className="relative">
                            <Map className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                            <Input placeholder="Rua das Flores" {...field} value={field.value || ''} className="pl-10" />
                            </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Número</FormLabel>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                <Input placeholder="123" {...field} value={field.value || ''} className="pl-10" />
                                </FormControl>
                            </div>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="complement"
                        render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                            <FormLabel>Complemento</FormLabel>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                <Input placeholder="Apto 4B" {...field} value={field.value || ''} className="pl-10" />
                                </FormControl>
                            </div>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <FormField
                        control={form.control}
                        name="neighborhood"
                        render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                            <Input placeholder="Centro" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                            <Input placeholder="São Paulo" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <FormControl>
                            <Input placeholder="SP" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </TabsContent>
            <TabsContent value="services" className="mt-6">
                 <div className="space-y-2">
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
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
                </div>
            </TabsContent>
        </Tabs>
        
        <DialogFooter className="pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="mr-2 h-4 w-4" />
            {initialData ? 'Salvar Alterações' : 'Salvar Profissional'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

    