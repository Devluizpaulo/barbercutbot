
'use client';

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
import { Save, Trash2, Bot, Palette, CreditCard as CreditCardIcon, FileText, Key, LoaderCircle, User, Settings, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useState } from 'react';


const paymentFormSchema = z.object({
  publicKey: z.string().min(1, "A Public Key é obrigatória."),
  accessToken: z.string().min(1, "O Access Token é obrigatório."),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;


export default function GlobalSettingsPage() {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const paymentForm = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentFormSchema),
        // Aqui você buscaria as credenciais salvas do banco de dados
        defaultValues: {
            publicKey: '',
            accessToken: '',
        }
    });

    const onPaymentSubmit = (values: PaymentFormValues) => {
        setIsSaving(true);
        console.log("Salvando credenciais do Mercado Pago:", values);
        // Aqui iria a lógica para salvar as credenciais de forma segura no backend/Firestore
        setTimeout(() => {
            toast({
                title: "Credenciais Salvas!",
                description: "Suas credenciais do Mercado Pago foram atualizadas com sucesso.",
            });
            setIsSaving(false);
        }, 1000);
    };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Configurações da Plataforma
        </h1>
        <p className="text-muted-foreground">
          Gerencie as configurações globais do SaaS.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-8">
          <TabsTrigger value="general"><Settings className="mr-2" /> Geral</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="mr-2" /> Aparência</TabsTrigger>
          <TabsTrigger value="billing"><CreditCardIcon className="mr-2" /> Pagamentos</TabsTrigger>
          <TabsTrigger value="advanced"><Shield className="mr-2" /> Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Informações básicas sobre a sua plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Nome da Plataforma</Label>
                <Input id="platform-name" defaultValue="Barbearia SaaS" />
              </div>
              <div className="flex justify-end pt-4">
                <Button><Save className="mr-2 h-4 w-4" />Salvar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette /> Aparência</CardTitle>
              <CardDescription>
                Personalize as cores e o logo da plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Cor Primária</Label>
                <div className="flex items-center gap-2">
                    <Input type="color" defaultValue="#6d28d9" className="w-12 h-10 p-1" />
                    <Input defaultValue="#6d28d9" />
                </div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="logo-upload">Logo da Plataforma</Label>
                <Input id="logo-upload" type="file" />
              </div>
               <div className="flex justify-end pt-4">
                <Button><Save className="mr-2 h-4 w-4" />Salvar Aparência</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
            <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle  className="flex items-center gap-2"><CreditCardIcon /> Pagamentos</CardTitle>
                            <CardDescription>
                                Integre com o Mercado Pago para gerenciar as assinaturas das barbearias.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/30">
                                <img src="https://logopng.com.br/logos/mercado-pago-24.svg" alt="Mercado Pago Logo" className="h-10 w-10 mt-1" />
                                <div>
                                    <h4 className="font-semibold">Integração com Mercado Pago</h4>
                                    <p className="text-sm text-muted-foreground">Insira suas credenciais de produção para começar a aceitar pagamentos.</p>
                                </div>
                            </div>
                            <FormField
                                control={paymentForm.control}
                                name="publicKey"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Public Key</Label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <FormControl>
                                                <Input type="password" placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" {...field} className="pl-10" />
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={paymentForm.control}
                                name="accessToken"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Access Token</Label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <FormControl>
                                                <Input type="password" placeholder="APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" {...field} className="pl-10" />
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardContent>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Credenciais
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </TabsContent>

        <TabsContent value="advanced">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
              <CardDescription>
                Ações irreversíveis relacionadas à plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                    <div>
                        <h4 className="font-semibold text-destructive">Resetar a Plataforma</h4>
                        <p className="text-sm text-destructive/80">Isto irá apagar TODAS as barbearias e dados de usuários.</p>
                    </div>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Resetar Plataforma
                    </Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
