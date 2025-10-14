
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Edit, LoaderCircle, Save } from 'lucide-react';
import { PLANS, Plan } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function PlansForm() {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEdit = (planId: string) => {
    setIsEditing(planId);
  };
  
  const handleSave = (planId: string) => {
    setIsLoading(true);
    // Simula uma chamada de API
    setTimeout(() => {
        setIsLoading(false);
        setIsEditing(null);
        toast({
            title: "Plano Atualizado!",
            description: `O plano ${planId} foi salvo com sucesso (simulação).`
        })
    }, 1000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planos e Assinaturas</CardTitle>
        <CardDescription>
          Visualize e gerencie os planos disponíveis na sua plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {PLANS.filter(p => p.id !== 'addon-ia').map((plan) => (
            <Card key={plan.id} className={cn("flex flex-col", plan.isFeatured && "border-primary")}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="h-12">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="flex items-baseline gap-2">
                  {isEditing === plan.id ? (
                      <input type="number" defaultValue={plan.price} className="text-4xl font-bold w-32 bg-transparent border-b-2"/>
                  ) : (
                    <span className="text-4xl font-bold">R${plan.price.toFixed(2)}</span>
                  )}
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                 {isEditing === plan.id ? (
                      <Button className="w-full" onClick={() => handleSave(plan.id)} disabled={isLoading}>
                          {isLoading && <LoaderCircle className="h-4 w-4 animate-spin mr-2"/>}
                          <Save className="h-4 w-4 mr-2"/>
                          Salvar
                      </Button>
                 ) : (
                     <Button variant="outline" className="w-full" onClick={() => handleEdit(plan.id)}>
                         <Edit className="h-4 w-4 mr-2" />
                         Editar Plano
                    </Button>
                 )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
