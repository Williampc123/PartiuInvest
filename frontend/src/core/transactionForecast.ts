import { FinancialTransaction, FamilyMember } from './types';
import { FamilyBudgetConfig } from '@/features/budget/infrastructure/budgetService';
import { filterTransactionsByPeriod, calculateMemberPayday } from './dateUtils';

export interface ForecastOptions {
  transactions: FinancialTransaction[];
  periodFilter: {
    type: 'month' | 'custom' | 'all';
    yearMonth?: string;
    startDate?: string;
    endDate?: string;
  };
  familyMembers: FamilyMember[];
  budgetConfig: FamilyBudgetConfig | null;
  selectedMemberId?: string;
}

/**
 * Enriquece a lista de transações com itens emulados dinamicamente em memória
 * (Salários previstos e despesas do orçamento familiar) quando não existirem
 * transações físicas gravadas para o mês selecionado.
 */
export function getEnrichedTransactionsForPeriod({
  transactions,
  periodFilter,
  familyMembers,
  budgetConfig,
  selectedMemberId = 'all',
}: ForecastOptions): FinancialTransaction[] {
  // 1. Filtrar transações reais por membro selecionado (preserva movimentações familiares)
  const memberTransactions = selectedMemberId === 'all'
    ? transactions
    : transactions.filter((t) => t.memberId === selectedMemberId || t.visibility === 'family' || t.memberId === 'family');

  // 2. Filtrar transações reais pelo período selecionado
  const realPeriodTransactions = filterTransactionsByPeriod(memberTransactions, periodFilter);

  // Se o filtro não for mensal com yearMonth (ex: '2026-11'), retorna apenas as reais
  if (periodFilter.type !== 'month' || !periodFilter.yearMonth) {
    return realPeriodTransactions;
  }

  const yearMonth = periodFilter.yearMonth;
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  const monthIndex = monthNum - 1;

  const result: FinancialTransaction[] = [...realPeriodTransactions];

  // 3. Emulação de Receitas Salariais dos Membros da Família
  const activeMembers = selectedMemberId === 'all'
    ? familyMembers
    : familyMembers.filter((m) => m.id === selectedMemberId);

  for (const member of activeMembers) {
    // Só emula se o membro tiver renda configurada
    if (!member.monthlyIncomeCents || member.monthlyIncomeCents <= 0) {
      continue;
    }

    // Verifica se já existe transação do salário previsto gravada para este membro no mês alvo
    // (evita falso positivo com outras receitas que usem a categoria "Salário", como vendas ou bônus)
    const hasSalaryRecorded = transactions.some((t) => {
      const isMember = t.memberId === member.id;
      const desc = (t.description || '').toLowerCase();
      const isMainSalary =
        t.id.startsWith(`sal_${member.id}_`) ||
        t.id.startsWith('sal_') ||
        desc.startsWith('salário previsto') ||
        desc.startsWith('salário -') ||
        desc === 'salário';
      const isSameMonth = t.date && t.date.startsWith(yearMonth);
      return isMember && isMainSalary && isSameMonth;
    });

    if (!hasSalaryRecorded) {
      const forecastDate = calculateMemberPayday(
        member.paydayType || 'fifth_business_day',
        member.payday || 5,
        year,
        monthIndex
      );

      result.push({
        id: `virtual_sal_${member.id}_${yearMonth.replace('-', '')}`,
        accountId: 'wallet',
        memberId: member.id,
        visibility: 'family',
        description: `Salário Previsto - ${member.displayName || member.name}`,
        amountCents: Math.abs(member.monthlyIncomeCents),
        category: 'Salário',
        date: forecastDate,
        type: 'income',
        isRecurring: true,
        recurrenceFrequency: 'mensal',
        isPaid: false,
        source: 'manual',
        isVirtual: true,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // 4. Emulação de Despesas do Orçamento Familiar (budgetConfig)
  // Despesas de orçamento são familiares e afetam o planejamento financeiro
  if (
    budgetConfig?.items &&
    budgetConfig.items.length > 0
  ) {
    for (const item of budgetConfig.items) {
      if (!item.amountCents || item.amountCents <= 0 || !item.categoryName.trim()) {
        continue;
      }

      // Se este mês foi suspenso para esta categoria de orçamento, não emula
      if (item.skippedMonths && item.skippedMonths.includes(yearMonth)) {
        continue;
      }

      const cleanCatId = item.categoryName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15);
      const expectedId = `bud_${cleanCatId}_${yearMonth.replace('-', '')}`;

      // Verifica se já existe lançamento de orçamento gravado para esta categoria neste mês
      const hasBudgetRecorded = transactions.some((t) => {
        if (t.id === expectedId) return true;
        const isCat = t.category?.toLowerCase() === item.categoryName.toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const isBudgetDesc =
          t.id.startsWith('bud_') ||
          desc.startsWith('orçamento:') ||
          desc.includes('orçamento:');
        const isSameMonth = t.date && t.date.startsWith(yearMonth);
        return isCat && isBudgetDesc && isSameMonth;
      });

      if (!hasBudgetRecorded) {
        const cleanCatId = item.categoryName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15);
        const maxDaysInTargetMonth = new Date(year, monthIndex + 1, 0).getDate();
        const day = Math.min(Math.max(1, item.dueDay || 10), maxDaysInTargetMonth);
        const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`;

        result.push({
          id: `virtual_bud_${cleanCatId}_${yearMonth.replace('-', '')}`,
          accountId: item.accountId || 'wallet',
          memberId: 'family',
          visibility: 'family',
          description: item.categoryName,
          amountCents: -Math.abs(item.amountCents),
          category: item.categoryName,
          date: dateStr,
          type: 'bill',
          isRecurring: true,
          recurrenceFrequency: 'mensal',
          isPaid: false,
          source: 'manual',
          isVirtual: true,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  // Ordenar cronologicamente por data
  return result.sort((a, b) => {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    return 0;
  });
}
