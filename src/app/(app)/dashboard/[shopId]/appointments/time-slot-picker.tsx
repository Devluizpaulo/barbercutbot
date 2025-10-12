
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { BarberShop, Appointment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay } from 'date-fns';

interface TimeSlotPickerProps {
  shopId: string;
  selectedDate: Date;
  barberIds: string[];
  serviceDuration: number;
  selectedValue: string;
  onValueChange: (value: string) => void;
}

export function TimeSlotPicker({ 
    shopId,
    selectedDate, 
    barberIds, 
    serviceDuration,
    selectedValue,
    onValueChange
}: TimeSlotPickerProps) {
  const firestore = useFirestore();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const shopRef = useMemoFirebase(() => doc(firestore, 'barberShops', shopId), [firestore, shopId]);
  const { data: shop } = useDoc<BarberShop>(shopRef);

  useEffect(() => {
    const calculateAvailableSlots = async () => {
      if (!shop?.workingHours || barberIds.length === 0) {
        setAvailableSlots([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      const dayOfWeek = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' }).split(',')[0];
      const workingHours = shop.workingHours.find(wh => wh.day.toLowerCase() === dayOfWeek.toLowerCase());

      if (!workingHours || !workingHours.enabled) {
        setAvailableSlots([]);
        setIsLoading(false);
        return;
      }
      
      const startDateTime = startOfDay(selectedDate);
      const endDateTime = endOfDay(selectedDate);
      
      const appointmentsRef = collection(firestore, 'barberShops', shopId, 'appointments');
      const q = query(
        appointmentsRef,
        where('barberId', 'in', barberIds),
        where('startTime', '>=', Timestamp.fromDate(startDateTime)),
        where('startTime', '<=', Timestamp.fromDate(endDateTime))
      );

      const querySnapshot = await getDocs(q);
      const existingAppointments = querySnapshot.docs.map(doc => doc.data() as Appointment);
      
      const busySlots: { start: number, end: number }[] = existingAppointments.map(appt => {
        const startTime = (appt.startTime as Timestamp).toDate();
        const endTime = (appt.endTime as Timestamp).toDate();
        return { start: startTime.getTime(), end: endTime.getTime() };
      });

      const slots: string[] = [];
      const [startHour, startMinute] = workingHours.open.split(':').map(Number);
      const [endHour, endMinute] = workingHours.close.split(':').map(Number);

      let currentTime = new Date(selectedDate);
      currentTime.setHours(startHour, startMinute, 0, 0);

      const endTime = new Date(selectedDate);
      endTime.setHours(endHour, endMinute, 0, 0);

      while (currentTime.getTime() + serviceDuration * 60000 <= endTime.getTime()) {
        const slotStart = currentTime.getTime();
        const slotEnd = slotStart + serviceDuration * 60000;
        
        const isOverlapping = busySlots.some(busy => 
            slotStart < busy.end && slotEnd > busy.start
        );

        if (!isOverlapping) {
          slots.push(format(currentTime, 'HH:mm'));
        }

        currentTime.setMinutes(currentTime.getMinutes() + 15);
      }
      
      setAvailableSlots(slots);
      setIsLoading(false);
    };

    calculateAvailableSlots();
  }, [selectedDate, barberIds, serviceDuration, shop, firestore, shopId]);
  
  if (isLoading) {
    return (
        <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
    )
  }

  if (availableSlots.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Nenhum horário disponível para a data ou profissionais selecionados.</p>
  }
  
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {availableSlots.map(slot => (
        <Button
          key={slot}
          type="button"
          variant={selectedValue === slot ? 'default' : 'outline'}
          className={cn('w-full', selectedValue === slot && 'ring-2 ring-ring ring-offset-2')}
          onClick={() => onValueChange(slot)}
        >
          {slot}
        </Button>
      ))}
    </div>
  );
}
