
'use client';

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
import { Save, LoaderCircle, Smartphone, Shield, MessageCircle, Bot } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import type { BarberShop } from '@/lib/types';
import { setDocumentNonBlocking, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

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

  const form = useForm<IntegrationsFormValues>({
    resolver: zodResolver(integrationsFormSchema),
    defaultValues: {
      whatsapp: initialData.whatsapp || { instanceId: shopId, numeroConectado: '' },
      bot: initialData.bot || {
        provider: 'groq',
        modelo: 'llama-3.1-70b-versatile',
        temperatura: 0.7,
        ativo: true,
        promptPersonalizado: '',
      },
    },
  });

  const onSubmit = (values: IntegrationsFormValues) => {
    const shopRef = doc(firestore, 'barberShops', shopId);
    setDocumentNonBlocking(shopRef, values, { merge: true });
    toast({
      title: 'Automação atualizada!',
      description: 'As configurações de IA e WhatsApp foram salvas.',
    });
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Automação e IA</CardTitle>
            <CardDescription>
              Configure a instância do WhatsApp e o comportamento do
              assistente de IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
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
              control={form.control}
              name="whatsapp.instanceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do WhatsApp (ID da Instância)</FormLabel>
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
                    <FormDescription>
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
                    <FormLabel>Criatividade (Temperatura)</FormLabel>
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
              <Button type="submit" disabled={form.formState.isSubmitting}>
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
