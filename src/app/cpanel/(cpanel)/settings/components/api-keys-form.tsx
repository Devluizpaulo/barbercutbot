
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, LoaderCircle, Key, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const formSchema = z.object({
  stripeSecretKey: z.string().min(1, 'A chave secreta da Stripe é obrigatória.'),
  stripeWebhookSecret: z.string().min(1, 'O segredo do webhook é obrigatório.'),
  googleApiKey: z.string().min(1, 'A chave da API do Google é obrigatória.'),
});

type FormValues = z.infer<typeof formSchema>;

export function ApiKeysForm() {
  const { toast } = useToast();
  const [showKeys, setShowKeys] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    // Em um app real, esses valores viriam de um local seguro no backend
    // e nunca seriam expostos diretamente no cliente.
    defaultValues: {
      stripeSecretKey: process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY || '',
      stripeWebhookSecret: process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET || '',
      googleApiKey: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    // Em um cenário real, esta chamada iria para uma Cloud Function segura
    // que atualizaria as variáveis de ambiente do servidor.
    console.log('Saving keys to a secure backend location:', values);
    toast({
      title: 'Chaves de API Salvas!',
      description: 'As chaves foram enviadas para o backend com segurança.',
    });
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Chaves de API</CardTitle>
                <CardDescription>
                Gerencie as chaves de integração para serviços externos como Stripe e Google.
                </CardDescription>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => setShowKeys(!showKeys)}>
                {showKeys ? <EyeOff /> : <Eye />}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="stripeSecretKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stripe Secret Key</FormLabel>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type={showKeys ? 'text' : 'password'}
                        placeholder="sk_test_..."
                        {...field}
                        className="pl-10 font-mono"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="stripeWebhookSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stripe Webhook Secret</FormLabel>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type={showKeys ? 'text' : 'password'}
                        placeholder="whsec_..."
                        {...field}
                        className="pl-10 font-mono"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="googleApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google API Key (para IA e outros serviços)</FormLabel>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type={showKeys ? 'text' : 'password'}
                        placeholder="AIzaSy..."
                        {...field}
                        className="pl-10 font-mono"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Salvar Chaves
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
