
import { 
    startOfDay, endOfDay, 
    startOfWeek, endOfWeek, 
    startOfMonth, endOfMonth, 
    startOfYear, endOfYear, 
    addDays, addWeeks, addMonths, addYears
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type Period = 'today' | 'week' | 'month' | 'year';

export function calculateInterval(period: Period, offset: number): { start: Date; end: Date } {
    const now = new Date();
    let targetDate: Date;

    switch (period) {
        case 'today':
            targetDate = addDays(now, offset);
            return { start: startOfDay(targetDate), end: endOfDay(targetDate) };
        case 'week':
            targetDate = addWeeks(now, offset);
            return { start: startOfWeek(targetDate, { locale: ptBR }), end: endOfWeek(targetDate, { locale: ptBR }) };
        case 'month':
            targetDate = addMonths(now, offset);
            return { start: startOfMonth(targetDate), end: endOfMonth(targetDate) };
        case 'year':
            targetDate = addYears(now, offset);
            return { start: startOfYear(targetDate), end: endOfYear(targetDate) };
    }
}
