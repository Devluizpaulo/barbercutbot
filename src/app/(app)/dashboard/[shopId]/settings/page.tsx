
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
import { CreditCard, Save, MapPin, Search, LoaderCircle, User, Clock, Shield, Bot, MessageCircle, Smartphone, Building2, Hash, Key, ImageIcon, Instagram, Facebook, Globe, AtSign, Phone, Wallet, Calendar as CalendarIcon, Trash2, PlusCircle, Palette } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useParams, useRouter } from 'next/navigation';
import { doc, Timestamp } from 'firebase/firestore';
import type { BarberShop, Holiday } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useEffect, useState } from 'react';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { createPayment } from '@/ai/flows/create-payment-flow';
import { Badge } from '@/components/ui/badge';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const profileFormSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  logo: z.string().url("URL da logo inválida.").optional().or(z.literal('')),
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
    instanceId: z.string().min(1, "O ID da instância é obrigatório."),
    numeroConectado: z.string().optional(),
  }),
  bot: z.object({
    provider: z.string().min(1, "O provedor é obrigatório."),
    modelo: z.string().min(1, "O modelo é obrigatório."),
    temperatura: z.coerce.number().min(0).max(1),
    ativo: z.boolean(),
    promptPersonalizado: z.string().min(10, "O prompt deve ter pelo menos 10 caracteres."),
  }),
});

const workingHoursFormSchema = z.object({
    hours: z.array(z.object({
        day: z.string(),
        open: z.string(),
        close: z.string(),
        enabled: z.boolean(),
    }))
});

const holidaysFormSchema = z.object({
    holidays: z.array(z.object({
        date: z.date(),
        description: z.string().min(1, "A descrição é obrigatória."),
        isClosed: z.boolean(),
        openingTime: z.string().optional(),
        closingTime: z.string().optional(),
    }))
});

const paymentSettingsFormSchema = z.object({
    paymentMethods: z.array(z.object({
        method: z.enum(['money', 'pix', 'debit', 'credit']),
        enabled: z.boolean(),
        rate: z.coerce.number().min(0).optional(),
    }))
});


export default function SettingsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const shopId = params.shopId as string;
    const firestore = useFirestore();
    const [isBillingLoading, setIsBillingLoading] = useState(false);
    const [isCepLoading, setIsCepLoading] = useState(false);

    const shopRef = useMemoFirebase(() => doc(firestore, 'barberShops', shopId), [firestore, shopId]);
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
            }
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
                { day: 'Festa-feira', open: '09:00', close: '19:00', enabled: true },
                { day: 'Sábado', open: '09:00', close: '17:00', enabled: true },
                { day: 'Domingo', open: '09:00', close: '19:00', enabled: false },
            ]
        }
    });

    const holidaysForm = useForm<z.infer<typeof holidaysFormSchema>>({
        resolver: zodResolver(holidaysFormSchema),
        defaultValues: {
            holidays: [],
        }
    });

    const paymentSettingsForm = useForm<z.infer<typeof paymentSettingsFormSchema>>({
        resolver: zodResolver(paymentSettingsFormSchema),
        defaultValues: {
            paymentMethods: [
                { method: 'money', enabled: true },
                { method: 'pix', enabled: true },
                { method: 'debit', enabled: false, rate: 2.5 },
                { method: 'credit', enabled: false, rate: 4.5 },
            ]
        }
    });

    
    const toDate = (timestamp: Timestamp | Date | string): Date => {
      if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
      }
      return new Date(timestamp);
    }

    const { fields, replace } = useFieldArray({
        control: workingHoursForm.control,
        name: "hours",
    });

    const { fields: holidayFields, append: appendHoliday, remove: removeHoliday, replace: replaceHolidays } = useFieldArray({
        control: holidaysForm.control,
        name: "holidays",
    });
    
    const { fields: paymentMethodFields, replace: replacePaymentMethods } = useFieldArray({
        control: paymentSettingsForm.control,
        name: "paymentMethods",
    });

    useEffect(() => {
        const fetchAndSetHolidays = async () => {
            try {
                const year = new Date().getFullYear();
                const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
                const nationalHolidays: { date: string; name: string }[] = await response.json();
                
                const formattedHolidays = nationalHolidays.map(h => ({
                    date: parse(h.date, 'yyyy-MM-dd', new Date()),
                    description: h.name,
                    isClosed: true, // Default to closed
                    openingTime: '09:00',
                    closingTime: '17:00',
                }));

                const savedHolidays = shop?.holidays?.map(h => ({...h, date: toDate(h.date)})) || [];
                const savedDates = new Set(savedHolidays.map(h => format(h.date, 'yyyy-MM-dd')));

                // Add national holidays only if they are not already saved
                const combinedHolidays = [...savedHolidays];
                formattedHolidays.forEach(nh => {
                    if (!savedDates.has(format(nh.date, 'yyyy-MM-dd'))) {
                        combinedHolidays.push(nh);
                    }
                });

                // Sort by date
                combinedHolidays.sort((a, b) => a.date.getTime() - b.date.getTime());
                
                replaceHolidays(combinedHolidays);

            } catch (error) {
                console.error("Failed to fetch national holidays:", error);
                // Fallback to saved holidays if API fails
                if (shop?.holidays) {
                    replaceHolidays(shop.holidays.map(h => ({...h, date: toDate(h.date)})));
                }
            }
        };

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
                bot: shop.bot || { provider: 'groq', modelo: 'llama-3.1-70b-versatile', temperatura: 0.7, ativo: true, promptPersonalizado: '' },
            });
             if (shop.workingHours) {
                const currentHours = workingHoursForm.getValues('hours').map(daySetting => {
                    const savedDay = shop.workingHours?.find(h => h.day === daySetting.day);
                    return savedDay || daySetting;
                });
                replace(currentHours);
            }
             
            fetchAndSetHolidays();

             if (shop.paymentSettings) {
                const currentMethods = paymentSettingsForm.getValues('paymentMethods').map(pm => {
                    const savedMethod = shop.paymentSettings?.find(spm => spm.method === pm.method);
                    return savedMethod || pm;
                });
                replacePaymentMethods(currentMethods);
            }
        }
    }, [shop, profileForm, workingHoursForm, holidaysForm, paymentSettingsForm, replace, replacePaymentMethods, shopId, replaceHolidays]);

    const onProfileSubmit = (values: z.infer<typeof profileFormSchema>) => {
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
                numeroConectado: values.whatsapp?.numeroConectado || ''
            }
        };

        setDocumentNonBlocking(shopRef, sanitizedValues, { merge: true });
        toast({ title: 'Perfil atualizado!', description: 'As informações do seu negócio foram salvas.' });
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
        setDocumentNonBlocking(shopRef, { workingHours: values.hours }, { merge: true });
        toast({ title: 'Horários atualizados!', description: 'Seu horário de funcionamento foi salvo.' });
    }

    const onHolidaysSubmit = (values: z.infer<typeof holidaysFormSchema>) => {
        const holidaysToSave = values.holidays.map(h => ({
            ...h,
            date: Timestamp.fromDate(h.date)
        }));
        setDocumentNonBlocking(shopRef, { holidays: holidaysToSave }, { merge: true });
        toast({ title: 'Feriados atualizados!', description: 'As datas foram salvas com sucesso.' });
    }

    const onPaymentSettingsSubmit = (values: z.infer<typeof paymentSettingsFormSchema>) => {
        setDocumentNonBlocking(shopRef, { paymentSettings: values.paymentMethods }, { merge: true });
        toast({ title: 'Recebimentos atualizados!', description: 'As formas de pagamento foram salvas.' });
    }


    const handleManageSubscription = async () => {
        setIsBillingLoading(true);
        try {
            const { checkoutUrl } = await createPayment({
                shopId: shopId,
                planId: 'pro',
                shopName: shop?.name || 'FlowCuts Pro',
                price: 79.90,
            });

            if (checkoutUrl) {
                router.push(checkoutUrl);
            } else {
                throw new Error('URL de checkout não foi retornada.');
            }
        } catch (error) {
            console.error("Erro ao criar preferência de pagamento:", error);
            toast({
                variant: 'destructive',
                title: 'Erro ao gerar pagamento',
                description: 'Não foi possível iniciar o processo de assinatura. Tente novamente mais tarde.',
            });
            setIsBillingLoading(false);
        }
    }
    
  const subscriptionStatus = shop?.subscription?.status || 'free';
  const planName = shop?.subscription?.plan === 'pro' ? 'Plano Pro' : 'Gratuito';
  const nextBillingDate = shop?.subscription?.currentPeriodEnd ? format(toDate(shop.subscription.currentPeriodEnd), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A';

  const paymentMethodLabels: { [key in z.infer<typeof paymentSettingsFormSchema>['paymentMethods'][number]['method']]: string } = {
    money: 'Dinheiro',
    pix: 'PIX',
    debit: 'Cartão de Débito',
    credit: 'Cartão de Crédito',
  };


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
            <TabsTrigger value="profile" className="data-[state=inactive]:text-muted-foreground data-[state=active]:text-foreground"><User className="mr-2 text-primary data-[state=active]:text-inherit" /> Perfil</TabsTrigger>
            <TabsTrigger value="address" className="data-[state=inactive]:text-muted-foreground data-[state=active]:text-inherit"><MapPin className="mr-2 text-primary data-[state=active]:text-inherit" /> Endereço</TabsTrigger>
            <TabsTrigger value="hours" className="data-[state=inactive]:text-muted-foreground data-[state=active]:text-inherit"><Clock className="mr-2 text-primary data-[state=active]:text-inherit" /> Horários</TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=inactive]:text-muted-foreground data-[state=active]:text-inherit"><Bot className="mr-2 text-primary data-[state=active]:text-inherit" /> Automação</TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=inactive]:text-muted-foreground data-[state=active]:text-foreground"><Wallet className="mr-2 text-primary data-[state=active]:text-inherit" /> Recebimentos</TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=inactive]:text-muted-foreground data-[state=active]:text-foreground"><CreditCard className="mr-2 text-primary data-[state=active]:text-inherit" /> Conta</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                    <CardHeader>
                        <CardTitle>Perfil do Negócio</CardTitle>
                        <CardDescription>
                            Atualize as informações públicas do seu negócio.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading ? <Skeleton className="h-40 w-full" /> : (
                            <>
                                <FormField
                                    control={profileForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label>Nome do Negócio</Label>
                                            <FormControl>
                                                <Input placeholder="Ex: Barbearia Corte Clássico" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="logo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label>URL da Logo</Label>
                                            <div className="relative">
                                                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <FormControl>
                                                    <Input placeholder="https://exemplo.com/logo.png" {...field} value={field.value || ''} className="pl-10"/>
                                                </FormControl>
                                            </div>
                                            <FormDescription>
                                                 No futuro, você poderá fazer o upload de uma imagem diretamente.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="document"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label>Documento (CNPJ/CPF)</Label>
                                            <FormControl>
                                                <Input placeholder="00.000.000/0001-00" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <div className="space-y-4 pt-4 border-t">
                                     <h3 className="text-lg font-medium">Contato e Redes Sociais</h3>
                                     <FormField
                                        control={profileForm.control}
                                        name="contactPerson"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Label>Nome do Responsável</Label>
                                                 <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <FormControl>
                                                        <Input placeholder="Ex: João da Silva" {...field} value={field.value || ''} className="pl-10" />
                                                    </FormControl>
                                                 </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={profileForm.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Label>Telefone Comercial</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <FormControl>
                                                        <Input placeholder="(11) 99999-8888" {...field} value={field.value || ''} className="pl-10" />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <FormField
                                            control={profileForm.control}
                                            name="instagram"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Label>Instagram</Label>
                                                    <div className="relative">
                                                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <FormControl>
                                                            <Input placeholder="@seu-negocio" {...field} value={field.value || ''} className="pl-10" />
                                                        </FormControl>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={profileForm.control}
                                            name="facebook"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Label>Facebook</Label>
                                                    <div className="relative">
                                                        <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <FormControl>
                                                            <Input placeholder="/seu-negocio" {...field} value={field.value || ''} className="pl-10" />
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
                                                            <Input placeholder="www.seunegocio.com.br" {...field} value={field.value || ''} className="pl-10" />
                                                        </FormControl>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                     </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                    <CardFooter>
                       <div className="flex justify-end w-full">
                            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                                {profileForm.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <FormField
                                        control={profileForm.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Label>Logradouro</Label>
                                                <FormControl>
                                                    <Input placeholder="Rua das Flores" {...field} value={field.value || ''} />
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
                                                    <Input placeholder="123" {...field} value={field.value || ''} />
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
                                                <Input placeholder="Apto 123, Bloco A" {...field} value={field.value || ''} className="pl-10" />
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
                                                <Input placeholder="Centro" {...field} value={field.value || ''} />
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
                                                <Input placeholder="São Paulo" {...field} value={field.value || ''} />
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
                                                <Input placeholder="SP" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <div className="flex justify-end w-full">
                                <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                                    {profileForm.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
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
                                <div key={field.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4">
                                    <div className="flex items-center gap-3">
                                        <FormField
                                            control={workingHoursForm.control}
                                            name={`hours.${index}.enabled`}
                                            render={({ field: checkboxField }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Checkbox checked={checkboxField.value} onCheckedChange={checkboxField.onChange} id={`check-${field.day.toLowerCase()}`} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <Label htmlFor={`check-${field.day.toLowerCase()}`} className="text-base font-medium min-w-[120px]">{field.day}</Label>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <FormField
                                            control={workingHoursForm.control}
                                            name={`hours.${index}.open`}
                                            render={({ field: inputField }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="time" {...inputField} className="w-full md:w-auto" disabled={!workingHoursForm.watch(`hours.${index}.enabled`)} />
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
                                                        <Input type="time" {...inputField} className="w-full md:w-auto" disabled={!workingHoursForm.watch(`hours.${index}.enabled`)} />
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
                                <Button type="submit" disabled={workingHoursForm.formState.isSubmitting}>
                                     {workingHoursForm.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Horários
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </form>
            </Form>

            <Form {...holidaysForm}>
                <form onSubmit={holidaysForm.handleSubmit(onHolidaysSubmit)}>
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Feriados e Datas Especiais</CardTitle>
                            <CardDescription>Gerencie dias com horários especiais ou em que o estabelecimento estará fechado.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {holidayFields.map((field, index) => {
                                const isClosed = holidaysForm.watch(`holidays.${index}.isClosed`);
                                return (
                                <div key={field.id} className="p-4 border rounded-lg space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <FormField
                                                control={holidaysForm.control}
                                                name={`holidays.${index}.description`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl><Input placeholder="Descrição (ex: Natal)" {...field} className="text-base font-medium border-0 shadow-none p-0 focus-visible:ring-0" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={holidaysForm.control}
                                                name={`holidays.${index}.date`}
                                                render={({ field: dateField }) => (
                                                     <p className="text-sm text-muted-foreground">{format(dateField.value, "PPP", { locale: ptBR })}</p>
                                                )}
                                            />
                                        </div>
                                         <Button type="button" variant="ghost" size="icon" onClick={() => removeHoliday(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t">
                                        <FormField
                                            control={holidaysForm.control}
                                            name={`holidays.${index}.isClosed`}
                                            render={({ field: switchField }) => (
                                                <FormItem className="flex items-center gap-2 space-y-0">
                                                    <FormControl><Switch checked={switchField.value} onCheckedChange={switchField.onChange} /></FormControl>
                                                    <FormLabel>{isClosed ? 'Fechado' : 'Aberto'}</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                        {!isClosed && (
                                            <div className="flex items-center gap-4">
                                                <FormField
                                                    control={holidaysForm.control}
                                                    name={`holidays.${index}.openingTime`}
                                                    render={({ field: inputField }) => <FormItem><FormControl><Input type="time" {...inputField} /></FormControl></FormItem>}
                                                />
                                                <span className="text-muted-foreground">às</span>
                                                <FormField
                                                    control={holidaysForm.control}
                                                    name={`holidays.${index}.closingTime`}
                                                    render={({ field: inputField }) => <FormItem><FormControl><Input type="time" {...inputField} /></FormControl></FormItem>}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )})}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendHoliday({ date: new Date(), description: 'Novo Ponto Facultativo', isClosed: true, openingTime: '09:00', closingTime: '17:00' })}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Adicionar Data
                            </Button>
                        </CardContent>
                        <CardFooter>
                            <div className="flex justify-end w-full">
                                <Button type="submit" disabled={holidaysForm.formState.isSubmitting}>
                                     {holidaysForm.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Datas
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
                                Configure a instância do WhatsApp e o comportamento do assistente de IA.
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
                                        Ative para que o assistente de IA responda no WhatsApp.
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
                                                <Input placeholder="Ex: 5511999998888" {...field} className="pl-10" />
                                            </FormControl>
                                        </div>
                                        <FormDescription>Este é o número de telefone que será usado para a conexão.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Alert variant="destructive">
                                <Shield className="h-4 w-4" />
                                <AlertTitle>Aviso Importante</AlertTitle>
                                <AlertDescription>
                                    A API utilizada não é oficial do WhatsApp, o que implica em um risco de banimento do número. Para uma solução 100% segura, oferecemos integração com a API oficial mediante consulta. <a href={`/dashboard/${shopId}/support`} className="font-bold underline">Fale com o suporte</a>.
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
                                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione um modelo" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="openai/gpt-oss-120b">GPT-o (Recomendado)</SelectItem>
                                                    <SelectItem value="llama-3.1-70b-versatile">Llama 3.1 70B</SelectItem>
                                                    <SelectItem value="gemma2-9b-it">Gemma2 9B</SelectItem>
                                                    <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
                                                    <SelectItem value="llama3-70b-8192">Llama3 70B</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>Modelos fornecidos pela Groq API.</FormDescription>
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
                                <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                                     {profileForm.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
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
                            Configure as formas de pagamento que seu negócio aceita no local e suas taxas.
                        </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {paymentMethodFields.map((field, index) => (
                                 <div key={field.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4">
                                    <FormField
                                        control={paymentSettingsForm.control}
                                        name={`paymentMethods.${index}.enabled`}
                                        render={({ field: checkboxField }) => (
                                            <FormItem className="flex items-center gap-3">
                                                <FormControl>
                                                    <Checkbox checked={checkboxField.value} onCheckedChange={checkboxField.onChange} id={`check-${field.method}`} />
                                                </FormControl>
                                                <Label htmlFor={`check-${field.method}`} className="text-base font-medium min-w-[140px]">{paymentMethodLabels[field.method]}</Label>
                                            </FormItem>
                                        )}
                                    />
                                    {(field.method === 'credit' || field.method === 'debit') && (
                                        <FormField
                                            control={paymentSettingsForm.control}
                                            name={`paymentMethods.${index}.rate`}
                                            render={({ field: inputField }) => (
                                                <FormItem>
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-sm text-muted-foreground">Taxa</Label>
                                                        <div className="relative">
                                                            <FormControl>
                                                                <Input type="number" {...inputField} value={inputField.value || 0} className="w-24 pl-8" disabled={!paymentSettingsForm.watch(`paymentMethods.${index}.enabled`)} />
                                                            </FormControl>
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
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
                                <Button type="submit" disabled={paymentSettingsForm.formState.isSubmitting}>
                                     {paymentSettingsForm.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Recebimentos
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </TabsContent>

        <TabsContent value="billing">
            <Card>
                <CardHeader>
                    <CardTitle>Conta e Assinatura</CardTitle>
                    <CardDescription>
                        Gerencie seu plano e visualize seu histórico de faturas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     <div className="pt-8 border-t">
                        <h3 className="text-lg font-medium">Plano e Assinatura</h3>
                        {isLoading ? <Skeleton className="h-24 w-full" /> : (
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg mt-4 gap-4">
                                <div>
                                    <div className="font-semibold">Plano Atual: <Badge variant={subscriptionStatus === 'active' ? 'default' : 'secondary'} className={cn(subscriptionStatus === 'active' && 'bg-green-500 hover:bg-green-500/90')}>{planName}</Badge></div>
                                    <p className="text-sm text-muted-foreground">
                                        {subscriptionStatus === 'active' ? `Sua assinatura está ativa. Próxima cobrança em ${nextBillingDate}.` : 'Você está no período de teste ou seu plano não está ativo.'}
                                    </p>
                                </div>
                                 <Button variant={subscriptionStatus === 'active' ? 'destructive' : 'outline'} onClick={handleManageSubscription} disabled={isBillingLoading}>
                                    {isBillingLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                    {subscriptionStatus === 'active' ? 'Cancelar Assinatura' : 'Fazer Upgrade para Pro'}
                                 </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
