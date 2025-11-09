
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { format, addMinutes, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Appointment, Customer, Barber, Service, BarberShop } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { User, Scissors, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Timestamp, doc } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CalendarViewProps {
  appointments: Appointment[];
  barbers: Barber[];
  customers: Customer[];
  services: Service[];
  isLoading: boolean;
  selectedDate: Date;
  onEdit?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onComplete?: (appointment: Appointment) => void;
}

const timeSlots = Array.from({ length: (22 - 8) * 2 }, (_, i) => {
  const hour = 8 + Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

export function CalendarView({ 
  appointments, 
  barbers, 
  customers, 
  services, 
  isLoading,
  selectedDate,
  onEdit,
  onReschedule,
  onCancel,
  onComplete,
}: CalendarViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();
  const inferredShopId = barbers[0]?.barberShopId;
  const shopRef = useMemoFirebase(() => inferredShopId ? doc(firestore, 'barberShops', inferredShopId) : null, [firestore, inferredShopId]);
  const { data: shop } = useDoc<BarberShop>(shopRef);

  const toDate = (timestamp: any): Date => {
    if (timestamp?.toDate) return timestamp.toDate();
    return new Date(timestamp);
  };
  
  const dailyAppointments = useMemo(() => {
    if (!appointments) return [];
    return appointments.filter(a => isSameDay(toDate(a.startTime), selectedDate));
  }, [appointments, selectedDate]);

  useEffect(() => {
    if (!isToday(selectedDate)) return;
    const now = new Date();
    const minutesFrom8 = (now.getHours() - 8) * 60 + now.getMinutes();
    const rowHeight = 64; // Corresponds to h-16
    const offsetRows = Math.max(0, Math.floor(minutesFrom8 / 30));
    const target = offsetRows * rowHeight;
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: Math.max(0, target - 200), behavior: 'smooth' });
    }
  }, [selectedDate]);
  
  const getAppointmentDetails = (appointment: Appointment) => {
    const customer = customers.find(c => c.id === appointment.customerId);
    const serviceNames = appointment.items.map(item => services.find(s => s.id === item.serviceId)?.name).join(', ');
    return { customer, serviceNames };
  };

  const getStatusClass = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed': return 'border-green-500 bg-green-500/20';
      case 'completed': return 'border-blue-500 bg-blue-500/20';
      case 'cancelled': return 'border-destructive bg-destructive/20 opacity-70';
      case 'no-show': return 'border-gray-500 bg-gray-500/20 opacity-70';
      default: return 'border-yellow-500 bg-yellow-500/20';
    }
  }

  return (
    <div className="flex h-full flex-col bg-card border rounded-lg overflow-hidden">
      <div ref={scrollRef} className="flex flex-auto overflow-auto relative">
        {/* Time Gutter */}
        <div className="grid flex-none grid-cols-1 grid-rows-1 text-sm">
          <div className="row-end-1 h-14 sticky top-0 bg-card z-20 border-b"></div>
          {timeSlots.map(time => (
            <div key={time} className="flex items-center justify-center pr-2 text-right leading-5 text-muted-foreground row-span-2 h-16 border-t">
              {time.endsWith(':00') && <strong>{time}</strong>}
            </div>
          ))}
        </div>

        <div className="grid flex-auto grid-cols-1 grid-rows-1">
          {/* Header */}
          <div className="col-start-1 col-end-2 row-start-1 grid divide-x sticky top-0 z-20 bg-card" style={{ gridTemplateColumns: `repeat(${barbers.length || 1}, minmax(12rem, 1fr))` }}>
            {barbers.map((barber) => (
              <div key={barber.id} className="flex items-center justify-center gap-2 p-2 h-14 border-b">
                 <Avatar className="h-8 w-8">
                  <AvatarImage src={barber.avatar} />
                  <AvatarFallback>{barber.firstName?.[0]}</AvatarFallback>
                </Avatar>
                <span className="font-semibold truncate">{barber.firstName} {barber.lastName}</span>
              </div>
            ))}
             {barbers.length === 0 && !isLoading && <div className="h-14 border-b flex items-center justify-center text-muted-foreground">Nenhum profissional selecionado</div>}
          </div>

          {/* Grid Lines */}
          <div className="col-start-1 col-end-2 row-start-1 grid grid-cols-1" style={{ gridTemplateRows: `3.5rem repeat(${timeSlots.length * 2}, minmax(0, 1fr))` }}>
            <div className="row-end-1 h-14"></div>
            {Array.from({length: timeSlots.length * 2}).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-8 border-t',
                  idx % 4 === 0 ? 'border-foreground/10' : 'border-dashed border-foreground/5'
                )}
              />
            ))}
          </div>

          {/* Appointments */}
          <div className="col-start-1 col-end-2 row-start-1 grid" style={{ gridTemplateColumns: `repeat(${barbers.length || 1}, minmax(12rem, 1fr))`, gridTemplateRows: `3.5rem repeat(${timeSlots.length * 2}, minmax(0, 1fr))` }}>
            {isLoading && barbers.map((_, barberIndex) => (
                Array.from({length: 3}).map((_, timeIndex) => (
                    <li key={`${barberIndex}-${timeIndex}`} className="relative mt-px flex" style={{ gridRow: `${timeIndex * 8 + 2} / span ${Math.floor(Math.random() * 4) + 4}`, gridColumnStart: barberIndex + 1 }}>
                        <Skeleton className="absolute inset-1" />
                    </li>
                ))
            ))}
            
            {!isLoading && dailyAppointments.map(appointment => {
                const { customer, serviceNames } = getAppointmentDetails(appointment);
                if (!customer) return null;

                const appointmentBarberIds = new Set(appointment.items.map(item => item.barberId));
                
                const displayedBarberId = barbers.find(b => appointmentBarberIds.has(b.id))?.id;
                if (!displayedBarberId) return null;

                const barberIndex = barbers.findIndex(b => b.id === displayedBarberId);
                if (barberIndex === -1) return null;

                const startTime = toDate(appointment.startTime);
                const startRow = ((startTime.getHours() - 8) * 4) + (Math.floor(startTime.getMinutes() / 15)) + 2;
                const durationInIntervals = Math.ceil((appointment.totalDuration || 60) / 15);
                
                const computedTotalPrice = typeof appointment.totalPrice === 'number' ? Number(appointment.totalPrice) : 0;

                return (
                  <li key={appointment.id} className="relative mt-px flex p-1" style={{ gridRow: `${startRow} / span ${durationInIntervals}`, gridColumnStart: barberIndex + 1 }}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <div
                          className={cn("absolute inset-1 flex cursor-pointer flex-col overflow-y-auto rounded-lg p-2 text-xs leading-5 border-l-4 transition-shadow hover:shadow-md", getStatusClass(appointment.status))}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-foreground/90 truncate pr-2">{customer.firstName} {customer.lastName}</p>
                            <Badge variant="secondary" className="h-5 py-0 px-1 text-[10px]">{appointment.status}</Badge>
                          </div>
                          <p className="text-foreground/85 truncate">{serviceNames}</p>
                          <div className="flex items-center justify-between text-foreground/85 mt-auto">
                            <p>{format(startTime, 'HH:mm')} - {format(addMinutes(startTime, appointment.totalDuration || 0), 'HH:mm')}</p>
                            <span className="font-semibold">R${computedTotalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg">{customer.firstName} {customer.lastName}</h3>
                          {customer?.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Scissors className="h-4 w-4" />
                              <span>{serviceNames}</span>
                            </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button size="sm" variant="outline" onClick={() => onReschedule?.(appointment)}>Adiar</Button>
                            <Button size="sm" variant="default" onClick={() => onEdit?.(appointment)}>Editar</Button>
                            <Button size="sm" variant="secondary" onClick={() => {
                              const shopId = (barbers[0] as any)?.barberShopId;
                              if (shopId) {
                                window.location.href = `/dashboard/${shopId}/appointments/${appointment.id}`;
                              }
                            }}>Detalhes</Button>
                            <Button size="sm" variant="destructive" onClick={() => onCancel?.(appointment)}>Cancelar</Button>
                            <Button size="sm" className="col-span-2" onClick={() => onComplete?.(appointment)}>Concluir</Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </li>
                )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
