
'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type Period = 'today' | 'week' | 'month' | 'year';

interface PeriodNavigatorProps {
  period: Period;
  onPeriodChange: (period: Period) => void;
  dateOffset: number;
  onDateOffsetChange: (offset: number) => void;
}

const getPeriodLabel = (period: Period, offset: number): string => {
  const now = new Date();
  switch (period) {
    case 'today':
      return format(addDays(now, offset), "d 'de' MMMM", { locale: ptBR });
    case 'week':
      const weekDate = addWeeks(now, offset);
      return `Semana de ${format(subDays(weekDate, weekDate.getDay()), 'd')} a ${format(addDays(subDays(weekDate, weekDate.getDay()), 6), 'd/MM')}`;
    case 'month':
      return format(addMonths(now, offset), 'MMMM yyyy', { locale: ptBR });
    case 'year':
      return format(addYears(now, offset), 'yyyy', { locale: ptBR });
  }
};

export function PeriodNavigator({ period, onPeriodChange, dateOffset, onDateOffsetChange }: PeriodNavigatorProps) {
  return (
    <div className="flex items-center gap-2">
      <Tabs value={period} onValueChange={(value) => onPeriodChange(value as Period)}>
        <TabsList>
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="month">Mês</TabsTrigger>
          <TabsTrigger value="year">Ano</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-1 rounded-md bg-muted p-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDateOffsetChange(dateOffset - 1)}>
            <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium w-32 text-center">{getPeriodLabel(period, dateOffset)}</span>
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDateOffsetChange(dateOffset + 1)}
            disabled={dateOffset >= 0}
        >
            <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
