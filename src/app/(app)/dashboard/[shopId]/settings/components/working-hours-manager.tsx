
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

const workingHoursFormSchema = z.object({
  hours: z.array(
    z.object({
      day: z.string(),
      open: z.string(),
      close: z.string(),
      enabled: z.boolean(),
    })
  ),
});

type WorkingHoursFormValues = z.infer<typeof workingHoursFormSchema>;

interface WorkingHoursManagerProps {
  shopId: string;
  initialData: BarberShop;
}

export function WorkingHoursManager({ shopId, initialData }: WorkingHoursManagerProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<WorkingHoursFormValues>({
    resolver: zodResolver(workingHoursFormSchema),
    defaultValues: {
      hours: initialData.workingHours || [
        { day: 'Segunda-feira', open: '09:00', close: '19:00', enabled: true },
        { day: 'Terça-feira', open: '09:00', close: '19:00', enabled: true },
        { day: 'Quarta-feira', open: '09:00', close: '19:00', enabled: true },
        { day: 'Quinta-feira', open: '09:00', close: '19:00', enabled: true },
        { day: 'Sexta-feira', open: '09:00', close: '19:00', enabled: true },
        { day: 'Sábado', open: '09:00', close: '17:00', enabled: true },
        { day: 'Domingo', open: '09:00', close: '19:00', enabled: false },
      ],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'hours',
  });

  const onSubmit = (values: WorkingHoursFormValues) => {
    const shopRef = doc(firestore, 'barberShops', shopId);
    setDocumentNonBlocking(shopRef, { workingHours: values.hours }, { merge: true });
    toast({
      title: 'Horários atualizados!',
      description: 'Seu horário de funcionamento foi salvo.',
    });
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Horários de Funcionamento</CardTitle>
            <CardDescription>
              Defina os horários em que seu negócio está aberto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
              >
                <div className="flex items-center gap-3">
                  <FormField
                    control={form.control}
                    name={`hours.${index}.enabled`}
                    render={({ field: checkboxField }) => (
                      <FormItem>
                        <FormControl>
                          <Checkbox
                            checked={checkboxField.value}
                            onCheckedChange={checkboxField.onChange}
                            id={`check-${field.day.toLowerCase()}`}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormLabel
                    htmlFor={`check-${field.day.toLowerCase()}`}
                    className="text-base font-medium min-w-[120px]"
                  >
                    {field.day}
                  </FormLabel>
                </div>
                <div className="flex items-center gap-4">
                  <FormField
                    control={form.control}
                    name={`hours.${index}.open`}
                    render={({ field: inputField }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="time"
                            {...inputField}
                            className="w-full md:w-auto"
                            disabled={
                              !form.watch(
                                `hours.${index}.enabled`
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <span className="text-muted-foreground">às</span>
                  <FormField
                    control={form.control}
                    name={`hours.${index}.close`}
                    render={({ field: inputField }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="time"
                            {...inputField}
                            className="w-full md:w-auto"
                            disabled={
                              !form.watch(
                                `hours.${index}.enabled`
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
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
                Salvar Horários
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
