
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  LoaderCircle,
  PenSquare,
  Scissors,
  User,
  Users,
  PlusCircle,
  Phone,
  Trash2,
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Appointment, Customer, Barber, Service, AppointmentItem } from '@/lib/types';
import { useEffect, useMemo, useState } from 'react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { collection, Timestamp, doc, serverTimestamp, addDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { TimeSlotPicker } from './time-slot-picker';

const quickAddClientSchema = z.object({
  firstName: z.string().min(1, 'O nome é obrigatório.'),
  phone: z.string().optional(),
});

const appointmentItemSchema = z.object({
  serviceId: z.string().min(1, 'Selecione um serviço.'),
  barberId: z.string().min(1, 'Selecione um barbeiro.'),
  price: z.number(),
  duration: z.number(),
});

const appointmentFormSchema = z.object({
  customerId: z.string().min(1, 'Selecione um cliente.'),
  date: z.date({
    required_error: 'A data é obrigatória.',
  }),
  time: z.string().min(1, { message: 'Selecione um horário.' }),
  notes: z.string().optional(),
  status: z
    .enum(['pending', 'confirmed', 'completed', 'cancelled', 'no-show'])
    .default('confirmed'),
  items: z.array(appointmentItemSchema).min(1, 'Adicione pelo menos um serviço.'),
});


type AddAppointmentFormValues = z.infer<typeof appointmentFormSchema>;
type QuickAddClientFormValues = z.infer<typeof quickAddClientSchema>;

interface AddAppointmentFormProps {
  shopId: string;
  initialData?: Appointment;
  onSuccess?: () => void;
}

export function AddAppointmentForm({
  shopId,
  initialData,
  onSuccess,
}: AddAppointmentFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();

  const [isClientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [isQuickAddClientOpen, setQuickAddClientOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [availableServices, setAvailableServices] = useState<Service[] | null>(null);
  const [availableBarbers, setAvailableBarbers] = useState<Barber[] | null>(null);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    async function loadLists() {
      try {
        if (!auth?.currentUser) {
          setCustomers([]); setAvailableServices([]); setAvailableBarbers([]); setIsLoadingCustomers(false);
          return;
        }
        setIsLoadingCustomers(true);
        const token = await auth.currentUser.getIdToken();
        const headers = { Authorization: `Bearer ${token}` } as HeadersInit;
        const [c, s, b] = await Promise.all([
          fetch(`/api/shops/${shopId}/customers`, { headers }),
          fetch(`/api/shops/${shopId}/services`, { headers }),
          fetch(`/api/shops/${shopId}/barbers`, { headers }),
        ]);
        if (cancelled) return;
        const [cj, sj, bj] = await Promise.all([c.json(), s.json(), b.json()]);
        setCustomers(cj.items || []);
        setAvailableServices(sj.items || []);
        setAvailableBarbers(bj.items || []);
      } catch (e) {
        if (!cancelled) {
          setCustomers([]); setAvailableServices([]); setAvailableBarbers([]);
        }
      } finally {
        if (!cancelled) setIsLoadingCustomers(false);
      }
    }
    loadLists();
    return () => { cancelled = true; };
  }, [auth, shopId]);

  const appointmentForm = useForm<AddAppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      customerId: '',
      date: new Date(),
      time: '',
      notes: '',
      status: 'confirmed',
      items: [],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: appointmentForm.control,
    name: "items",
  });

  const quickAddClientForm = useForm<QuickAddClientFormValues>({
    resolver: zodResolver(quickAddClientSchema),
    defaultValues: {
      firstName: '',
      phone: '',
    },
  });

  const { isSubmitting } = appointmentForm.formState;

  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }
  
  useEffect(() => {
    if (clientSearch) {
        quickAddClientForm.setValue('firstName', clientSearch);
    }
  }, [clientSearch, quickAddClientForm]);

  useEffect(() => {
    if (initialData) {
      const startTime = toDate(initialData.startTime);
      appointmentForm.reset({
        customerId: initialData.customerId,
        date: startTime,
        time: format(startTime, 'HH:mm'),
        notes: initialData.notes || '',
        status: initialData.status,
        items: initialData.items || [],
      });
    } else {
      appointmentForm.reset({
        customerId: '',
        date: new Date(),
        time: '',
        notes: '',
        status: 'confirmed',
        items: [{ serviceId: '', barberId: '', price: 0, duration: 0 }],
      });
    }
  }, [initialData, appointmentForm]);

  const onQuickAddClient = async (values: QuickAddClientFormValues) => {
    try {
        const customersRef = collection(firestore, 'barberShops', shopId, 'customers');
        const [firstName, ...lastNameParts] = values.firstName.split(' ');
        const lastName = lastNameParts.join(' ');

        const newCustomerDoc = await addDoc(customersRef, {
            firstName,
            lastName: lastName || '.',
            phone: values.phone || '',
            barberShopId: shopId,
            createdAt: serverTimestamp(),
        });
        
        toast({
            title: 'Cliente Adicionado!',
            description: `${values.firstName} foi adicionado com sucesso.`
        });
        // Reload customers list via API
        try {
          if (auth?.currentUser) {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`/api/shops/${shopId}/customers`, { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            setCustomers(json.items || []);
          }
        } catch {}
        appointmentForm.setValue('customerId', newCustomerDoc.id);
        setQuickAddClientOpen(false);
        setClientPopoverOpen(false);
        quickAddClientForm.reset();

    } catch (error) {
         console.error('Error adding client:', error);
         toast({
            variant: 'destructive',
            title: 'Erro ao adicionar cliente',
        });
    }
  }

  const watchedItems = appointmentForm.watch('items');

  const { totalPrice, totalDuration } = useMemo(() => {
    const items = watchedItems || [];
    return items.reduce((acc, item) => {
        // Preferir valores já aplicados no item; se ausentes, cair no serviço
        if (item.price && item.duration) {
          acc.totalPrice += item.price;
          acc.totalDuration += item.duration;
        } else {
          const service = availableServices?.find(s => s.id === item.serviceId);
          if (service) {
            acc.totalPrice += service.price;
            acc.totalDuration += service.duration;
          }
        }
        return acc;
    }, { totalPrice: 0, totalDuration: 0 });
  }, [watchedItems, availableServices]);
  
  const selectedBarberIds = useMemo(() => {
    const items = watchedItems || [];
    const ids = new Set(items.map(item => item.barberId).filter(Boolean));
    return Array.from(ids);
  }, [watchedItems]);
  
  const selectedDate = appointmentForm.watch('date');
  const customerId = appointmentForm.watch('customerId');
  const selectedTime = appointmentForm.watch('time');

  const canSubmit = useMemo(() => {
    const hasBarber = (watchedItems || []).some(i => i.barberId);
    const hasCustomer = !!customerId;
    const hasTime = !!selectedTime;
    return hasBarber && hasCustomer && hasTime;
  }, [watchedItems, customerId, selectedTime]);


  const onSubmit = async (values: AddAppointmentFormValues) => {
    try {
      const [hours, minutes] = values.time.split(':').map(Number);
      const startTime = new Date(values.date);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime.getTime() + totalDuration * 60000);

      const appointmentData = {
        ...values,
        barberShopId: shopId,
        barberIds: selectedBarberIds,
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
        totalPrice: totalPrice,
        totalDuration: totalDuration,
        createdAt: serverTimestamp(),
      };
      
      delete (appointmentData as any).date;

      if (initialData) {
        const appointmentRef = doc(firestore, 'barberShops', shopId, 'appointments', initialData.id);
        setDocumentNonBlocking(appointmentRef, appointmentData, { merge: true });
      } else {
        const appointmentsRef = collection(firestore, 'barberShops', shopId, 'appointments');
        addDocumentNonBlocking(appointmentsRef, appointmentData);
      }

      toast({
          title: initialData ? 'Agendamento Atualizado!' : 'Agendamento Criado!',
          description: 'Os dados foram salvos com sucesso.',
      });
      onSuccess?.();
    } catch (error) {
        console.error('Error saving appointment:', error);
        toast({
            variant: 'destructive',
            title: 'Erro ao salvar agendamento',
            description: 'Ocorreu um erro ao salvar os dados.',
        });
    }
  };

  return (
    <Dialog open={isQuickAddClientOpen} onOpenChange={setQuickAddClientOpen}>
    <Form {...appointmentForm}>
      <form onSubmit={appointmentForm.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={appointmentForm.control}
              name="customerId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Cliente</FormLabel>
                  <Popover open={isClientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'justify-between',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value && customers
                            ? customers.find((c) => c.id === field.value)?.firstName + ' ' + customers.find((c) => c.id === field.value)?.lastName
                            : 'Selecione um cliente'}
                          <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Buscar cliente..."
                          onValueChange={setClientSearch}
                        />
                        <CommandList>
                          {isLoadingCustomers ? <CommandItem>Carregando...</CommandItem> : (
                            <CommandEmpty>
                                <Button variant="ghost" className="w-full" onClick={() => setQuickAddClientOpen(true)}>
                                    <PlusCircle className="mr-2"/> Adicionar "{clientSearch}"
                                </Button>
                            </CommandEmpty>
                          )}
                          <CommandGroup>
                            {customers?.map((client) => (
                              <CommandItem
                                value={`${client.firstName} ${client.lastName}`}
                                key={client.id}
                                onSelect={() => {
                                  appointmentForm.setValue('customerId', client.id);
                                  setClientPopoverOpen(false);
                                }}
                              >
                                {client.firstName} {client.lastName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <FormField
              control={appointmentForm.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Agendamento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'pl-3 text-left font-normal',
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
                        onSelect={(date) => {
                           if (date) {
                            field.onChange(date);
                            appointmentForm.setValue('time', '');
                           }
                        }}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />
        
        <div className="space-y-4">
            <FormLabel>Serviços e Profissionais</FormLabel>
            {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-4 p-4 border rounded-lg items-end">
                    <FormField
                    control={appointmentForm.control}
                    name={`items.${index}.serviceId`}
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-xs">Serviço {index + 1}</FormLabel>
                        <Select onValueChange={(val) => {
                            field.onChange(val);
                            const service = availableServices?.find(s => s.id === val);
                            if (service) {
                              appointmentForm.setValue(`items.${index}.price`, service.price, { shouldDirty: true, shouldTouch: true });
                              appointmentForm.setValue(`items.${index}.duration`, service.duration, { shouldDirty: true, shouldTouch: true });
                            }
                          }} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um serviço" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {availableServices?.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                {service.name} (R${service.price.toFixed(2)})
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        {(() => {
                          const svc = availableServices?.find(s => s.id === appointmentForm.getValues(`items.${index}.serviceId` as const));
                          const price = appointmentForm.getValues(`items.${index}.price` as const) || svc?.price;
                          const duration = appointmentForm.getValues(`items.${index}.duration` as const) || svc?.duration;
                          if (!price && !duration) return null;
                          return (
                            <div className="text-xs text-muted-foreground pt-1">R$ {Number(price || 0).toFixed(2)} — {Number(duration || 0)} min</div>
                          );
                        })()}
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={appointmentForm.control}
                        name={`items.${index}.barberId`}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs">Barbeiro {index + 1}</FormLabel>
                            <Select onValueChange={(val) => {
                                field.onChange(val);
                                // Quando o barbeiro muda, forçar recálculo de horários limpando o horário escolhido
                                appointmentForm.setValue('time', '', { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                              }} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um barbeiro" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {availableBarbers?.map((barber) => (
                                    <SelectItem key={barber.id} value={barber.id}>
                                    {barber.firstName} {barber.lastName}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="button" size="sm" variant="secondary"
                      disabled={!appointmentForm.getValues(`items.${index}.serviceId` as const)}
                      onClick={async () => {
                        const current = appointmentForm.getValues(`items.${index}.serviceId` as const);
                        const service = availableServices?.find(s => s.id === current);
                        if (service) {
                          appointmentForm.setValue(`items.${index}.price`, service.price, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                          appointmentForm.setValue(`items.${index}.duration`, service.duration, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                          // Limpar horário selecionado e validar para recalcular os slots
                          appointmentForm.setValue('time', '', { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                          await appointmentForm.trigger(['items', 'time']);
                        }
                      }}
                    >
                      Aplicar
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
            <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => append({ serviceId: '', barberId: '', price: 0, duration: 0 })}
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar outro serviço
            </Button>
        </div>
        
        <Separator />
        
        <FormField
            control={appointmentForm.control}
            name="time"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Horários Disponíveis</FormLabel>
                <FormControl>
                    <TimeSlotPicker 
                        shopId={shopId}
                        selectedDate={selectedDate}
                        barberIds={selectedBarberIds}
                        serviceDuration={totalDuration}
                        selectedValue={field.value}
                        onValueChange={field.onChange}
                        excludeAppointmentId={initialData?.id}
                    />
                </FormControl>
                {selectedBarberIds.length === 0 && (
                  <p className="text-xs text-muted-foreground pt-2">Selecione ao menos um barbeiro para filtrar conflitos de horário.</p>
                )}
                {field.value && (
                  <p className="text-xs text-muted-foreground pt-2">Selecionado: {field.value}{totalDuration ? ` — termina às ${(() => { const [h,m]=String(field.value).split(':').map(Number); const d=new Date(selectedDate); d.setHours(h||0,m||0,0,0); return new Date(d.getTime()+ (totalDuration||0)*60000).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); })()}` : ''}</p>
                )}
                <FormMessage />
                </FormItem>
            )}
        />
        
        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <p className="text-sm font-medium">Total Estimado</p>
                <div className="flex items-center justify-between text-lg font-bold p-4 border rounded-lg bg-muted">
                    <span>
                        <DollarSign className="inline-block mr-2 h-5 w-5 text-muted-foreground" />
                        Preço
                    </span>
                    <span>R$ {totalPrice.toFixed(2)}</span>
                </div>
                 <div className="flex items-center justify-between text-lg font-bold p-4 border rounded-lg bg-muted">
                    <span>
                        <Clock className="inline-block mr-2 h-5 w-5 text-muted-foreground" />
                        Duração
                    </span>
                    <span>{totalDuration} min</span>
                </div>
            </div>
             <FormField
                control={appointmentForm.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Notas (Opcional)</FormLabel>
                    <div className="relative h-full">
                        <PenSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                        <Textarea
                            placeholder="Observações para este agendamento..."
                            {...field}
                            value={field.value || ''}
                            className="pl-10 h-full min-h-[124px]"
                        />
                        </FormControl>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting || !canSubmit}>
            {isSubmitting && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            {initialData ? 'Salvar Alterações' : 'Salvar Agendamento'}
          </Button>
        </div>
      </form>
    </Form>
    <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
        </DialogHeader>
        <Form {...quickAddClientForm}>
            <form onSubmit={quickAddClientForm.handleSubmit(onQuickAddClient)} className="space-y-4">
                <FormField
                    control={quickAddClientForm.control}
                    name="firstName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                                <Input placeholder="Nome do novo cliente" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={quickAddClientForm.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Telefone (Opcional)</FormLabel>
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
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setQuickAddClientOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={quickAddClientForm.formState.isSubmitting}>
                         {quickAddClientForm.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                         Salvar Cliente
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    </DialogContent>
    </Dialog>
  );
}
