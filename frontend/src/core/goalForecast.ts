import { FinancialGoal } from '@/features/budget/infrastructure/budgetService';
import { BoxGoal, FinancialTransaction } from '@/core/types';
import { Money } from '@/core/Money';

export interface GoalForecastOptions {
  goal: FinancialGoal;
  currentBalanceCents: number;
  transactions: FinancialTransaction[];
  boxes?: BoxGoal[];
  now?: Date;
}

export type ForecastStatusVariant = 'success' | 'warning' | 'danger' | 'neutral';

export interface GoalForecastResult {
  targetCents: number;
  currentCents: number;
  remainingCents: number;
  percent: number;
  rawPercent: number;
  isCompleted: boolean;
  daysRemaining: number | null;
  monthsRemaining: number | null;

  // Métricas da Movimentação Atual
  monthlyPaceCents: number;
  requiredMonthlyCents: number;
  monthlyDeficitCents: number;
  recentMonthsCount: number;

  // Projeção
  willReachOnTime: boolean;
  estimatedMonthsToReach: number | null;
  estimatedCompletionDateStr: string | null;
  diffMonthsWithDeadline: number | null;

  // Status visual para UI
  statusBadge: {
    label: string;
    variant: ForecastStatusVariant;
  };
  headline: string;
  detailMessage: string;
}

const SHORT_MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

/**
 * Calcula a previsão de atingimento de uma meta financeira (especialmente 'total_amount')
 * com base na movimentação financeira real recente vinculada à origem da meta.
 */
export function calculateGoalForecast({
  goal,
  currentBalanceCents,
  transactions,
  boxes = [],
  now = new Date(),
}: GoalForecastOptions): GoalForecastResult {
  const targetCents = Math.max(0, goal.targetAmountCents || 0);
  const currentCents = Math.max(0, currentBalanceCents || 0);
  const remainingCents = Math.max(0, targetCents - currentCents);
  const rawPercent = targetCents > 0 ? (currentCents / targetCents) * 100 : 0;
  const percent = Math.min(100, Math.max(0, rawPercent));
  const isCompleted = currentCents >= targetCents && targetCents > 0;

  // 1. Cálculo de Dias e Meses restantes até a Data Alvo
  let daysRemaining: number | null = null;
  let monthsRemaining: number | null = null;
  let targetDateFormatted = '';

  if (goal.targetDate) {
    const [yStr, mStr, dStr] = goal.targetDate.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const d = parseInt(dStr, 10);

    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const targetD = new Date(y, m - 1, d);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffTime = targetD.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const diffYears = targetD.getFullYear() - today.getFullYear();
      const diffMonths = targetD.getMonth() - today.getMonth();
      const totalMonths = diffYears * 12 + diffMonths;
      monthsRemaining = Math.max(1, totalMonths);

      targetDateFormatted = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
  }

  // 2. Extrair movimentação financeira mensal relevante
  let boxName = '';
  if (goal.originType === 'box' && goal.originId) {
    const foundBox = boxes.find((b) => b.id === goal.originId);
    if (foundBox) boxName = foundBox.name.toLowerCase();
  }

  // Agrupar transações efetuadas por mês (YYYY-MM)
  const monthlyMovements: Record<string, number> = {};

  transactions.forEach((t) => {
    if (!t.date || t.isPaid === false) return;
    const yearMonth = t.date.slice(0, 7);
    if (!yearMonth || yearMonth.length !== 7) return;

    const desc = (t.description || '').toLowerCase();
    const cat = (t.category || '').toLowerCase();
    const amt = t.amountCents || 0;

    let movementAmount = 0;

    if (goal.originType === 'box') {
      const isBoxRelated =
        (boxName && desc.includes(boxName)) ||
        cat.includes('caixinha') ||
        cat.includes('investimento');

      if (isBoxRelated) {
        if (t.type === 'income' || amt > 0) {
          movementAmount = Math.abs(amt);
        } else if (desc.includes('resgate') || desc.includes('retirada') || amt < 0) {
          movementAmount = -Math.abs(amt);
        }
      }
    } else if (goal.originType === 'account') {
      if (t.accountId === goal.originId) {
        movementAmount = (t.type === 'expense' || t.type === 'bill' || amt < 0)
          ? -Math.abs(amt)
          : Math.abs(amt);
      }
    } else {
      // Patrimônio Total Familiar
      // Poupança líquida (receitas - despesas) ou aportes em investimentos
      if (t.type === 'income' || amt > 0) {
        movementAmount = Math.abs(amt);
      } else if (t.type === 'expense' || t.type === 'bill' || amt < 0) {
        movementAmount = -Math.abs(amt);
      }
    }

    if (movementAmount !== 0) {
      monthlyMovements[yearMonth] = (monthlyMovements[yearMonth] || 0) + movementAmount;
    }
  });

  // Obter média mensal das movimentações positivas dos meses recentes (até 6 meses)
  const sortedMonths = Object.keys(monthlyMovements).sort().reverse().slice(0, 6);
  const recentMonthsCount = sortedMonths.length;

  let monthlyPaceCents = 0;
  if (recentMonthsCount > 0) {
    const totalRecentCents = sortedMonths.reduce((sum, ym) => sum + monthlyMovements[ym], 0);
    // Considerar ritmo médio caso tenha saldo líquido positivo
    monthlyPaceCents = Math.max(0, Math.round(totalRecentCents / recentMonthsCount));
  }

  // 3. Necessidade mensal para atingir a meta no prazo
  const effectiveMonths = monthsRemaining !== null ? Math.max(1, monthsRemaining) : 12;
  const requiredMonthlyCents = remainingCents > 0
    ? Math.ceil(remainingCents / effectiveMonths)
    : 0;

  // 4. Projeção de conclusão
  let willReachOnTime = false;
  let estimatedMonthsToReach: number | null = null;
  let estimatedCompletionDateStr: string | null = null;
  let diffMonthsWithDeadline: number | null = null;
  const monthlyDeficitCents = Math.max(0, requiredMonthlyCents - monthlyPaceCents);

  if (isCompleted) {
    willReachOnTime = true;
  } else if (monthlyPaceCents > 0) {
    estimatedMonthsToReach = Math.ceil(remainingCents / monthlyPaceCents);
    const estDate = new Date(now.getFullYear(), now.getMonth() + estimatedMonthsToReach, 1);
    estimatedCompletionDateStr = `${SHORT_MONTHS[estDate.getMonth()]}/${estDate.getFullYear()}`;

    if (monthsRemaining !== null) {
      diffMonthsWithDeadline = monthsRemaining - estimatedMonthsToReach;
      willReachOnTime = estimatedMonthsToReach <= monthsRemaining;
    } else {
      willReachOnTime = true;
    }
  } else {
    willReachOnTime = false;
  }

  // 5. Geração de Textos e Badges de Status
  let statusBadge: { label: string; variant: ForecastStatusVariant } = {
    label: 'Em andamento',
    variant: 'neutral',
  };
  let headline = '';
  let detailMessage = '';

  if (isCompleted) {
    statusBadge = { label: 'Meta Atingida!', variant: 'success' };
    headline = '🎉 Parabéns! Meta concluída';
    detailMessage = `O saldo acumulado na origem (${Money.formatCents(currentCents)}) já atingiu o objetivo de ${Money.formatCents(targetCents)}.`;
  } else if (daysRemaining !== null && daysRemaining <= 0) {
    statusBadge = { label: 'Prazo Encerrado', variant: 'danger' };
    headline = '⚠️ Prazo da meta encerrado';
    detailMessage = `A data alvo (${targetDateFormatted}) foi atingida com saldo de ${Money.formatCents(currentCents)} (${rawPercent.toFixed(1)}%). Faltaram ${Money.formatCents(remainingCents)} para concluir.`;
  } else if (willReachOnTime) {
    const earlyNote = diffMonthsWithDeadline && diffMonthsWithDeadline > 0
      ? ` (~${diffMonthsWithDeadline} ${diffMonthsWithDeadline === 1 ? 'mês' : 'meses'} antes do prazo)`
      : ' rigorosamente dentro do prazo';

    statusBadge = { label: 'Vai atingir no prazo!', variant: 'success' };
    headline = '📈 No ritmo para atingir a meta no prazo!';
    detailMessage = `Com base na movimentação atual de ${Money.formatCents(monthlyPaceCents)}/mês, a meta será alcançada em ${estimatedCompletionDateStr}${earlyNote}. O valor mínimo necessário é ${Money.formatCents(requiredMonthlyCents)}/mês.`;
  } else if (monthlyPaceCents > 0) {
    const delayMonths = diffMonthsWithDeadline ? Math.abs(diffMonthsWithDeadline) : 0;
    const delayNote = delayMonths > 0
      ? ` (previsão de atraso de ~${delayMonths} ${delayMonths === 1 ? 'mês' : 'meses'})`
      : '';

    statusBadge = { label: 'Não atingirá no prazo', variant: 'warning' };
    headline = '⚠️ Ritmo atual insuficiente para a Data Alvo';
    detailMessage = `No ritmo atual de ${Money.formatCents(monthlyPaceCents)}/mês, a conclusão ocorreria apenas em ${estimatedCompletionDateStr}${delayNote}. Para atingir a meta até ${targetDateFormatted || 'o prazo'}, é necessário poupar ${Money.formatCents(requiredMonthlyCents)}/mês (+${Money.formatCents(monthlyDeficitCents)}/mês além do ritmo atual).`;
  } else {
    statusBadge = { label: 'Ritmo Insuficiente', variant: 'warning' };
    headline = '💡 Sem movimentação recente positiva';
    detailMessage = `Não foram identificadas movimentações positivas recentes nesta origem. Para atingir os ${Money.formatCents(targetCents)} até ${targetDateFormatted || 'a data alvo'} (${daysRemaining || 0} dias restantes), é necessário guardar em média ${Money.formatCents(requiredMonthlyCents)} / mês.`;
  }

  return {
    targetCents,
    currentCents,
    remainingCents,
    percent,
    rawPercent,
    isCompleted,
    daysRemaining,
    monthsRemaining,
    monthlyPaceCents,
    requiredMonthlyCents,
    monthlyDeficitCents,
    recentMonthsCount,
    willReachOnTime,
    estimatedMonthsToReach,
    estimatedCompletionDateStr,
    diffMonthsWithDeadline,
    statusBadge,
    headline,
    detailMessage,
  };
}
