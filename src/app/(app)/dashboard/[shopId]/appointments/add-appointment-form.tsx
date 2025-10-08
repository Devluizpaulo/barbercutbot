
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parse } from 'date-fns';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import type { Appointment, Customer, Barber, Service } from '@/lib/types';
import { useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, Timestamp, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const formSchema = z.object({
  customerId: z.string().min(1, 'Selecione um cliente.'),
  serviceId: z.string().min(1, 'Selecione um serviço.'),
  barberId: z.string().min(1, 'Selecione um barbeiro.'),
  date: z.date({
    required_error: 'A data é obrigatória.',
  }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Horário inválido.'),
  price: z.coerce.number().optional(),
  notes: z.string().optional(),
  status: z
    .enum(['pending', 'confirmed', 'completed', 'cancelled', 'no-show'])
    .default('confirmed'),
});

type AddAppointmentFormValues = z.infer<typeof formSchema>;

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

  const customersQuery = useMemoFirebase(() => collection(firestore, 'barberShops', shopId, 'customers'), [firestore, shopId]);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const servicesQuery = useMemoFirebase(() => collection(firestore, 'barberShops', shopId, 'services'), [firestore, shopId]);
  const { data: availableServices } = useCollection<Service>(servicesQuery);

  const barbersQuery = useMemoFirebase(() => collection(firestore, 'barberShops', shopId, 'barbers'), [firestore, shopId]);
  const { data: availableBarbers } = useCollection<Barber>(barbersQuery);

  const form = useForm<AddAppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
      serviceId: '',
      barberId: '',
      date: new Date(),
      time: format(new Date(), 'HH:mm'),
      notes: '',
      price: 0,
      status: 'confirmed',
    }
  });

  const { isSubmitting } = form.formState;

  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  // Set default values and handle initialData
  useEffect(() => {
    if (initialData) {
      const startTime = toDate(initialData.startTime);
      form.reset({
        customerId: initialData.customerId,
        serviceId: initialData.serviceIds[0] || '', // Assuming one service
        barberId: initialData.barberId,
        date: startTime,
        time: format(startTime, 'HH:mm'),
        price: initialData.price,
        notes: initialData.notes || '',
        status: initialData.status,
      });
    } else {
      form.reset({
        customerId: '',
        serviceId: '',
        barberId: '',
        date: new Date(),
        time: format(new Date(), 'HH:mm'),
        notes: '',
        price: 0,
        status: 'confirmed',
      });
    }
  }, [initialData, form]);

  const selectedServiceId = form.watch('serviceId');
  const selectedService = availableServices?.find((s) => s.id === selectedServiceId);

  // Set price whenever service changes
  useEffect(() => {
    if (selectedService) {
      form.setValue('price', selectedService.price);
    }
  }, [selectedService, form]);

  const onSubmit = async (values: AddAppointmentFormValues) => {
    try {
      const [hours, minutes] = values.time.split(':').map(Number);
      const startTime = new Date(values.date);
      startTime.setHours(hours, minutes, 0, 0);

      const service = availableServices?.find(s => s.id === values.serviceId);
      const duration = service?.duration || 0;
      const endTime = new Date(startTime.getTime() + duration * 60000);

      const appointmentData = {
        ...values,
        barberShopId: shopId,
        serviceIds: [values.serviceId],
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
        createdAt: serverTimestamp(),
      };
      
      delete (appointmentData as any).date;
      delete (appointmentData as any).time;

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna da Esquerda */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Cliente</FormLabel>
                  <Popover>
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
                          {field.value
                            ? customers?.find(
                                (client) => client.id === field.value
                              )?.firstName
                            : 'Selecione um cliente'}
                          <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar cliente..." />
                        <CommandList>
                          <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                          <CommandGroup>
                            {customers?.map((client) => (
                              <CommandItem
                                value={`${client.firstName} ${client.lastName}`}
                                key={client.id}
                                onSelect={() => {
                                  form.setValue('customerId', client.id);
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

            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviço</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <SelectValue
                          placeholder="Selecione um serviço"
                          className="pl-10"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableServices?.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="barberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barbeiro</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <SelectValue
                          placeholder="Selecione um barbeiro"
                          className="pl-10"
                        />
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
          </div>

          {/* Coluna da Direita */}
          <div className="space-y-6">
            <FormField
              control={form.control}
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

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário</FormLabel>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input type="time" {...field} className="pl-10" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedService && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || 0}
                          readOnly
                          className="pl-10 font-bold"
                        />
                      </FormControl>
                    </div>
                    <FormDescription>
                      O preço é definido pelo serviço selecionado.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (Opcional)</FormLabel>
              <div className="relative">
                <PenSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Textarea
                    placeholder="Alguma observação importante para este agendamento?"
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

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar Agendamento
          </Button>
        </div>
      </form>
    </Form>
  );
}
