import { FinancialTransaction } from './types';

export interface PeriodFilter {
  type: 'month' | 'custom' | 'all';
  yearMonth?: string;
  startDate?: string;
  endDate?: string;
  label?: string;
}

const FIXED_BRAZILIAN_HOLIDAYS = [
  '01-01', // Confraternização Universal
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalhador
  '09-07', // Independência do Brasil
  '10-12', // Nossa Senhora Aparecida
  '11-02', // Finados
  '11-15', // Proclamação da República
  '11-20', // Dia da Consciência Negra
  '12-25', // Natal
];

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function getMonthName(month: number | string): string {
  if (typeof month === 'string') {
    if (month.includes('-')) {
      const parts = month.split('-');
      const m = parseInt(parts[1], 10) - 1;
      return MONTH_NAMES[m] || '';
    }
    const m = parseInt(month, 10) - 1;
    return MONTH_NAMES[m] || '';
  }
  return MONTH_NAMES[month] || '';
}

export function formatYearMonth(yearMonth: string): string {
  if (!yearMonth || !yearMonth.includes('-')) return yearMonth;
  const [y, m] = yearMonth.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} de ${y}`;
}

export function formatPeriodLabel(filter?: PeriodFilter): string {
  if (!filter) return 'Período';
  if (filter.label) return filter.label;
  if (filter.type === 'all') return 'Todo o Período';
  if (filter.type === 'month' && filter.yearMonth) {
    return formatYearMonth(filter.yearMonth);
  }
  if (filter.type === 'custom' && filter.startDate && filter.endDate) {
    const s = formatDateBr(filter.startDate);
    const e = formatDateBr(filter.endDate);
    return `${s} até ${e}`;
  }
  return 'Período';
}

export function filterTransactionsByPeriod(
  transactions: FinancialTransaction[],
  filter: PeriodFilter
): FinancialTransaction[] {
  if (!transactions) return [];
  if (filter.type === 'all') return transactions;

  if (filter.type === 'month' && filter.yearMonth) {
    return transactions.filter((t) => t.date && t.date.startsWith(filter.yearMonth!));
  }

  if (filter.type === 'custom' && filter.startDate && filter.endDate) {
    return transactions.filter((t) => {
      if (!t.date) return false;
      return t.date >= filter.startDate! && t.date <= filter.endDate!;
    });
  }

  return transactions;
}

export function isBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const monthDay = `${mm}-${dd}`;

  if (FIXED_BRAZILIAN_HOLIDAYS.includes(monthDay)) {
    return false;
  }

  return true;
}

export function getFifthBusinessDay(year: number, monthIndex: number): string {
  let businessDaysCount = 0;
  let currentDay = 1;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  let targetDay = 1;

  while (currentDay <= daysInMonth) {
    const candidateDate = new Date(year, monthIndex, currentDay);
    if (isBusinessDay(candidateDate)) {
      businessDaysCount++;
      if (businessDaysCount === 5) {
        targetDay = currentDay;
        break;
      }
    }
    currentDay++;
  }

  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(targetDay).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function calculateMemberPayday(
  paydayType: 'fifth_business_day' | 'fixed_day' = 'fifth_business_day',
  payday: number = 5,
  year: number = new Date().getFullYear(),
  monthIndex: number = new Date().getMonth()
): string {
  if (paydayType === 'fifth_business_day') {
    return getFifthBusinessDay(year, monthIndex);
  }

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const validDay = Math.min(Math.max(1, payday), daysInMonth);

  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(validDay).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function formatDateBr(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [yyyy, mm, dd] = dateStr.split('-');
  return `${dd}/${mm}/${yyyy}`;
}
