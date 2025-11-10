
'use client';

import React from 'react';
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
import { Save, LoaderCircle, AppWindow, Mail, Phone } from 'lucide-react';
import { useDoc, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

const formSchema = z.object({
  platformName: z.string().min(1, 'O nome da plataforma é obrigatório.'),
  supportEmail: z.string().email('Email de suporte inválido.'),
  emergencyPhone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function GeneralSettingsForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);

  const settingsRef = doc(firestore, 'platform', 'settings');
  const { data: initialData, isLoading } = useDoc<FormValues>(settingsRef);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: initialData || { // Use 'values' to make it controlled after loading
      platformName: 'BarberCut Bot',
      supportEmail: 'suporte@barbercutbot.com',
      emergencyPhone: '+55 (11) 98765-4321',
    },
    disabled: isLoading, // Disable form while loading initial data
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await setDocumentNonBlocking(settingsRef, values, { merge: true });
      toast({
        title: 'Configurações Salvas!',
        description: 'As configurações gerais da plataforma foram atualizadas.',
      });
      setLastSavedAt(new Date());
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Falha ao salvar',
        description: error?.message || 'Verifique suas permissões de administrador e tente novamente.'
      });
    }
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>
                  Informações globais que se aplicam a toda a plataforma.
                </CardDescription>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {isLoading && (
                  <span className="inline-flex items-center gap-1">
                    <LoaderCircle className="h-3 w-3 animate-spin" /> Carregando...
                  </span>
                )}
                {!isLoading && form.formState.isSubmitting && (
                  <span className="inline-flex items-center gap-1">
                    <LoaderCircle className="h-3 w-3 animate-spin" /> Salvando...
                  </span>
                )}
                {!isLoading && !form.formState.isSubmitting && lastSavedAt && (
                  <span>Salvo às {lastSavedAt.toLocaleTimeString()}</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="platformName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Plataforma</FormLabel>
                  <div className="relative">
                    <AppWindow className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        placeholder="Nome do seu SaaS"
                        {...field}
                        className="pl-10"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supportEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de Suporte</FormLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="suporte@seudominio.com"
                        {...field}
                        className="pl-10"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergencyPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone de Emergência</FormLabel>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        placeholder="+55 (11) 99999-9999"
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
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || isLoading}
            >
              {form.formState.isSubmitting && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
