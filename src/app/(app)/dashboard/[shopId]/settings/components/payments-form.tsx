
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, LoaderCircle } from 'lucide-react';
import type { BarberShop } from '@/lib/types';
import { setDocumentNonBlocking, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

const paymentSettingsFormSchema = z.object({
  paymentMethods: z.array(
    z.object({
      method: z.enum(['money', 'pix', 'debit', 'credit']),
      enabled: z.boolean(),
      rate: z.coerce.number().min(0).optional(),
    })
  ),
});

type PaymentSettingsFormValues = z.infer<typeof paymentSettingsFormSchema>;

interface PaymentsFormProps {
  shopId: string;
  initialData: BarberShop;
}

const paymentMethodLabels: {
  [key in z.infer<typeof paymentSettingsFormSchema>['paymentMethods'][number]['method']]: string;
} = {
  money: 'Dinheiro',
  pix: 'PIX',
  debit: 'Cartão de Débito',
  credit: 'Cartão de Crédito',
};

export function PaymentsForm({ shopId, initialData }: PaymentsFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<PaymentSettingsFormValues>({
    resolver: zodResolver(paymentSettingsFormSchema),
    defaultValues: {
      paymentMethods: initialData.paymentSettings || [
        { method: 'money', enabled: true },
        { method: 'pix', enabled: true },
        { method: 'debit', enabled: false, rate: 2.5 },
        { method: 'credit', enabled: false, rate: 4.5 },
      ],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'paymentMethods',
  });

  const onSubmit = (values: PaymentSettingsFormValues) => {
    const shopRef = doc(firestore, 'barberShops', shopId);
    setDocumentNonBlocking(
      shopRef,
      { paymentSettings: values.paymentMethods },
      { merge: true }
    );
    toast({
      title: 'Recebimentos atualizados!',
      description: 'As formas de pagamento foram salvas.',
    });
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Meios de Recebimento</CardTitle>
            <CardDescription>
              Configure as formas de pagamento que seu negócio aceita no
              local e suas taxas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
              >
                <FormField
                  control={form.control}
                  name={`paymentMethods.${index}.enabled`}
                  render={({ field: checkboxField }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormControl>
                        <Checkbox
                          checked={checkboxField.value}
                          onCheckedChange={checkboxField.onChange}
                          id={`check-${field.method}`}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor={`check-${field.method}`}
                        className="text-base font-medium min-w-[140px]"
                      >
                        {paymentMethodLabels[field.method]}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {(field.method === 'credit' ||
                  field.method === 'debit') && (
                  <FormField
                    control={form.control}
                    name={`paymentMethods.${index}.rate`}
                    render={({ field: inputField }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel className="text-sm text-muted-foreground">
                            Taxa
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type="number"
                                {...inputField}
                                value={inputField.value || 0}
                                className="w-24 pl-8"
                                disabled={
                                  !form.watch(
                                    `paymentMethods.${index}.enabled`
                                  )
                                }
                              />
                            </FormControl>
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              %
                            </span>
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <div className="flex justify-end w-full">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Salvar Recebimentos
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
