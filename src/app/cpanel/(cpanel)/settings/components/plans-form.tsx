
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, LoaderCircle, Save, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Plan } from '@/lib/plans';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

export function PlansForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { control, register, handleSubmit, getValues, setValue } = useForm({
    defaultValues: {
      plans: [] as Plan[],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'plans',
    keyName: 'formId',
  });

  useEffect(() => {
    async function fetchPlans() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/plans');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setPlans(data.plans || []);
        setValue('plans', data.plans || []);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        toast({ title: 'Erro ao carregar planos', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlans();
  }, [setValue, toast]);

  const onSubmit = async (data: { plans: Plan[]}) => {
    setIsSubmitting(true);
    const batch = [];
    for (const plan of data.plans) {
        const ref = doc(firestore, 'platform', 'pricing', 'plans', plan.id);
        batch.push(setDocumentNonBlocking(ref, plan, { merge: true }));
    }
    
    // This is not a real batch, but will do for now
    try {
        await Promise.all(batch);
        toast({
            title: "Planos Atualizados!",
            description: "As informações dos planos foram salvas com sucesso."
        });
    } catch(e) {
        toast({
            variant: 'destructive',
            title: "Erro ao salvar",
            description: "Não foi possível salvar os planos."
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/3"/>
                <Skeleton className="h-4 w-2/3"/>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-40 w-full"/>
                <Skeleton className="h-10 w-32"/>
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-10 w-32 ml-auto"/>
            </CardFooter>
        </Card>
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Planos e Assinaturas</CardTitle>
          <CardDescription>
            Gerencie os planos disponíveis na sua plataforma. Os IDs de preço devem corresponder aos IDs da Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {fields.map((field, index) => (
              <Card key={field.id} className={cn("flex flex-col", getValues(`plans.${index}.isFeatured`) && "border-primary")}>
                <CardHeader>
                  <Input {...register(`plans.${index}.name`)} placeholder="Nome do Plano" className="text-lg font-bold" />
                  <Textarea {...register(`plans.${index}.description`)} placeholder="Descrição do plano" className="text-sm" />
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">R$</span>
                    <Input type="number" {...register(`plans.${index}.price`, { valueAsNumber: true })} placeholder="Preço" className="text-2xl font-bold w-32" />
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                   <div>
                    <label className="text-sm font-medium">ID do Preço (Stripe)</label>
                    <Input {...register(`plans.${index}.priceId`)} placeholder="price_..." className="font-mono text-xs" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id={`featured-${index}`} {...register(`plans.${index}.isFeatured`)} />
                    <label htmlFor={`featured-${index}`}>Plano em Destaque</label>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Funcionalidades (uma por linha)</label>
                    <Textarea {...register(`plans.${index}.features`, { setValueAs: (v) => v.split('\n') })} defaultValue={(field.features || []).join('\n')} rows={5} />
                  </div>
                </CardContent>
                <CardFooter>
                    <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 mr-2"/>
                        Remover Plano
                    </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
           <Button type="button" variant="outline" onClick={() => append({ id: `plano-${Date.now()}`, name: 'Novo Plano', description: '', price: 0, priceDetails: '/mês', features: [], isFeatured: false, priceId: '', metadata: {} })}>
              <PlusCircle className="h-4 w-4 mr-2"/>
              Adicionar Plano
           </Button>
        </CardContent>
        <CardFooter className="flex justify-end">
             <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Salvar Todos os Planos
              </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
