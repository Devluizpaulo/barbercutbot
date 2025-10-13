
'use client';
// This file was created by the AI assistant.
// It is intended to handle the logic for managing holidays in the settings page.
// The code is structured to be modular and reusable.
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PlusCircle, Trash2, Calendar as CalendarIcon, Save, LoaderCircle } from 'lucide-react';
import type { BarberShop } from '@/lib/types';
import { setDocumentNonBlocking, useFirestore } from '@/firebase';
import { doc, Timestamp } from 'firebase/firestore';

const holidaySchema = z.object({
  date: z.date(),
  description: z.string().min(1, 'A descrição é obrigatória.'),
  isClosed: z.boolean(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
});

const holidaysFormSchema = z.object({
  holidays: z.array(holidaySchema),
});

type HolidaysFormValues = z.infer<typeof holidaysFormSchema>;

interface HolidaysManagerProps {
  shopId: string;
  initialData?: BarberShop['holidays'];
}

export function HolidaysManager({ shopId, initialData }: HolidaysManagerProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);

  const toDate = (timestamp: any): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  };

  const form = useForm<HolidaysFormValues>({
    resolver: zodResolver(holidaysFormSchema),
    defaultValues: {
      holidays: initialData?.map(h => ({...h, date: toDate(h.date)})) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'holidays',
  });

  const onSubmit = (values: HolidaysFormValues) => {
    const shopRef = doc(firestore, 'barberShops', shopId);
    
    // Convert dates back to Timestamps for Firestore
    const dataToSave = values.holidays.map(h => ({
        ...h,
        date: Timestamp.fromDate(h.date),
    }));
    
    setDocumentNonBlocking(shopRef, { holidays: dataToSave }, { merge: true });
    toast({
      title: 'Feriados atualizados!',
      description: 'A lista de feriados e datas especiais foi salva.',
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Gerenciar Feriados</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Feriados e Datas Especiais</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="max-h-[50vh] overflow-y-auto space-y-4 p-1">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-start">
                    <FormField
                      control={form.control}
                      name={`holidays.${index}.date`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={'outline'}
                                  className={cn(
                                    'w-[240px] pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP', { locale: ptBR })
                                  ) : (
                                    <span>Escolha uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`holidays.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Feriado de Ano Novo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`holidays.${index}.isClosed`}
                    render={({ field: checkboxField }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={checkboxField.value}
                            onCheckedChange={checkboxField.onChange}
                          />
                        </FormControl>
                        <FormLabel>
                          Fechado o dia todo
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {!form.watch(`holidays.${index}.isClosed`) && (
                     <div className="flex items-center gap-4">
                        <FormField
                            control={form.control}
                            name={`holidays.${index}.openingTime`}
                            render={({ field: inputField }) => (
                            <FormItem>
                                <FormLabel className="text-sm">Abre</FormLabel>
                                <FormControl>
                                <Input
                                    type="time"
                                    {...inputField}
                                />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`holidays.${index}.closingTime`}
                            render={({ field: inputField }) => (
                            <FormItem>
                                 <FormLabel className="text-sm">Fecha</FormLabel>
                                <FormControl>
                                <Input
                                    type="time"
                                    {...inputField}
                                />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                     </div>
                  )}

                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ date: new Date(), description: '', isClosed: true, openingTime: '09:00', closingTime: '18:00' })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Data
            </Button>
            
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Salvar Feriados
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
