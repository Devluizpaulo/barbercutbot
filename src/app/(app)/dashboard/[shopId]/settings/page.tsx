
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CreditCard,
  Save,
  MapPin,
  Search,
  LoaderCircle,
  User,
  Clock,
  Shield,
  Bot,
  MessageCircle,
  Smartphone,
  Building2,
  Hash,
  Key,
  ImageIcon,
  Instagram,
  Facebook,
  Globe,
  Wallet,
  Calendar as CalendarIcon,
  Trash2,
  PlusCircle,
  Palette,
  Lock,
  Users as UsersIcon,
  Phone,
  Check,
} from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { useParams, useRouter } from 'next/navigation';
import { doc, Timestamp } from 'firebase/firestore';
import type {
  BarberShop,
  Holiday,
  WorkingHour,
  CashierSettings,
  CashierOperator,
  Role,
} from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useEffect, useState } from 'react';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { PinInput, PinInputField } from '@/components/ui/pin-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PLANS, Plan } from '@/lib/plans';
import { createStripeCheckout } from '@/ai/flows/create-stripe-checkout-flow';

const profileFormSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  logo: z.string().url('URL da logo inválida.').optional().or(z.literal('')),
  document: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  website: z.string().optional(),
  cep: z.string().optional(),
  address: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  whatsapp: z.object({
    instanceId: z.string().min(1, 'O ID da instância é obrigatório.'),
    numeroConectado: z.string().optional(),
  }),
  bot: z.object({
    provider: z.string().min(1, 'O provedor é obrigatório.'),
    modelo: z.string().min(1, 'O modelo é obrigatório.'),
    temperatura: z.coerce.number().min(0).max(1),
    ativo: z.boolean(),
    promptPersonalizado: z
      .string()
      .min(10, 'O prompt deve ter pelo menos 10 caracteres.'),
  }),
});

const workingHoursFormSchema = z.object({
  hours: z.array(
    z.object({
      day: z.string(),
      open: z.string(),
      close: z.string(),
      enabled: z.boolean(),
    })
  ),
});


const paymentSettingsFormSchema = z.object({
  paymentMethods: z.array(
    z.object({
      method: z.enum(['money', 'pix', 'debit', 'credit']),
      enabled: z.boolean(),
      rate: z.coerce.number().min(0).optional(),
    })
  ),
});

const cashierFormSchema = z.object({
  requirePassword: z.boolean().default(false),
  operators: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1, 'O nome é obrigatório.'),
        role: z.enum(['caixa', 'gerente']),
        pin: z.string().optional(),
      })
    )
    .optional(),
});

const permissionsFormSchema = z.object({
  roles: z.array(z.object({
    id: z.string(),
    name: z.string().min(2, "O nome do perfil é obrigatório."),
    isBuiltIn: z.boolean().default(false),
    permissions: z.object({
        viewDashboard: z.boolean().default(true),
        manageAppointments: z.boolean().default(true),
        manageClients: z.boolean().default(true),
        manageTeam: z.boolean().default(true),
        manageServices: z.boolean().default(true),
        viewFinancial: z.boolean().default(true),
        manageSettings: z.boolean().default(true),
    })
  })),
});


export default function SettingsPage() {
  const params = useParams();
  const { toast } = useToast();
  const shopId = params.shopId as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [pinOperator, setPinOperator] = useState<CashierOperator | null>(null);
  const [currentPin, setCurrentPin] = useState('');
  const [newRoleName, setNewRoleName] = useState("");
  const [isAddingRole, setIsAddingRole] = useState(false);

  const shopRef = useMemoFirebase(
    () => doc(firestore, 'barberShops', shopId),
    [firestore, shopId]
  );
  const { data: shop, isLoading } = useDoc<BarberShop>(shopRef);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      logo: '',
      document: '',
      contactPerson: '',
      phone: '',
      instagram: '',
      facebook: '',
      website: '',
      cep: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      whatsapp: { instanceId: '', numeroConectado: '' },
      bot: {
        provider: 'groq',
        modelo: 'openai/gpt-oss-120b',
        temperatura: 0.7,
        ativo: true,
        promptPersonalizado: '',
      },
    },
  });

  const workingHoursForm = useForm<z.infer<typeof workingHoursFormSchema>>({
    resolver: zodResolver(workingHoursFormSchema),
    defaultValues: {
      hours: [
        { day: 'Segunda-feira', open: '09:00', close: '19:00', enabled: true },
        { day: 'Terça-feira', open: '09:00', close: '19:00', enabled: true },
        { day: 'Quarta-feira', open: '09:00', close: '19:00', enabled: true },
        { day: 'Quinta-feira', open: '09:00', close: '19:00', enabled: true },
        { day: 'Sexta-feira', open: '09:00', close: '19:00', enabled: true },
        { day: 'Sábado', open: '09:00', close: '17:00', enabled: true },
        { day: 'Domingo', open: '09:00', close: '19:00', enabled: false },
      ],
    },
  });

  const paymentSettingsForm = useForm<z.infer<typeof paymentSettingsFormSchema>>(
    {
      resolver: zodResolver(paymentSettingsFormSchema),
      defaultValues: {
        paymentMethods: [
          { method: 'money', enabled: true },
          { method: 'pix', enabled: true },
          { method: 'debit', enabled: false, rate: 2.5 },
          { method: 'credit', enabled: false, rate: 4.5 },
        ],
      },
    }
  );

  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  };

  const { fields, replace } = useFieldArray({
    control: workingHoursForm.control,
    name: 'hours',
  });

  const { fields: paymentMethodFields, replace: replacePaymentMethods } =
    useFieldArray({
      control: paymentSettingsForm.control,
      name: 'paymentMethods',
    });


  useEffect(() => {
    if (shop) {
      profileForm.reset({
        name: shop.name || '',
        logo: shop.logo || '',
        document: shop.document || '',
        contactPerson: shop.contactPerson || '',
        phone: shop.phone || '',
        instagram: shop.instagram || '',
        facebook: shop.facebook || '',
        website: shop.website || '',
        cep: shop.cep || '',
        address: shop.address || '',
        number: shop.number || '',
        complement: shop.complement || '',
        neighborhood: shop.neighborhood || '',
        city: shop.city || '',
        state: shop.state || '',
        whatsapp: shop.whatsapp || { instanceId: shopId, numeroConectado: '' },
        bot: shop.bot || {
          provider: 'groq',
          modelo: 'llama-3.1-70b-versatile',
          temperatura: 0.7,
          ativo: true,
          promptPersonalizado: '',
        },
      });

      if (shop.workingHours) {
        replace(shop.workingHours);
      }
      
      if (shop.paymentSettings) {
        replacePaymentMethods(shop.paymentSettings);
      }
    }
  }, [shop, profileForm, workingHoursForm, paymentSettingsForm, replace, replacePaymentMethods, shopId]);
  
  const handleCheckout = async (plan: Plan) => {
    if (!user || !plan.priceId) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário não autenticado ou ID do plano não encontrado.'
      });
      return;
    }
    setIsBillingLoading(true);
    try {
      const { checkoutUrl } = await createStripeCheckout({
        shopId: shopId,
        planId: plan.id,
        priceId: plan.priceId,
        userEmail: user.email!,
        userId: user.uid,
      });

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('URL de checkout não recebida.');
      }

    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao iniciar pagamento',
        description: 'Não foi possível criar a sessão de checkout. Tente novamente.',
      });
    } finally {
      setIsBillingLoading(false);
    }
  };


  const onProfileSubmit = (values: z.infer<typeof profileFormSchema>) => {
    if (!shopRef) return;
    const sanitizedValues = {
      ...values,
      logo: values.logo || '',
      document: values.document || '',
      contactPerson: values.contactPerson || '',
      phone: values.phone || '',
      instagram: values.instagram || '',
      facebook: values.facebook || '',
      website: values.website || '',
      cep: values.cep || '',
      address: values.address || '',
      number: values.number || '',
      complement: values.complement || '',
      neighborhood: values.neighborhood || '',
      city: values.city || '',
      state: values.state || '',
      whatsapp: {
        ...values.whatsapp,
        numeroConectado: values.whatsapp?.numeroConectado || '',
      },
    };

    setDocumentNonBlocking(shopRef, sanitizedValues, { merge: true });
    toast({
      title: 'Perfil atualizado!',
      description: 'As informações do seu negócio foram salvas.',
    });
  };

  const handleCepLookup = async () => {
    const cep = profileForm.getValues('cep')?.replace(/\D/g, '');
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
        });
        profileForm.setValue('address', '');
        profileForm.setValue('neighborhood', '');
        profileForm.setValue('city', '');
        profileForm.setValue('state', '');
      } else {
        profileForm.setValue('address', data.logradouro);
        profileForm.setValue('neighborhood', data.bairro);
        profileForm.setValue('city', data.localidade);
        profileForm.setValue('state', data.uf);
        toast({
          title: 'Endereço encontrado!',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro na busca',
        description: 'Houve um problema ao buscar o CEP.',
      });
    } finally {
      setIsCepLoading(false);
    }
  };

  const onHoursSubmit = (values: z.infer<typeof workingHoursFormSchema>) => {
    if (!shopRef) return;
    setDocumentNonBlocking(shopRef, { workingHours: values.hours }, { merge: true });
    toast({
      title: 'Horários atualizados!',
      description: 'Seu horário de funcionamento foi salvo.',
    });
  };

  const onPaymentSettingsSubmit = (
    values: z.infer<typeof paymentSettingsFormSchema>
  ) => {
    if (!shopRef) return;
    setDocumentNonBlocking(
      shopRef,
      { paymentSettings: values.paymentMethods },
      { merge: true }
    );
    toast({
      title: 'Recebimentos atualizados!',
      description: 'As formas de pagamento foram salvas.',
    });
  };

  const currentPlanId = shop?.subscription?.plan || 'lite';
  const currentPlan = PLANS.find(p => p.id === currentPlanId) || PLANS[0];
  
  const nextBillingDate = shop?.subscription?.currentPeriodEnd
    ? format(toDate(shop.subscription.currentPeriodEnd), 'dd/MM/yyyy')
    : 'N/A';

  const paymentMethodLabels: {
    [key in z.infer<
      typeof paymentSettingsFormSchema
    >['paymentMethods'][number]['method']]: string;
  } = {
    money: 'Dinheiro',
    pix: 'PIX',
    debit: 'Cartão de Débito',
    credit: 'Cartão de Crédito',
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Gerencie as informações e preferências do seu negócio.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6 mb-8">
          <TabsTrigger value="profile"> <User className="mr-2" /> Perfil </TabsTrigger>
          <TabsTrigger value="address"> <MapPin className="mr-2" /> Endereço </TabsTrigger>
          <TabsTrigger value="hours"> <Clock className="mr-2" /> Horários </TabsTrigger>
          <TabsTrigger value="integrations"> <Bot className="mr-2" /> Automação </TabsTrigger>
          <TabsTrigger value="payments"> <Wallet className="mr-2" /> Recebimentos </TabsTrigger>
          <TabsTrigger value="subscription"> <CreditCard className="mr-2" /> Assinatura </TabsTrigger>
        </TabsList>

        <TabsContent value="subscription">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
                <Card key={plan.id} className={cn("flex flex-col", currentPlan.id === plan.id && "border-primary ring-2 ring-primary")}>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-6">
                        <div className="flex items-baseline gap-2">
                           <span className="text-4xl font-bold">R${plan.price.toFixed(2)}</span>
                           <span className="text-muted-foreground">/mês</span>
                        </div>
                        <ul className="space-y-3">
                           {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span className="text-sm">{feature}</span>
                                </li>
                           ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                       {currentPlan.id === plan.id ? (
                           <Button className="w-full" disabled>Plano Atual</Button>
                       ) : (
                           <Button 
                              className="w-full"
                              onClick={() => handleCheckout(plan)}
                              disabled={isBillingLoading || !plan.priceId || !plan.priceId.startsWith('price_')}
                           >
                              {isBillingLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                              {currentPlan.price > plan.price ? 'Fazer Downgrade' : 'Fazer Upgrade'}
                           </Button>
                       )}
                    </CardFooter>
                </Card>
            ))}
          </div>
           <Card className="mt-8">
              <CardHeader>
                <CardTitle>Gerenciamento da Assinatura</CardTitle>
                <CardDescription>
                  Seu plano atual é o <strong>{currentPlan.name}</strong>.
                  Sua assinatura está <strong>{shop?.subscription?.status || 'gratuita'}</strong> e será renovada em {nextBillingDate}.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" disabled>
                  Gerenciar no Portal da Stripe (Em breve)
                </Button>
              </CardFooter>
            </Card>
        </TabsContent>
        <TabsContent value="profile">
          <Card>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <CardHeader>
                  <CardTitle>Perfil do Negócio</CardTitle>
                  <CardDescription>
                    Informações que seus clientes verão sobre sua barbearia.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="space-y-2">
                      <Label>Logo</Label>
                      <Avatar className="h-24 w-24">
                        <AvatarImage
                          src={profileForm.watch('logo')}
                          alt={profileForm.watch('name')}
                        />
                        <AvatarFallback>
                          <Building2 />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <Label>URL da Logo</Label>
                            <div className="relative">
                              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <FormControl>
                                <Input
                                  placeholder="https://exemplo.com/logo.png"
                                  {...field}
                                  value={field.value || ''}
                                  className="pl-10"
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <Label>Nome do Negócio</Label>
                            <FormControl>
                              <Input
                                placeholder="Barbearia do Zé"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Telefone para Contato</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input
                                placeholder="(11) 99999-9999"
                                {...field}
                                value={field.value || ''}
                                className="pl-10"
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={profileForm.control}
                      name="document"
                      render={({ field }) => (
                        <FormItem>
                          <Label>CNPJ / CPF</Label>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input
                                placeholder="00.000.000/0000-00"
                                {...field}
                                value={field.value || ''}
                                className="pl-10"
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                      control={profileForm.control}
                      name="instagram"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Instagram</Label>
                          <div className="relative">
                            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input
                                placeholder="https://instagram.com/seu_negocio"
                                {...field}
                                value={field.value || ''}
                                className="pl-10"
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={profileForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Website</Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input
                                placeholder="https://seunegocio.com.br"
                                {...field}
                                value={field.value || ''}
                                className="pl-10"
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex justify-end w-full">
                    <Button
                      type="submit"
                      disabled={profileForm.formState.isSubmitting}
                    >
                      {profileForm.formState.isSubmitting && (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Perfil
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
        <TabsContent value="address">
          <Card>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <CardHeader>
                  <CardTitle>Endereço</CardTitle>
                  <CardDescription>
                    Endereço principal do seu estabelecimento.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <Label>CEP</Label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-grow">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input
                                placeholder="00000-000"
                                {...field}
                                value={field.value || ''}
                                className="pl-10"
                              />
                            </FormControl>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCepLookup}
                            disabled={isCepLoading}
                          >
                            {isCepLoading ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                            <span className="ml-2 hidden sm:inline">
                              Buscar CEP
                            </span>
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <FormField
                        control={profileForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <Label>Logradouro</Label>
                            <FormControl>
                              <Input
                                placeholder="Rua das Flores"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormField
                        control={profileForm.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <Label>Número</Label>
                            <FormControl>
                              <Input
                                placeholder="123"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <FormField
                    control={profileForm.control}
                    name="complement"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Complemento</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input
                              placeholder="Apto 123, Bloco A"
                              {...field}
                              value={field.value || ''}
                              className="pl-10"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Bairro</Label>
                          <FormControl>
                            <Input
                              placeholder="Centro"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Cidade</Label>
                          <FormControl>
                            <Input
                              placeholder="São Paulo"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Estado</Label>
                          <FormControl>
                            <Input
                              placeholder="SP"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex justify-end w-full">
                    <Button
                      type="submit"
                      disabled={profileForm.formState.isSubmitting}
                    >
                      {profileForm.formState.isSubmitting && (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Endereço
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Form {...workingHoursForm}>
            <form onSubmit={workingHoursForm.handleSubmit(onHoursSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Horários de Funcionamento</CardTitle>
                  <CardDescription>
                    Defina os horários em que seu negócio está aberto.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <FormField
                          control={workingHoursForm.control}
                          name={`hours.${index}.enabled`}
                          render={({ field: checkboxField }) => (
                            <FormItem>
                              <FormControl>
                                <Checkbox
                                  checked={checkboxField.value}
                                  onCheckedChange={checkboxField.onChange}
                                  id={`check-${field.day.toLowerCase()}`}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Label
                          htmlFor={`check-${field.day.toLowerCase()}`}
                          className="text-base font-medium min-w-[120px]"
                        >
                          {field.day}
                        </Label>
                      </div>
                      <div className="flex items-center gap-4">
                        <FormField
                          control={workingHoursForm.control}
                          name={`hours.${index}.open`}
                          render={({ field: inputField }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="time"
                                  {...inputField}
                                  className="w-full md:w-auto"
                                  disabled={
                                    !workingHoursForm.watch(
                                      `hours.${index}.enabled`
                                    )
                                  }
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span className="text-muted-foreground">às</span>
                        <FormField
                          control={workingHoursForm.control}
                          name={`hours.${index}.close`}
                          render={({ field: inputField }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="time"
                                  {...inputField}
                                  className="w-full md:w-auto"
                                  disabled={
                                    !workingHoursForm.watch(
                                      `hours.${index}.enabled`
                                    )
                                  }
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <div className="flex justify-end w-full">
                    <Button
                      type="submit"
                      disabled={workingHoursForm.formState.isSubmitting}
                    >
                      {workingHoursForm.formState.isSubmitting && (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Horários
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="integrations">
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Automação e IA</CardTitle>
                  <CardDescription>
                    Configure a instância do WhatsApp e o comportamento do
                    assistente de IA.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="bot.ativo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Robô Ativo</FormLabel>
                          <FormDescription>
                            Ative para que o assistente de IA responda no
                            WhatsApp.
                          </FormDescription>
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
                  <FormField
                    control={profileForm.control}
                    name="whatsapp.instanceId"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Número do WhatsApp (ID da Instância)</Label>
                        <div className="relative">
                          <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input
                              placeholder="Ex: 5511999998888"
                              {...field}
                              className="pl-10"
                            />
                          </FormControl>
                        </div>
                        <FormDescription>
                          Este é o número de telefone que será usado para a conexão.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Alert variant="destructive">
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Aviso Importante</AlertTitle>
                    <AlertDescription>
                      A API utilizada não é oficial do WhatsApp, o que implica em um
                      risco de banimento do número. Para uma solução 100% segura,
                      oferecemos integração com a API oficial mediante consulta.{' '}
                      <a
                        href={`/dashboard/${shopId}/support`}
                        className="font-bold underline"
                      >
                        Fale com o suporte
                      </a>
                      .
                    </AlertDescription>
                  </Alert>
                  <FormField
                    control={profileForm.control}
                    name="bot.promptPersonalizado"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Prompt do Assistente (IA)</Label>
                        <div className="relative">
                          <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Textarea
                              placeholder="Você é um assistente de barbearia..."
                              {...field}
                              className="pl-10 min-h-[150px]"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="bot.modelo"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Modelo de IA (Groq API)</Label>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um modelo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="openai/gpt-oss-120b">
                                GPT-o (Recomendado)
                              </SelectItem>
                              <SelectItem value="llama-3.1-70b-versatile">
                                Llama 3.1 70B
                              </SelectItem>
                              <SelectItem value="gemma2-9b-it">Gemma2 9B</SelectItem>
                              <SelectItem value="mixtral-8x7b-32768">
                                Mixtral 8x7B
                              </SelectItem>
                              <SelectItem value="llama3-70b-8192">
                                Llama3 70B
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Modelos fornecidos pela Groq API.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="bot.temperatura"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Criatividade (Temperatura)</Label>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                value={[field.value]}
                                max={1}
                                step={0.1}
                                className="flex-1"
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                            </FormControl>
                            <span className="w-12 text-center font-mono text-sm rounded-md border py-2">
                              {field.value.toFixed(1)}
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex justify-end w-full">
                    <Button
                      type="submit"
                      disabled={profileForm.formState.isSubmitting}
                    >
                      {profileForm.formState.isSubmitting && (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Automação
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="payments">
          <Form {...paymentSettingsForm}>
            <form onSubmit={paymentSettingsForm.handleSubmit(onPaymentSettingsSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Meios de Recebimento</CardTitle>
                  <CardDescription>
                    Configure as formas de pagamento que seu negócio aceita no
                    local e suas taxas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentMethodFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
                    >
                      <FormField
                        control={paymentSettingsForm.control}
                        name={`paymentMethods.${index}.enabled`}
                        render={({ field: checkboxField }) => (
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <Checkbox
                                checked={checkboxField.value}
                                onCheckedChange={checkboxField.onChange}
                                id={`check-${field.method}`}
                              />
                            </FormControl>
                            <Label
                              htmlFor={`check-${field.method}`}
                              className="text-base font-medium min-w-[140px]"
                            >
                              {paymentMethodLabels[field.method]}
                            </Label>
                          </FormItem>
                        )}
                      />
                      {(field.method === 'credit' ||
                        field.method === 'debit') && (
                        <FormField
                          control={paymentSettingsForm.control}
                          name={`paymentMethods.${index}.rate`}
                          render={({ field: inputField }) => (
                            <FormItem>
                              <div className="flex items-center gap-2">
                                <Label className="text-sm text-muted-foreground">
                                  Taxa
                                </Label>
                                <div className="relative">
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...inputField}
                                      value={inputField.value || 0}
                                      className="w-24 pl-8"
                                      disabled={
                                        !paymentSettingsForm.watch(
                                          `paymentMethods.${index}.enabled`
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    %
                                  </span>
                                </div>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <div className="flex justify-end w-full">
                    <Button
                      type="submit"
                      disabled={paymentSettingsForm.formState.isSubmitting}
                    >
                      {paymentSettingsForm.formState.isSubmitting && (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Recebimentos
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

