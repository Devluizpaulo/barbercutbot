
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { BarberShop, Appointment, Barber } from '@/lib/types';
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
  excludeAppointmentId?: string;
}

export function TimeSlotPicker({ 
    shopId,
    selectedDate, 
    barberIds, 
    serviceDuration,
    selectedValue,
    onValueChange,
    excludeAppointmentId,
}: TimeSlotPickerProps) {
  const firestore = useFirestore();
  const auth = useAuth();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use a local state for shop data to avoid re-renders from useDoc
  const [shop, setShop] = useState<BarberShop | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  
  useEffect(() => {
      const fetchShopAndBarbers = async () => {
          try {
            const shopDoc = await getDoc(doc(firestore, 'barberShops', shopId));
            if (shopDoc.exists()) setShop(shopDoc.data() as BarberShop);
          } catch {}
          try {
            if (!auth?.currentUser) { setBarbers([]); return; }
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`/api/shops/${shopId}/barbers`, { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            setBarbers((json.items || []) as Barber[]);
          } catch {
            setBarbers([]);
          }
      };
      fetchShopAndBarbers();
  }, [firestore, shopId, auth]);


  const toDate = (ts: Timestamp | Date | string): Date => {
    if ((ts as any)?.toDate) return (ts as any).toDate();
    return new Date(ts as any);
  };

  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const intersectSegments = (a: Array<[number, number]>, b: Array<[number, number]>) => {
    const res: Array<[number, number]> = [];
    let i = 0, j = 0;
    const A = a.slice().sort((x, y) => x[0] - y[0]);
    const B = b.slice().sort((x, y) => x[0] - y[0]);
    while (i < A.length && j < B.length) {
      const start = Math.max(A[i][0], B[j][0]);
      const end = Math.min(A[i][1], B[j][1]);
      if (start < end) res.push([start, end]);
      if (A[i][1] < B[j][1]) i++; else j++;
    }
    return res;
  };

  const subtractSegments = (base: Array<[number, number]>, removes: Array<[number, number]>) => {
    let result = base.slice();
    for (const r of removes) {
      const tmp: Array<[number, number]> = [];
      for (const [s, e] of result) {
        if (r[1] <= s || r[0] >= e) {
          tmp.push([s, e]);
        } else {
          if (r[0] > s) tmp.push([s, Math.max(s, Math.min(r[0], e))]);
          if (r[1] < e) tmp.push([Math.max(r[1], s), e]);
        }
      }
      result = tmp;
    }
    return result;
  };

  useEffect(() => {
    const calculateAvailableSlots = async () => {
      setIsLoading(true);

      const dayOfWeek = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' }).split(',')[0];
      const defaultWH = { day: dayOfWeek, open: '08:00', close: '20:00', enabled: true };
      const workingHours = shop?.workingHours?.find(wh => wh.day.toLowerCase() === dayOfWeek.toLowerCase()) || defaultWH as any;

      if (!workingHours || !workingHours.enabled) {
        setAvailableSlots([]);
        setIsLoading(false);
        return;
      }
      
      const startDateTime = startOfDay(selectedDate);
      const endDateTime = endOfDay(selectedDate);
      
      let existingAppointments: Appointment[] = [];
      try {
        if (barberIds.length > 0 && auth?.currentUser) {
            const token = await auth.currentUser.getIdToken();
            const params = new URLSearchParams({
              start: startDateTime.toISOString(),
              end: endDateTime.toISOString(),
              barberIds: barberIds.join(','),
            });
            const res = await fetch(`/api/shops/${shopId}/appointments?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            const allAppointments = (json.items || []) as Appointment[];
            existingAppointments = allAppointments.filter(appt => {
              const status = (appt as any).status || 'confirmed';
              const isBlocking = status !== 'cancelled';
              const isSameAsEditing = excludeAppointmentId && (appt as any).id === excludeAppointmentId;
              return isBlocking && !isSameAsEditing;
            });
        }
      } catch (err) {
        console.error('[TimeSlotPicker] Falha ao buscar agendamentos, usando slots sem bloqueios:', err);
        existingAppointments = [];
      }
      
      const bufferMin = (shop as any)?.defaultBufferMinutes ?? 5;
      const busySlots: { start: number, end: number }[] = existingAppointments.map(appt => {
        const startTime = toDate(appt.startTime as any);
        const endTime = toDate(appt.endTime as any);
        return {
          start: startTime.getTime() - bufferMin * 60000,
          end: endTime.getTime() + bufferMin * 60000,
        };
      });

      const shopSeg: Array<[number, number]> = [[toMinutes(workingHours.open), toMinutes(workingHours.close)]];

      let intersectionSeg = shopSeg;
      if (barberIds.length > 0 && barbers) {
        const selectedBarbers = barbers.filter(b => barberIds.includes(b.id));

        for (const bdata of selectedBarbers) {
          const dayName = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' }).split(',')[0]?.toLowerCase();
          const bwh = (bdata as any).workingHours?.find((wh: any) => wh.day?.toLowerCase() === dayName);
          let segs: Array<[number, number]> = shopSeg;
          if (bwh?.enabled !== false && bwh?.open && bwh?.close) {
            segs = intersectSegments(shopSeg, [[toMinutes(bwh.open), toMinutes(bwh.close)]]);
          }
          
          const bbreaks = ((bdata as any).breaks || []).filter((br: any) => !br.day || br.day?.toLowerCase() === dayName)
            .map((br: any) => [toMinutes(br.start), toMinutes(br.end)]) as Array<[number, number]>;
          segs = subtractSegments(segs, bbreaks);
          
          intersectionSeg = intersectSegments(intersectionSeg, segs);
        }
      }

      const effectiveDuration = (serviceDuration && serviceDuration > 0) ? serviceDuration : ((shop as any)?.defaultSlotDuration || 30);
      const slots: string[] = [];
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0,0,0,0);
      for (let minutes = 0; minutes <= 24*60; minutes += 15) {
        const slotStartMin = minutes;
        const slotEndMin = minutes + effectiveDuration;
        
        const inside = intersectionSeg.some(([s,e]) => slotStartMin >= s && slotEndMin <= e);
        if (!inside) continue;
        
        const slotStart = dayStart.getTime() + slotStartMin*60000;
        const slotEnd = dayStart.getTime() + slotEndMin*60000;
        
        const isOverlapping = busySlots.some(busy => slotStart < busy.end && slotEnd > busy.start);
        if (!isOverlapping) {
          const date = new Date(slotStart);
          slots.push(format(date, 'HH:mm'));
        }
      }
      
      setAvailableSlots(slots);
      setIsLoading(false);
    };

    calculateAvailableSlots();
  }, [selectedDate, barberIds, serviceDuration, shop, firestore, shopId, barbers, excludeAppointmentId, auth]);
  
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
