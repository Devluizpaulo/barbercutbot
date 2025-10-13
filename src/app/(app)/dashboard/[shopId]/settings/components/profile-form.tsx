
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Save, LoaderCircle, Building2, ImageIcon, Phone, Hash, Instagram, Globe } from 'lucide-react';
import type { BarberShop } from '@/lib/types';
import { setDocumentNonBlocking, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

const profileFormSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  logo: z.string().url('URL da logo inválida.').optional().or(z.literal('')),
  document: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  website: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  shopId: string;
  initialData: BarberShop;
}

export function ProfileForm({ shopId, initialData }: ProfileFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: initialData.name || '',
      logo: initialData.logo || '',
      document: initialData.document || '',
      contactPerson: initialData.contactPerson || '',
      phone: initialData.phone || '',
      instagram: initialData.instagram || '',
      facebook: initialData.facebook || '',
      website: initialData.website || '',
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    const shopRef = doc(firestore, 'barberShops', shopId);
    const sanitizedValues = {
      ...values,
      logo: values.logo || '',
      document: values.document || '',
      contactPerson: values.contactPerson || '',
      phone: values.phone || '',
      instagram: values.instagram || '',
      facebook: values.facebook || '',
      website: values.website || '',
    };
    setDocumentNonBlocking(shopRef, sanitizedValues, { merge: true });
    toast({
      title: 'Perfil atualizado!',
      description: 'As informações do seu negócio foram salvas.',
    });
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Perfil do Negócio</CardTitle>
            <CardDescription>
              Informações que seus clientes verão sobre sua barbearia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="space-y-2">
                <FormLabel>Logo</FormLabel>
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={form.watch('logo')}
                    alt={form.watch('name')}
                  />
                  <AvatarFallback>
                    <Building2 />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 space-y-4">
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Logo</FormLabel>
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
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Negócio</FormLabel>
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
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone para Contato</FormLabel>
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
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ / CPF</FormLabel>
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
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
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
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
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
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
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
  );
}
