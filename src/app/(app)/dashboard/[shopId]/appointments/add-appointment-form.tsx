
'use client';

import { useForm } from 'react-hook-form';
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
import { clients, services, barbers } from '@/lib/data';
import type { Appointment as AppointmentType } from '@/lib/data';
import { useEffect } from 'react';

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
    .enum(['Confirmado', 'Concluído', 'Cancelado'])
    .default('Confirmado'),
});

type AddAppointmentFormValues = z.infer<typeof formSchema>;

interface AddAppointmentFormProps {
  shopId: string;
  initialData?: AppointmentType;
  onSuccess?: () => void;
}

export function AddAppointmentForm({
  shopId,
  initialData,
  onSuccess,
}: AddAppointmentFormProps) {
  const { toast } = useToast();

  const customers = clients;
  const availableServices = services;
  const availableBarbers = barbers;

  const form = useForm<AddAppointmentFormValues>({
    resolver: zodResolver(formSchema),
  });

  const { isSubmitting } = form.formState;

  // Set default values and handle initialData
  useEffect(() => {
    if (initialData) {
      const startTime = new Date(initialData.dateTime);
      form.reset({
        // This is a bit tricky with mock data, we'll find by name matching
        customerId: customers.find(c => initialData.clientName.includes(c.name.split(' ')[0]))?.id,
        serviceId: availableServices.find(s => s.name === initialData.service)?.id,
        barberId: availableBarbers.find(b => initialData.barber.includes(b.firstName))?.id,
        date: startTime,
        time: format(startTime, 'HH:mm'),
        price: availableServices.find(s => s.name === initialData.service)?.price,
        notes: '', // Notes not in mock data
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
        status: 'Confirmado',
      });
    }
  }, [initialData, form, customers, availableServices, availableBarbers]);

  const selectedServiceId = form.watch('serviceId');
  const selectedService = availableServices?.find((s) => s.id === selectedServiceId);

  // Set price whenever service changes
  useEffect(() => {
    if (selectedService) {
      form.setValue('price', selectedService.price);
    }
  }, [selectedService, form]);

  const onSubmit = async (values: AddAppointmentFormValues) => {
    console.log("Simulating save appointment:", values);
    toast({
        title: initialData ? 'Agendamento Atualizado!' : 'Agendamento Criado!',
        description: 'Os dados foram salvos (simulação).',
    });
    onSuccess?.();
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
                              )?.name
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
                                value={client.name}
                                key={client.id}
                                onSelect={() => {
                                  form.setValue('customerId', client.id);
                                }}
                              >
                                {client.name}
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
                          value={field.value || ''}
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
