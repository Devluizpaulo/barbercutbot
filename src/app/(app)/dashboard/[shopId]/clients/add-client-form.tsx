
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Mail,
  Map,
  MapPin,
  PenSquare,
  Phone,
  Search,
  Smile,
  User,
  Hash,
  LoaderCircle,
  Smartphone,
} from 'lucide-react';
import { collection, serverTimestamp } from 'firebase/firestore';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { Customer } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const formSchema = z.object({
  firstName: z.string().min(1, { message: 'O nome é obrigatório.' }),
  lastName: z.string().min(1, { message: 'O sobrenome é obrigatório.' }),
  nickname: z.string().optional(),
  email: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
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
  initialData?: Customer;
  onSuccess?: () => void;
}

export function AddClientForm({ shopId, initialData, onSuccess }: AddClientFormProps) {
  const { toast } = useToast();
  const [isCepLoading, setIsCepLoading] = useState(false);
  const firestore = useFirestore();

  const form = useForm<AddClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          nickname: initialData.nickname || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          whatsapp: initialData.whatsapp || '',
          notes: initialData.notes || '',
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
    try {
      const customersRef = collection(firestore, 'barberShops', shopId, 'customers');
      await addDocumentNonBlocking(customersRef, {
        ...values,
        barberShopId: shopId,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Cliente Adicionado!',
        description: `O cliente ${values.firstName} foi salvo com sucesso.`,
      });
      onSuccess?.();
      form.reset();
    } catch (error) {
       console.error('Error saving client:', error);
       toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Ocorreu um problema ao salvar o cliente.',
      });
    }
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
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apelido</FormLabel>
                    <div className="relative">
                       <Smile className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="Jão" {...field} value={field.value || ''} className="pl-10" />
                      </FormControl>
                    </div>
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
                   <div className="relative">
                       <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="joao.silva@email.com" {...field} value={field.value || ''} className="pl-10" />
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
                              <Input placeholder="(11) 99999-9999" {...field} value={field.value || ''} className="pl-10" />
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
                            <Input placeholder="(11) 99999-9999" {...field} className="pl-10" value={field.value || ''} />
                        </FormControl>
                      </div>
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
                  <div className="relative">
                    <PenSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Textarea
                        placeholder="Cliente prefere corte na tesoura..."
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
          </TabsContent>
          <TabsContent value="address" className="mt-4 space-y-4">
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
                        <div className="relative">
                            <Map className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                            <Input placeholder="Centro" {...field} value={field.value || ''} className="pl-10" />
                            </FormControl>
                        </div>
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
                         <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                            <Input placeholder="São Paulo" {...field} value={field.value || ''} className="pl-10" />
                            </FormControl>
                        </div>
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
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                            <Input placeholder="SP" {...field} value={field.value || ''} className="pl-10" />
                            </FormControl>
                        </div>
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
            {initialData ? 'Salvar Alterações' : 'Salvar Cliente'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
