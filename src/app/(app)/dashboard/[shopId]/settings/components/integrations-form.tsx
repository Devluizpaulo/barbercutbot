
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, LoaderCircle, Smartphone, Shield, MessageCircle, Bot, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import type { BarberShop } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { setDocumentNonBlocking, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Plan } from '@/lib/plans';
import { createStripeCheckout } from '@/ai/flows/create-stripe-checkout-flow';

const integrationsFormSchema = z.object({
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

type IntegrationsFormValues = z.infer<typeof integrationsFormSchema>;

interface IntegrationsFormProps {
  shopId: string;
  initialData: BarberShop;
}

export function IntegrationsForm({ shopId, initialData }: IntegrationsFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const [plans, setPlans] = useState<Plan[]>([]);
  
  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch('/api/plans');
        if (!response.ok) throw new Error('Failed to fetch plans');
        const data = await response.json();
        setPlans(data.plans || []);
      } catch (error) {
        console.error("Error fetching plans:", error);
      }
    }
    fetchPlans();
  }, []);

  const form = useForm<IntegrationsFormValues>({
    resolver: zodResolver(integrationsFormSchema),
    defaultValues: {
      whatsapp: initialData.whatsapp || { instanceId: shopId, numeroConectado: '' },
      bot: initialData.bot || {
        provider: 'groq',
        modelo: 'llama-3.1-70b-versatile',
        temperatura: 0.7,
        ativo: false,
        promptPersonalizado: '',
      },
    },
  });

  const botActive = form.watch('bot.ativo');
  const connectedNumber = form.watch('whatsapp.numeroConectado');
  const [iaAvailable, setIaAvailable] = useState<boolean>(false);
  const [iaLoading, setIaLoading] = useState<boolean>(true);
  const [isBillingLoading, setIsBillingLoading] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form.formState.isDirty]);

  // Checar assinatura: Premium ou add-on IA ativo
  useEffect(() => {
    const load = async () => {
      try {
        setIaLoading(true);
        const res = await fetch(`/api/billing/subscriptions?shopId=${shopId}`);
        const data = await res.json();
        let hasAddon = false;
        let hasPremium = false;
        for (const s of data.subscriptions || []) {
          for (const it of s.items || []) {
            if (it.metadata?.tipo === 'addon') { hasAddon = true; break; }
            // Detecta Premium pelo priceId cadastrado em PLANS
            if (it.priceId === 'price_1SHntc4tLg09x1bmGIw5Aus3') { hasPremium = true; }
          }
          if (hasAddon && hasPremium) break;
        }
        setIaAvailable(!!(hasPremium || hasAddon));
      } catch (e) {
        setIaAvailable(false);
      } finally {
        setIaLoading(false);
      }
    };
    load();
  }, [shopId]);

  const onSubmit = (values: IntegrationsFormValues) => {
    const shopRef = doc(firestore, 'barberShops', shopId);
    setDocumentNonBlocking(shopRef, values, { merge: true });
    toast({
      title: 'Automação atualizada!',
      description: 'As configurações de IA e WhatsApp foram salvas.',
    });
  };

  const handleCheckout = async (planId: 'premium' | 'addon-ia') => {
    try {
      if (!user) {
        toast({ variant: 'destructive', title: 'Faça login', description: 'Você precisa estar autenticado para contratar.' });
        return;
      }
      const plan = plans.find(p => p.id === planId);
      if (!plan || !plan.priceId) {
        toast({ variant: 'destructive', title: 'Plano indisponível', description: 'Não foi possível localizar o plano selecionado.' });
        return;
      }
      setIsBillingLoading(true);
      const { checkoutUrl } = await createStripeCheckout({
        shopId,
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
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao iniciar contratação', description: 'Tente novamente em instantes.' });
    } finally {
      setIsBillingLoading(false);
    }
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Automação e IA</CardTitle>
              <div className="flex items-center gap-2">
                {!iaAvailable && !iaLoading && <Badge variant="secondary">Requer assinatura</Badge>}
                <Badge variant={botActive ? 'default' : 'secondary'}>{botActive ? 'Bot Ativo' : 'Bot Desativado'}</Badge>
              </div>
            </div>
            <CardDescription className="text-justify">
              Configure a instância do WhatsApp e o comportamento do
              assistente de IA.
            </CardDescription>
            {form.formState.isDirty && (
              <div className="mt-2 flex items-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-200">
                <AlertTriangle className="h-4 w-4" />
                <span>Alterações não salvas</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {!botActive && (
              <Alert>
                <AlertTitle>O robô está desativado</AlertTitle>
                <AlertDescription className="text-justify">
                  Enquanto desativado, mensagens no WhatsApp não receberão respostas automáticas.
                </AlertDescription>
              </Alert>
            )}
            {!iaAvailable && !iaLoading && (
              <Alert>
                <AlertTitle>Assinatura necessária</AlertTitle>
                <AlertDescription className="text-justify space-y-3">
                  <p>
                    Para ativar o robô, é preciso ter o plano <strong>Premium</strong> ou o add-on <strong>Assistente IA</strong> ativo.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleCheckout('premium')} disabled={isBillingLoading}>Assinar Premium</Button>
                    <Button variant="outline" onClick={() => handleCheckout('addon-ia')} disabled={isBillingLoading}>Adicionar Add-on IA</Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="bot.ativo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Robô Ativo</FormLabel>
                    <FormDescription className="text-justify">
                      Ative para que o assistente de IA responda no
                      WhatsApp.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!iaAvailable || iaLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="whatsapp.instanceId"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Número do WhatsApp (ID da Instância)</FormLabel>
                    <Badge variant={connectedNumber ? 'default' : 'secondary'}>
                      {connectedNumber ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
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
                  <FormDescription className="text-justify">
                    Este é o número de telefone que será usado para a conexão.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertTitle>Aviso Importante</AlertTitle>
              <AlertDescription className="text-justify">
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
              control={form.control}
              name="bot.promptPersonalizado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt do Assistente (IA)</FormLabel>
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
                control={form.control}
                name="bot.modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo de IA (Groq API)</FormLabel>
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
                    <FormDescription className="text-justify">
                      Modelos fornecidos pela Groq API.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bot.temperatura"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Criatividade (Temperatura)</FormLabel>
                      <div className="group relative">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <div className="absolute z-10 hidden group-hover:block w-64 p-2 text-xs rounded-md border bg-background shadow">
                          Valores baixos (0.1–0.3): respostas mais objetivas e consistentes.\nValores médios (0.4–0.7): equilíbrio entre criatividade e precisão.\nValores altos (0.8–1.0): respostas mais criativas e variadas.
                        </div>
                      </div>
                    </div>
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
                    <FormDescription className="text-justify text-xs">
                      Ajuste quanto o assistente pode variar as respostas.\nSugestões: 0.2 para mensagens padronizadas; 0.5 para atendimento equilibrado; 0.8 para tom mais criativo e descontraído.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-end w-full">
              <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
                {form.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Salvar Automação
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
