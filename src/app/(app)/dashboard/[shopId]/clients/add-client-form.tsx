'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
import { LoaderCircle, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
  firstName: z.string().min(1, { message: 'O nome é obrigatório.' }),
  lastName: z.string().min(1, { message: 'O sobrenome é obrigatório.' }),
  nickname: z.string().optional(),
  email: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
  phone: z.string().optional(),
  whatsapp: z.string().min(1, { message: 'O WhatsApp é obrigatório.' }),
  notes: z.string().optional(),
  cep: z.string().optional(),
  address: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

type AddClientFormValues = z.infer<typeof formSchema>;

interface AddClientFormProps {
  shopId: string;
  onSuccess?: () => void;
}

export function AddClientForm({ shopId, onSuccess }: AddClientFormProps) {
  const { toast } = useToast();
  const [isCepLoading, setIsCepLoading] = useState(false);

  const form = useForm<AddClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      nickname: '',
      email: '',
      phone: '',
      whatsapp: '',
      notes: '',
      cep: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    },
  });

  const { isSubmitting } = form.formState;

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


  const onSubmit = async (values: AddClientFormValues) => {
    // NOTE: Database functionality is disabled for simulation.
    console.log("Simulating add client:", values);
    toast({
      title: 'Modo de Simulação',
      description: 'Funcionalidade de adicionar cliente desabilitada.',
    });
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs defaultValue="main">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="main">Informações Principais</TabsTrigger>
            <TabsTrigger value="address">Endereço (Opcional)</TabsTrigger>
          </TabsList>
          <TabsContent value="main" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="João" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apelido</FormLabel>
                    <FormControl>
                      <Input placeholder="Jão" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="joao.silva@email.com" {...field} />
                  </FormControl>
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
                    <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
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
                    <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cliente prefere corte na tesoura..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          <TabsContent value="address" className="mt-4 space-y-4">
            <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <div className="flex items-center gap-2">
                        <FormControl>
                            <Input placeholder="00000-000" {...field} />
                        </FormControl>
                        <Button type="button" onClick={handleCepLookup} disabled={isCepLoading}>
                            {isCepLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            <span className="ml-2 hidden sm:inline">Buscar</span>
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
                    <FormControl>
                    <Input placeholder="Rua das Flores" {...field} />
                    </FormControl>
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
                        <FormControl>
                        <Input placeholder="123" {...field} />
                        </FormControl>
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
                        <FormControl>
                        <Input placeholder="Apto 4B" {...field} />
                        </FormControl>
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
                        <Input placeholder="Centro" {...field} />
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
                        <Input placeholder="São Paulo" {...field} />
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
                        <Input placeholder="SP" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar Cliente
          </Button>
        </div>
      </form>
    </Form>
  );
}
