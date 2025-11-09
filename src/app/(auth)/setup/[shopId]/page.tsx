
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';

import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, setDocumentNonBlocking, useUser, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';
import { LoaderCircle, Building, MapPin, Phone, CreditCard, PartyPopper, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const steps = [
  { id: 'Step 1', name: 'Nome do Negócio', fields: ['name'], icon: Building },
  { id: 'Step 2', name: 'Seu Perfil', fields: ['barberName'], icon: UserIcon },
  { id: 'Step 3', name: 'Endereço', fields: ['cep', 'address', 'number'], icon: MapPin },
  { id: 'Step 4', name: 'Contato', fields: ['phone'], icon: Phone },
  { id: 'Step 5', name: 'Pagamentos', fields: ['paymentMethods'], icon: CreditCard },
  { id: 'Step 6', 'name': 'Conclusão', 'icon': PartyPopper },
];

const setupSchema = z.object({
  name: z.string().min(3, 'O nome do negócio deve ter pelo menos 3 caracteres.'),
  barberName: z.string().min(2, 'O nome do barbeiro é obrigatório.'),
  cep: z.string().optional(),
  address: z.string().optional(),
  number: z.string().optional(),
  phone: z.string().optional(),
  paymentMethods: z.array(z.string()).optional(),
});

type SetupFormValues = z.infer<typeof setupSchema>;

function SetupFormComponent({ shop, user }: { shop: BarberShop; user: any }) {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: shop.name || '',
      barberName: user.displayName || '',
      cep: shop.cep || '',
      address: shop.address || '',
      number: shop.number || '',
      phone: user.phoneNumber || shop.phone || '',
      paymentMethods: shop.paymentSettings?.filter(p => p.enabled).map(p => p.method) || ['money', 'pix'],
    },
  });

  const { trigger, handleSubmit } = form;

  const next = async () => {
    const fields = steps[currentStep].fields;
    const output = await trigger(fields as any, { shouldFocus: true });
    if (!output) return;

    if (currentStep < steps.length - 1) {
      if (currentStep === steps.length - 2) {
        await handleSubmit(onSubmit)();
      } else {
        setCurrentStep(step => step + 1);
      }
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(step => step - 1);
    }
  };

  const onSubmit = async (values: SetupFormValues) => {
    try {
      const paymentSettings = [
        { method: 'money', enabled: values.paymentMethods?.includes('money') ?? false },
        { method: 'pix', enabled: values.paymentMethods?.includes('pix') ?? false },
        { method: 'debit', enabled: values.paymentMethods?.includes('debit') ?? false, rate: 2.5 },
        { method: 'credit', enabled: values.paymentMethods?.includes('credit') ?? false, rate: 4.5 },
      ];

      const shopRef = doc(firestore, 'barberShops', shop.id);
      await setDocumentNonBlocking(shopRef, {
        name: values.name,
        cep: values.cep,
        address: values.address,
        number: values.number,
        phone: values.phone,
        paymentSettings: paymentSettings,
        isSetupComplete: true
      }, { merge: true });

      const barbersRef = collection(firestore, 'barberShops', shop.id, 'barbers');
      const [firstName, ...lastNameParts] = values.barberName.split(' ');
      const lastName = lastNameParts.join(' ');
      
      await addDocumentNonBlocking(barbersRef, {
        barberShopId: shop.id,
        firstName,
        lastName: lastName || '.',
        email: user.email,
        phone: values.phone || '',
        services: [],
        createdAt: serverTimestamp(),
      });
      
      if (currentStep === steps.length - 2) {
        setCurrentStep(step => step + 1);
      }
    } catch (error) {
      console.error("Failed to save setup data:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Não foi possível salvar suas configurações. Tente novamente."
      });
    }
  };

  const finishOnboarding = () => {
    toast({
      title: "Configuração Concluída!",
      description: "Seu negócio está pronto para decolar."
    });
    router.push(`/dashboard/${shop.id}`);
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Configure seu Negócio</CardTitle>
        <CardDescription>Vamos deixar tudo pronto para você começar.</CardDescription>
        <Progress value={(currentStep / (steps.length - 1)) * 100} className="mt-4" />
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 0 && (
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da sua Barbearia</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Ex: Barbearia do Zé" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                {currentStep === 1 && (
                  <FormField control={form.control} name="barberName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seu Nome na Agenda</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Como você quer ser chamado na agenda?" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <p className="text-sm text-muted-foreground pt-2">Você poderá adicionar mais barbeiros depois no painel de equipe.</p>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormField control={form.control} name="cep" render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="00000-000" {...field} value={field.value || ''} className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl><Input placeholder="Rua das Flores" {...field} value={field.value || ''}/></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="number" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl><Input placeholder="123" {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}
                {currentStep === 3 && (
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone Principal para Contato</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="(11) 99999-9999" {...field} value={field.value || ''} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                {currentStep === 4 && (
                  <FormField control={form.control} name="paymentMethods" render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Formas de Pagamento</FormLabel>
                        <p className="text-sm text-muted-foreground">Selecione os meios que você aceita.</p>
                      </div>
                      {['money', 'pix', 'debit', 'credit'].map((item) => (
                        <FormField key={item} control={form.control} name="paymentMethods" render={({ field }) => (
                          <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-md">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), item])
                                    : field.onChange(field.value?.filter((value) => value !== item))
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal capitalize">{item === 'money' ? 'Dinheiro' : item}</FormLabel>
                          </FormItem>
                        )} />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                {currentStep === 5 && (
                  <div className="text-center space-y-4 py-8">
                    <PartyPopper className="h-16 w-16 text-primary mx-auto animate-bounce"/>
                    <h2 className="text-2xl font-bold font-headline">Tudo Pronto!</h2>
                    <p className="text-muted-foreground">Você configurou o básico. Agora é hora de explorar a plataforma e ver seu negócio crescer.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="flex gap-4 justify-end pt-8">
              {currentStep > 0 && currentStep < steps.length - 1 && (
                <Button type="button" variant="secondary" onClick={prev}>
                  Voltar
                </Button>
              )}
              {currentStep < steps.length - 2 && (
                <Button type="button" onClick={next}>
                  Avançar
                </Button>
              )}
              {currentStep === steps.length - 2 && (
                <Button type="button" onClick={next}>
                  Finalizar Configuração
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button type="button" onClick={finishOnboarding}>
                  Ir para o Dashboard
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function OnboardingPage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const shopRef = doc(firestore, 'barberShops', shopId);
  const { data: shop, isLoading: isShopLoading } = useDoc<BarberShop>(shopRef);

  if (isUserLoading || isShopLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  if (!shop || !user) {
    return (
         <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <CardTitle className="text-destructive">Erro</CardTitle>
                    <CardDescription>Não foi possível carregar as informações do negócio ou do usuário.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4">
      <SetupFormComponent shop={shop} user={user} />
    </div>
  );
}
