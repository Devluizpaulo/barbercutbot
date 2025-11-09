
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { format, addMinutes, isSameDay, isToday } from 'date-fns';
import { cn, getEventColor } from '@/lib/utils';
import type { Appointment, Customer, Barber, Service, BarberShop } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { User, Scissors, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Timestamp, doc } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';

interface CalendarViewProps {
  appointments: Appointment[];
  barbers: Barber[];
  customers: Customer[];
  services: Service[];
  isLoading: boolean;
  selectedDate: Date;
  selectedBarberId: string | 'all';
  onEdit?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onComplete?: (appointment: Appointment) => void;
}

const timeSlots = Array.from({ length: 15 * 4 }, (_, i) => {
  const hour = 8 + Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

export function CalendarView({ 
  appointments, 
  barbers, 
  customers, 
  services, 
  isLoading,
  selectedDate,
  selectedBarberId,
  onEdit,
  onReschedule,
  onCancel,
  onComplete,
}: CalendarViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();
  // Try to infer shopId from the first barber
  const inferredShopId = barbers[0]?.barberShopId;
  const shopRef = useMemoFirebase(() => inferredShopId ? doc(firestore, 'barberShops', inferredShopId) : null, [firestore, inferredShopId]);
  const { data: shop } = useDoc<BarberShop>(shopRef);
  const toDate = (timestamp: any): Date => {
    if (timestamp?.toDate) return timestamp.toDate();
    return new Date(timestamp);
  };
  
  const filteredBarbers = useMemo(() => {
    if (selectedBarberId === 'all') return barbers;
    return barbers.filter(b => b.id === selectedBarberId);
  }, [barbers, selectedBarberId]);

  const dailyAppointmentsRaw = useMemo(() => {
    return appointments.filter(a => isSameDay(toDate(a.startTime), selectedDate));
  }, [appointments, selectedDate]);

  const { dailyAppointments, duplicateAppointments } = useMemo(() => {
    const seen = new Set<string>();
    const dups: Appointment[] = [];
    const uniq: Appointment[] = [];
    for (const a of dailyAppointmentsRaw) {
      const key = a.id || `${a.customerId}-${toDate(a.startTime).getTime()}`;
      if (seen.has(key)) {
        dups.push(a);
      } else {
        seen.add(key);
        uniq.push(a);
      }
    }
    return { dailyAppointments: uniq, duplicateAppointments: dups };
  }, [dailyAppointmentsRaw]);

  useEffect(() => {
    if (duplicateAppointments.length > 0) {
      // eslint-disable-next-line no-console
      console.warn('[Agenda] Agendamentos duplicados detectados no dia selecionado:', duplicateAppointments.map(a => a.id));
    }
  }, [duplicateAppointments]);

  // Auto-scroll to current time when viewing today
  useEffect(() => {
    if (!isToday(selectedDate)) return;
    const now = new Date();
    const minutesFrom8 = (now.getHours() - 8) * 60 + now.getMinutes();
    const rowHeight = 32; // approx 2rem per 15-min row (matching grid)
    const offsetRows = Math.max(0, Math.floor(minutesFrom8 / 15));
    const target = offsetRows * (rowHeight / 1); // pixels
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: Math.max(0, target - 200), behavior: 'smooth' });
    }
  }, [selectedDate]);

  // Helpers to convert HH:mm to grid rows (base 08:00, 15-min per row)
  const toRow = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return (h - 8) * 4 + (m / 15) + 2; // +2 accounts for header rows
  };

  // Optional lunch/break bands from shop configuration
  const dayName = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' }).split(',')[0]?.toLowerCase();
  const breaks = useMemo(() => {
    const anyShop: any = shop || {};
    const defs: Array<{ start: string; end: string; label?: string; day?: string }> = anyShop.breaks || [];
    const filtered = defs.filter(b => !b.day || b.day.toLowerCase() === dayName);
    if (filtered.length === 0) {
      // Default lunch band if none configured
      return [{ start: '12:00', end: '14:00', label: 'Horário de Almoço' }];
    }
    return filtered;
  }, [shop, dayName]);

  // Optional absences list in shop: { date, barberId, start?, end?, label? }
  const absentBarberIds = useMemo(() => {
    const anyShop: any = shop || {};
    const todayISO = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).toDateString();
    const list: Array<{ date: any; barberId: string }> = anyShop.absences || [];
    return list
      .filter(a => {
        const d = a.date?.toDate ? a.date.toDate() : new Date(a.date || selectedDate);
        return d.toDateString() === todayISO;
      })
      .map(a => a.barberId);
  }, [shop, selectedDate]);

  const getAppointmentDetails = (appointment: Appointment) => {
    const customer = customers.find(c => c.id === appointment.customerId);
    return {
      customer,
    };
  };

  return (
    <div className="flex h-full flex-col bg-card border rounded-lg overflow-hidden">
      <div ref={scrollRef} className="flex flex-auto overflow-auto relative">
        <div className="grid flex-none grid-cols-1 grid-rows-1">
          <div className="row-end-1 h-7"></div>
          {timeSlots.map(time => (
            <div key={time} className="flex items-center justify-center pr-2 text-right text-[10px] leading-5 text-muted-foreground">
              {time}
            </div>
          ))}
        </div>

        <div className="grid flex-auto grid-cols-1 grid-rows-1">
          <div className="col-start-1 col-end-2 row-start-1 grid divide-x" style={{ gridTemplateColumns: `repeat(${filteredBarbers.length}, minmax(12rem, 1fr))` }}>
            {filteredBarbers.map((barber) => <div key={barber.id} />)}
          </div>
          <div className="col-start-1 col-end-2 row-start-1 grid grid-cols-1" style={{ gridTemplateRows: '1.75rem repeat(56, minmax(0, 1fr))' }}>
            <div className="row-end-1 h-7"></div>
            {timeSlots.map((time, idx) => (
              <div
                key={time}
                className={cn(
                  'border-t',
                  time.endsWith(':00') ? 'border-foreground/20' : 'border-dotted',
                  idx % 2 === 0 ? 'bg-muted/30' : 'bg-transparent'
                )}
              />
            ))}
          </div>
          <ol className="col-start-1 col-end-2 row-start-1 grid" style={{ gridTemplateColumns: `repeat(${filteredBarbers.length}, minmax(12rem, 1fr))`, gridTemplateRows: `1.75rem repeat(${timeSlots.length}, minmax(0, 1fr))` }}>
            <li className="sticky top-0 z-10 col-span-full flex items-center justify-between border-b bg-card/80 backdrop-blur px-6 h-7">
              {filteredBarbers.map(barber => (
                <div key={barber.id} className="text-center font-semibold text-sm w-full flex items-center justify-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: barber.color || undefined }} />
                  <span className="truncate max-w-[10rem]">{barber.firstName} {barber.lastName}</span>
                </div>
              ))}
            </li>

            {/* Absent barber columns overlay */}
            {filteredBarbers.map((barber, idx) => (
              absentBarberIds.includes(barber.id) ? (
                <li key={`absent-${barber.id}`} className="relative" style={{ gridRow: `2 / span ${timeSlots.length}`, gridColumnStart: idx + 1 }}>
                  <div className="absolute inset-0 bg-muted/60 flex items-center justify-center text-xs text-muted-foreground font-medium">
                    Profissional Ausente
                  </div>
                </li>
              ) : null
            ))}

            {/* Break/lunch bands */}
            {breaks.map((b, i) => (
              <li key={`break-${i}`} className="relative col-span-full" style={{ gridRow: `${toRow(b.start)} / ${toRow(b.end)}` }}>
                <div className="absolute inset-0 bg-yellow-200/60 text-amber-900 text-[10px] flex items-center pl-2">
                  {b.label || 'Horário de Almoço'}
                </div>
              </li>
            ))}
            
            {isLoading && filteredBarbers.map((_, barberIndex) => (
                timeSlots.slice(0,5).map((_, timeIndex) => (
                    <li key={`${barberIndex}-${timeIndex}`} className="relative mt-px flex" style={{ gridRow: `${timeIndex * 4 + 2} / span ${Math.floor(Math.random() * 4) + 4}`, gridColumnStart: barberIndex + 1 }}>
                        <Skeleton className="absolute inset-1" />
                    </li>
                ))
            ))}
            
            {!isLoading && dailyAppointments.map(appointment => {
                const { customer } = getAppointmentDetails(appointment);
                if (!customer) return null;

                const appointmentBarberIds = new Set(appointment.items.map(item => item.barberId));
                
                const barberForColor = barbers.find(b => appointmentBarberIds.has(b.id));

                // Find the first barber in the appointment that is currently being displayed
                const displayedBarberId = filteredBarbers.find(b => appointmentBarberIds.has(b.id))?.id;
                if (!displayedBarberId) return null;

                const barberIndex = filteredBarbers.findIndex(b => b.id === displayedBarberId);
                if (barberIndex === -1) return null;

                const startTime = toDate(appointment.startTime);
                const startHour = startTime.getHours();
                const startMinute = startTime.getMinutes();

                const startRow = (startHour - 8) * 4 + (startMinute / 15) + 2;
                const durationInIntervals = Math.ceil((appointment.totalDuration || 60) / 15);
                
                const getStatusColor = (status: Appointment['status']) => {
                  switch (status) {
                    case 'confirmed': return '#16a34a'; // green-600
                    case 'pending': return '#f59e0b';   // amber-500
                    case 'completed': return '#3b82f6'; // blue-500
                    case 'cancelled': return '#ef4444'; // red-500
                    case 'no-show': return '#6b7280';   // gray-500
                    default: return '#64748b';          // slate-500
                  }
                };
                const eventColor = getStatusColor(appointment.status);
                const computedTotalPrice = (() => {
                  if (typeof appointment.totalPrice === 'number') return Number(appointment.totalPrice);
                  const sum = appointment.items.reduce((acc, it) => {
                    if (typeof it.price === 'number' && it.price > 0) return acc + it.price;
                    const svc = services.find(s => s.id === it.serviceId);
                    return acc + (svc?.price || 0);
                  }, 0);
                  return sum;
                })();

                return (
                  <li key={appointment.id} className="relative mt-px flex" style={{ gridRow: `${startRow} / span ${durationInIntervals}`, gridColumnStart: barberIndex + 1 }}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <div
                          className="absolute inset-1 flex cursor-pointer flex-col overflow-y-auto rounded-lg p-2 text-xs leading-5 text-white border-l-4 transition-shadow hover:shadow-md"
                          style={{ backgroundColor: `${eventColor}40`, borderColor: eventColor }}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-white/90 truncate pr-2">{customer.firstName}</p>
                            <Badge variant="secondary" className="h-5 py-0 px-1 text-[10px]">{appointment.status}</Badge>
                          </div>
                          <p className="text-white/85 truncate">{appointment.items.map(i => services.find(s => s.id === i.serviceId)?.name).join(', ')}</p>
                          {customer?.phone && (
                            <div className="flex items-center gap-1 text-white/80">
                              <Phone className="h-3.5 w-3.5" />
                              <span className="truncate">{customer.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-white/85">
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
                          {appointment.items.map((item, index) => {
                            const service = services.find(s => s.id === item.serviceId);
                            const barber = barbers.find(b => b.id === item.barberId);
                            const price = typeof item.price === 'number' && item.price > 0 ? item.price : (service?.price || 0);
                            return (
                              <div key={index} className="flex items-center justify-between text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Scissors className="h-4 w-4" />
                                  <span>{service?.name || 'Serviço'} com {barber?.firstName || 'Barbeiro'}</span>
                                </div>
                                <span className="font-medium">R${price.toFixed(2)}</span>
                              </div>
                            )
                          })}
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
          </ol>

          {isToday(selectedDate) && (
            <NowIndicator />
          )}
        </div>
      </div>
    </div>
  )
}

function NowIndicator() {
  // Positioned across all columns at the current time
  const now = new Date();
  const minutesFrom8 = (now.getHours() - 8) * 60 + now.getMinutes();
  const totalIntervals = 56; // 8:00 to 22:45 (15-min intervals)
  const clamped = Math.min(Math.max(minutesFrom8, 0), totalIntervals * 15);
  const top = 28 + (clamped / 15) * (1); // base offset for header + 1fr rows; fine-tuned by CSS
  return (
    <div
      className="pointer-events-none col-start-1 col-end-2 row-start-1 absolute left-0 right-0"
      style={{ top: `calc(1.75rem + ${clamped / 15} * 1fr)` }}
    >
      <div className="relative">
        <div className="absolute left-0 right-0 h-px bg-red-500" />
      </div>
    </div>
  );
}
