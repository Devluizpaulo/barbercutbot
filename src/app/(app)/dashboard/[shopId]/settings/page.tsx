
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
import { Building, Clock, CreditCard, Link as LinkIcon, User, Trash2, Save, MapPin, Search } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { useParams } from 'next/navigation';
import { doc } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useEffect } from 'react';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

const profileFormSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  document: z.string().optional(),
  cep: z.string().optional(),
  address: z.string().optional(),
  number: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
});

const workingHoursFormSchema = z.object({
    hours: z.array(z.object({
        day: z.string(),
        open: z.string(),
        close: z.string(),
        enabled: z.boolean(),
    }))
});

export default function SettingsPage() {
    const params = useParams();
    const { toast } = useToast();
    const shopId = params.shopId as string;
    const firestore = useFirestore();

    const shopRef = useMemoFirebase(() => doc(firestore, 'barberShops', shopId), [firestore, shopId]);
    const { data: shop, isLoading } = useDoc<BarberShop>(shopRef);
    
    const profileForm = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: { name: '' },
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
            ]
        }
    });

    const { fields, replace } = useFieldArray({
        control: workingHoursForm.control,
        name: "hours",
    });

    useEffect(() => {
        if (shop) {
            profileForm.reset({
                name: shop.name,
                document: shop.document || '',
                address: shop.address || '',
            });
             if (shop.workingHours) {
                const currentHours = workingHoursForm.getValues('hours').map(daySetting => {
                    const savedDay = shop.workingHours?.find(h => h.day === daySetting.day);
                    return savedDay || daySetting;
                });
                replace(currentHours);
            }
        }
    }, [shop, profileForm, workingHoursForm, replace]);

    const onProfileSubmit = (values: z.infer<typeof profileFormSchema>) => {
        setDocumentNonBlocking(shopRef, values, { merge: true });
        toast({ title: 'Perfil atualizado!', description: 'As informações da sua barbearia foram salvas.' });
    };

    const onHoursSubmit = (values: z.infer<typeof workingHoursFormSchema>) => {
        setDocumentNonBlocking(shopRef, { workingHours: values.hours }, { merge: true });
        toast({ title: 'Horários atualizados!', description: 'Seu horário de funcionamento foi salvo.' });
    }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Configurações da Barbearia
        </h1>
        <p className="text-muted-foreground">
          Gerencie as informações e preferências da sua loja.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 mb-6">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="hours">Horários</TabsTrigger>
          <TabsTrigger value="payment">Pagamentos</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                    <CardHeader>
                        <CardTitle>Perfil da Barbearia</CardTitle>
                        <CardDescription>
                            Atualize as informações públicas da sua barbearia.
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
                                            <Label>Nome da Barbearia</Label>
                                            <FormControl>
                                                <Input placeholder="Ex: Barbearia Corte Clássico" {...field} />
                                            </FormControl>
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
                                                <Input placeholder="00.000.000/0001-00" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="text-lg font-medium">Endereço</h3>
                                    <FormField
                                        control={profileForm.control}
                                        name="cep"
                                        render={({ field }) => (
                                            <FormItem>
                                                 <div className="flex items-center gap-2">
                                                    <div className="relative flex-grow">
                                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <FormControl>
                                                            <Input placeholder="00000-000" {...field} className="pl-10" />
                                                        </FormControl>
                                                    </div>
                                                    <Button type="button" variant="secondary">
                                                        <Search className="h-4 w-4" />
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
                                                            <Input placeholder="Rua das Flores" {...field} />
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
                                                            <Input placeholder="123" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <FormField
                                                control={profileForm.control}
                                                name="neighborhood"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label>Bairro</Label>
                                                        <FormControl>
                                                            <Input placeholder="Centro" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div>
                                            <FormField
                                                control={profileForm.control}
                                                name="city"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label>Cidade</Label>
                                                        <FormControl>
                                                            <Input placeholder="São Paulo" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                    <CardContent>
                       <div className="flex justify-end pt-4">
                            <Button type="submit">
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Alterações
                            </Button>
                        </div>
                    </CardContent>
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
                            Defina os horários em que sua barbearia está aberta.
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
                        <CardContent>
                            <div className="flex justify-end pt-4">
                                <Button type="submit">
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Horários
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </TabsContent>

        <TabsContent value="payment">
            <Card>
                <CardHeader>
                    <CardTitle>Pagamentos</CardTitle>
                    <CardDescription>
                        Configure as formas de pagamento aceitas e gerencie sua assinatura.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     <div>
                        <h3 className="text-lg font-medium mb-4">Formas de Pagamento Aceitas</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Pix'].map(method => (
                                <div key={method} className="flex items-center space-x-2">
                                <Checkbox id={method.toLowerCase()} defaultChecked />
                                <Label htmlFor={method.toLowerCase()}>{method}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="pt-8 border-t">
                        <h3 className="text-lg font-medium">Plano e Assinatura</h3>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg mt-4 gap-4">
                            <div>
                                <p className="font-semibold">Plano Atual: <span className="text-primary">Pro</span></p>
                                <p className="text-sm text-muted-foreground">Sua próxima cobrança será em 15 de Agosto de 2024.</p>
                            </div>
                            <Button variant="outline">Gerenciar Assinatura</Button>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Configurações de Pagamento
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>
                Conecte sua conta a outros serviços para automatizar tarefas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                         <div className="flex-shrink-0 bg-gray-100 p-2 rounded-full">
                            <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                            </svg>
                         </div>
                        <div>
                            <h4 className="font-semibold">Google Agenda</h4>
                            <p className="text-sm text-muted-foreground">Sincronize os agendamentos da plataforma com sua Google Agenda.</p>
                        </div>
                    </div>
                    <Button variant="secondary">Conectar</Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
              <CardDescription>
                Ações irreversíveis relacionadas à sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                    <div>
                        <h4 className="font-semibold text-destructive">Excluir Conta</h4>
                        <p className="text-sm text-destructive/80">Isto irá apagar permanentemente todos os dados da sua barbearia.</p>
                    </div>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir Minha Conta
                    </Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

