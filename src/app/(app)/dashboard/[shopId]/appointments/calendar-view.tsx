
'use client';

import { useMemo } from 'react';
import { format, addMinutes, isSameDay } from 'date-fns';
import { cn, getEventColor } from '@/lib/utils';
import type { Appointment, Customer, Barber, Service } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { User, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Timestamp } from 'firebase/firestore';

interface CalendarViewProps {
  appointments: Appointment[];
  barbers: Barber[];
  customers: Customer[];
  services: Service[];
  isLoading: boolean;
  selectedDate: Date;
  selectedBarberId: string | 'all';
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
  selectedBarberId 
}: CalendarViewProps) {

  const toDate = (timestamp: any): Date => {
    if (timestamp?.toDate) return timestamp.toDate();
    return new Date(timestamp);
  };
  
  const filteredBarbers = useMemo(() => {
    if (selectedBarberId === 'all') return barbers;
    return barbers.filter(b => b.id === selectedBarberId);
  }, [barbers, selectedBarberId]);

  const dailyAppointments = useMemo(() => {
    return appointments.filter(a => isSameDay(toDate(a.startTime), selectedDate));
  }, [appointments, selectedDate]);

  const getAppointmentDetails = (appointment: Appointment) => {
    const customer = customers.find(c => c.id === appointment.customerId);
    return {
      customer,
    };
  };

  return (
    <div className="flex h-full flex-col bg-card border rounded-lg overflow-hidden">
      <div className="flex flex-auto overflow-auto">
        <div className="grid flex-none grid-cols-1 grid-rows-1">
          <div className="row-end-1 h-7"></div>
          {timeSlots.map(time => (
            <div key={time} className="flex items-center justify-center pr-2 text-right text-xs leading-5 text-muted-foreground">
              {time.endsWith(':00') && time}
            </div>
          ))}
        </div>

        <div className="grid flex-auto grid-cols-1 grid-rows-1">
          <div className="col-start-1 col-end-2 row-start-1 grid divide-x" style={{ gridTemplateColumns: `repeat(${filteredBarbers.length}, minmax(10rem, 1fr))` }}>
            {filteredBarbers.map((barber) => <div key={barber.id} />)}
          </div>
          <div className="col-start-1 col-end-2 row-start-1 grid grid-cols-1" style={{ gridTemplateRows: '1.75rem repeat(56, minmax(0, 1fr))' }}>
            <div className="row-end-1 h-7"></div>
            {timeSlots.map(time => (
              <div key={time} className={cn('border-t', time.endsWith(':00') ? 'border-dashed' : 'border-dotted')} />
            ))}
          </div>
          <ol className="col-start-1 col-end-2 row-start-1 grid" style={{ gridTemplateColumns: `repeat(${filteredBarbers.length}, minmax(10rem, 1fr))`, gridTemplateRows: `1.75rem repeat(${timeSlots.length}, minmax(0, 1fr))` }}>
            <li className="relative col-span-full flex items-center justify-between border-b px-6">
              {filteredBarbers.map(barber => (
                <div key={barber.id} className="text-center font-semibold text-sm w-full">
                  {barber.firstName} {barber.lastName}
                </div>
              ))}
            </li>
            
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
                
                const eventColor = barberForColor?.color || getEventColor(barberForColor?.firstName || 'default');

                return (
                    <li key={appointment.id} className="relative mt-px flex" style={{ gridRow: `${startRow} / span ${durationInIntervals}`, gridColumnStart: barberIndex + 1 }}>
                        <Popover>
                            <PopoverTrigger asChild>
                                <div 
                                    className="absolute inset-1 flex cursor-pointer flex-col overflow-y-auto rounded-lg p-2 text-xs leading-5 text-white border-l-4"
                                    style={{ backgroundColor: `${eventColor}40`, borderColor: eventColor }} // 40 is for opacity
                                >
                                    <p className="font-semibold text-white/90">{customer.firstName}</p>
                                    <p className="text-white/80">{appointment.items.map(i => services.find(s=>s.id === i.serviceId)?.name).join(', ')}</p>
                                    <p className="text-white/80">{format(startTime, 'HH:mm')} - {format(addMinutes(startTime, appointment.totalDuration || 0), 'HH:mm')}</p>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg">{customer.firstName} {customer.lastName}</h3>
                                     {appointment.items.map((item, index) => {
                                        const service = services.find(s => s.id === item.serviceId);
                                        const barber = barbers.find(b => b.id === item.barberId);
                                        return (
                                            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Scissors className="h-4 w-4" />
                                                <span>{service?.name || 'Serviço'} com {barber?.firstName || 'Barbeiro'}</span>
                                            </div>
                                        )
                                     })}
                                    <Button className="w-full" size="sm" onClick={() => {
                                        // TODO: Implement edit functionality
                                    }}>Editar Agendamento</Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </li>
                )
            })}
          </ol>
        </div>
      </div>
    </div>
  )
}
