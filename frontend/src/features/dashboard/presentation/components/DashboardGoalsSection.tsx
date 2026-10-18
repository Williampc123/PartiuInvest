import React, { useState, useMemo } from 'react';
import {
  Target,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Landmark,
  ArrowRight,
  Plus,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  PiggyBank,
} from 'lucide-react';
import { FinancialGoal } from '@/features/budget/infrastructure/budgetService';
import { BoxGoal, BankAccount, FinancialTransaction } from '@/core/types';
import { Money } from '@/core/Money';

interface DashboardGoalsSectionProps {
  goals: FinancialGoal[];
  boxes: BoxGoal[];
  accounts: BankAccount[];
  transactions: FinancialTransaction[];
  totalNetWorthCents: number;
  onOpenBudgetModal: () => void;
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export const DashboardGoalsSection: React.FC<DashboardGoalsSectionProps> = ({
  goals,
  boxes,
  accounts,
  transactions,
  totalNetWorthCents,
  onOpenBudgetModal,
}) => {
  const [activeGoalId, setActiveGoalId] = useState<string>(() => goals[0]?.id || '');
  const [chartYear, setChartYear] = useState<number>(() => new Date().getFullYear());
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredYearIndex, setHoveredYearIndex] = useState<number | null>(null);

  const handlePrevYear = () => setChartYear((prev) => prev - 1);
  const handleNextYear = () => setChartYear((prev) => prev + 1);
  const handleResetCurrentYear = () => setChartYear(new Date().getFullYear());

  // Sincronizar activeGoalId quando a lista mudar
  const currentGoal = useMemo(() => {
    if (!goals || goals.length === 0) return null;
    return goals.find((g) => g.id === activeGoalId) || goals[0];
  }, [goals, activeGoalId]);

  // ========================================================
  // CÁLCULOS PARA A META ATIVA (HOOKS SEMPRE NO TOPO)
  // ========================================================

  // 1. Saldo atual na origem da meta
  const currentOriginBalanceCents = useMemo(() => {
    if (!currentGoal) return 0;

    if (currentGoal.originType === 'net_worth') {
      return totalNetWorthCents;
    }
    if (currentGoal.originType === 'box') {
      const box = boxes.find((b) => b.id === currentGoal.originId);
      return box ? box.currentBalanceCents : 0;
    }
    if (currentGoal.originType === 'account') {
      const acc = accounts.find((a) => a.id === currentGoal.originId);
      return acc ? acc.balanceCents : 0;
    }
    return 0;
  }, [currentGoal, totalNetWorthCents, boxes, accounts]);

  // 2. Nome amigável da origem
  const originDisplayName = useMemo(() => {
    if (!currentGoal) return '';
    if (currentGoal.originType === 'net_worth') return 'Patrimônio Total Familiar';
    if (currentGoal.originType === 'box') {
      const box = boxes.find((b) => b.id === currentGoal.originId);
      return box ? `Caixinha: ${box.name}` : currentGoal.originName || 'Caixinha';
    }
    if (currentGoal.originType === 'account') {
      const acc = accounts.find((a) => a.id === currentGoal.originId);
      return acc ? `Conta: ${acc.name}` : currentGoal.originName || 'Conta Bancária';
    }
    return currentGoal.originName || 'Origem';
  }, [currentGoal, boxes, accounts]);

  // 3. Cálculos de progresso para "Valor em dinheiro total"
  const totalAmountStats = useMemo(() => {
    if (!currentGoal || currentGoal.type !== 'total_amount') return null;

    const targetCents = currentGoal.targetAmountCents || 0;
    const currentCents = currentOriginBalanceCents;
    const percent = targetCents > 0 ? (currentCents / targetCents) * 100 : 0;
    const remainingCents = Math.max(0, targetCents - currentCents);

    // Calcular dias restantes até a data alvo
    let daysRemaining = null;
    if (currentGoal.targetDate) {
      const [y, m, d] = currentGoal.targetDate.split('-').map(Number);
      const targetD = new Date(y, m - 1, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = targetD.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      targetCents,
      currentCents,
      percent: Math.min(100, Math.max(0, percent)),
      rawPercent: percent,
      remainingCents,
      isCompleted: currentCents >= targetCents && targetCents > 0,
      daysRemaining,
    };
  }, [currentGoal, currentOriginBalanceCents]);

  // 4. Cálculos para "Investimentos mensais" (Navegação por Anos e Projeção Futura)
  const monthlyStats = useMemo(() => {
    if (!currentGoal || currentGoal.type !== 'monthly_investment') return null;

    const currentRealYear = new Date().getFullYear();
    const currentRealMonthIdx = new Date().getMonth(); // 0 a 11
    const targetMonthlyCents = currentGoal.targetAmountCents || 0;
    const returnRateAnnual = currentGoal.returnRateAnnual !== undefined ? currentGoal.returnRateAnnual : 8;
    const monthlyRate = Math.pow(1 + returnRateAnnual / 100, 1 / 12) - 1;

    // Buscar nome da caixinha para correspondência precisa de transações
    let boxName = '';
    if (currentGoal.originType === 'box') {
      const foundBox = boxes.find((b) => b.id === currentGoal.originId);
      boxName = foundBox ? foundBox.name.toLowerCase() : '';
    }

    // Calcular montante acumulado esperado inicial antes de chartYear (para anos futuros)
    const yearsDiff = chartYear - currentRealYear;
    let initialExpectedCents = 0;
    if (yearsDiff > 0 && monthlyRate > 0) {
      const pastMonthsCount = yearsDiff * 12;
      initialExpectedCents = targetMonthlyCents * ((Math.pow(1 + monthlyRate, pastMonthsCount) - 1) / monthlyRate);
    }

    let runningAccumulatedExpectedCents = initialExpectedCents;
    let runningAccumulatedActualCents = 0;

    const monthsData = MONTH_NAMES_SHORT.map((mShort, idx) => {
      const monthNumberStr = String(idx + 1).padStart(2, '0');
      const yearMonth = `${chartYear}-${monthNumberStr}`;

      const isPastOrCurrent = chartYear < currentRealYear || (chartYear === currentRealYear && idx <= currentRealMonthIdx);

      // Apenas transações que foram efetuadas (Recebido / isPaid === true) e enviadas para a caixinha / investimentos
      const monthTransactions = transactions.filter((t) => {
        if (!t.date || !t.date.startsWith(yearMonth)) return false;

        // "na movimentação tem o registro de quanto foi para a caixinha e se foi efetuada (Recebido)"
        const isEffected = t.isPaid === true;
        if (!isEffected) return false;

        // Apenas transações de entrada/aporte recebido na caixinha (evita duplicar com a saída/débito da conta bancária)
        const isReceivedInflow = (t.amountCents || 0) > 0 || t.type === 'income';
        if (!isReceivedInflow) return false;

        const desc = (t.description || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();

        if (currentGoal.originType === 'box' && boxName) {
          return desc.includes(boxName) || cat.includes('caixinha') || cat.includes('investimento');
        }
        if (currentGoal.originType === 'account') {
          return t.accountId === currentGoal.originId;
        }
        // Patrimônio total: qualquer aporte em investimento ou caixinha recebido
        return cat.includes('investimento') || cat.includes('caixinha') || desc.includes('aporte');
      });

      // Soma do valor efetivamente enviado no mês (em centavos)
      const actualSentMonthCents = monthTransactions.reduce((sum, t) => {
        const amt = Math.abs(t.amountCents || 0);
        return sum + amt;
      }, 0);

      // Montante que DEVERIA ter até este mês (composta com taxa informada)
      runningAccumulatedExpectedCents = (runningAccumulatedExpectedCents + targetMonthlyCents) * (1 + monthlyRate);
      runningAccumulatedActualCents += actualSentMonthCents;

      return {
        month: mShort,
        yearMonth,
        isPastOrCurrent,
        targetMonthlyCents,
        actualSentMonthCents,
        accumulatedExpectedCents: Math.round(runningAccumulatedExpectedCents),
        accumulatedActualCents: runningAccumulatedActualCents,
        achievedTarget: actualSentMonthCents >= targetMonthlyCents && targetMonthlyCents > 0,
      };
    });

    // Média mensal efetiva enviada até o mês corrente
    const pastMonths = monthsData.filter((m) => m.isPastOrCurrent);
    const totalActualSoFar = pastMonths.reduce((sum, m) => sum + m.actualSentMonthCents, 0);
    const avgMonthlyActualCents = pastMonths.length > 0 ? Math.round(totalActualSoFar / pastMonths.length) : targetMonthlyCents;

    // ========================================================
    // PREVISÃO FUTURA: 10, 20, 30 ANOS COM JUROS COMPOSTOS
    // ========================================================
    const baseInitialCents = currentOriginBalanceCents;
    const pmtPlannedCents = targetMonthlyCents;
    const pmtActualCents = avgMonthlyActualCents > 0 ? avgMonthlyActualCents : targetMonthlyCents;

    const calculateFutureValue = (pmt: number, years: number) => {
      const n = years * 12;
      const fvPrincipal = baseInitialCents * Math.pow(1 + monthlyRate, n);
      const fvAnnuity = monthlyRate > 0 ? pmt * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate) : pmt * n;
      const totalAmount = Math.round(fvPrincipal + fvAnnuity);
      const totalInvested = Math.round(baseInitialCents + pmt * n);
      const totalInterest = Math.max(0, totalAmount - totalInvested);
      return { totalAmount, totalInvested, totalInterest };
    };

    const projectionYears = [1, 2, 3, 5, 10, 15, 20, 25, 30];
    const projections = projectionYears.map((years) => {
      const planned = calculateFutureValue(pmtPlannedCents, years);
      const actual = calculateFutureValue(pmtActualCents, years);
      return {
        years,
        label: `${years} ${years === 1 ? 'ano' : 'anos'}`,
        planned,
        actual,
      };
    });

    return {
      targetMonthlyCents,
      returnRateAnnual,
      monthlyRate,
      monthsData,
      avgMonthlyActualCents,
      projections,
    };
  }, [currentGoal, currentOriginBalanceCents, transactions, boxes, chartYear]);

  // Se não houver metas configuradas ainda (renderizado com segurança após todos os hooks)
  if (!goals || goals.length === 0) {
    return (
      <section aria-labelledby="goals-section-title" className="card col-span-12 p-6 sm:p-7 border border-navy/10 shadow-sm rounded-3xl bg-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gold/20 text-gold-deep border border-gold/40 shadow-sm shrink-0">
              <Target className="h-7 w-7" />
            </span>
            <div>
              <span className="pill bg-gold/20 text-gold-deep text-[10px] font-extrabold uppercase tracking-wide">
                🎯 Planejamento Financeiro
              </span>
              <h2 id="goals-section-title" className="text-xl sm:text-2xl font-black text-navy leading-tight mt-0.5">
                Metas Financeiras
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-xl mt-1">
                Defina metas de <b>Valor em dinheiro total</b> ou <b>Investimentos mensais</b> para acompanhar o progresso em tempo real e visualizar previsões de 10 a 30 anos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenBudgetModal}
            className="btn-gold text-xs sm:text-sm h-11 px-5 font-bold shadow-md flex items-center gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Criar Primeira Meta</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="goals-section-title" className="card col-span-12 p-5 sm:p-7 border border-navy/10 shadow-sm rounded-3xl bg-white space-y-6">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-navy/10">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold/20 text-gold-deep border border-gold/40 shadow-sm shrink-0">
            <Target className="h-6 w-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="pill bg-gold/20 text-gold-deep text-[10px] font-extrabold uppercase tracking-wide">
                🎯 Metas Financeiras
              </span>
              <span className="text-xs font-bold text-muted">
                {goals.length} {goals.length === 1 ? 'meta configurada' : 'metas configuradas'}
              </span>
            </div>
            <h2 id="goals-section-title" className="text-xl sm:text-2xl font-black text-navy leading-tight mt-0.5">
              Acompanhamento de Metas & Projeção Futura
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenBudgetModal}
          className="btn-line text-xs h-9 px-3.5 gap-1.5 border-navy/20 hover:border-gold hover:text-gold-deep font-bold"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Gerenciar Metas</span>
        </button>
      </div>

      {/* Navegação por Abas das Metas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {goals.map((g) => {
          const isActive = g.id === activeGoalId;
          const isMonthly = g.type === 'monthly_investment';

          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setActiveGoalId(g.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 shrink-0 border ${
                isActive
                  ? 'bg-navy text-white border-navy shadow-[0_8px_16px_-4px_rgba(10,31,68,.3)]'
                  : 'bg-white text-muted hover:text-navy border-navy/10 hover:border-navy/25 hover:bg-navy/[0.02]'
              }`}
            >
              <span
                className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-gold text-navy-deep'
                    : isMonthly
                    ? 'bg-gold/20 text-gold-deep'
                    : 'bg-navy/10 text-navy'
                }`}
              >
                {isMonthly ? <TrendingUp className="h-3.5 w-3.5" /> : <DollarSign className="h-3.5 w-3.5" />}
              </span>
              <span className="max-w-[160px] truncate">{g.title}</span>
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-navy/5 text-muted'
                }`}
              >
                {isMonthly ? 'Investimento' : 'Montante'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo da Meta Ativa */}
      {currentGoal && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Card Resumo do Topo */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-navy/[0.03] via-navy/[0.01] to-transparent border border-navy/10 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-navy">{currentGoal.title}</h3>
                <span className="pill bg-gold/20 text-gold-deep text-[10px] font-bold">
                  {currentGoal.type === 'monthly_investment' ? 'Investimento Recorrente' : 'Valor Total em Dinheiro'}
                </span>
              </div>
              <p className="text-xs text-muted flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-navy/60" />
                <span>Origem vinculada: <b>{originDisplayName}</b></span>
              </p>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-right">
                <small className="block text-[11px] text-muted">Saldo Atual na Origem</small>
                <b className="text-base sm:text-lg font-black text-navy">
                  {Money.formatCents(currentOriginBalanceCents)}
                </b>
              </div>

              <div className="text-right border-l border-navy/10 pl-4 sm:pl-6">
                <small className="block text-[11px] text-muted">
                  {currentGoal.type === 'monthly_investment' ? 'Meta Mensal' : 'Meta Alvo'}
                </small>
                <b className="text-base sm:text-lg font-black text-gold-deep">
                  {Money.formatCents(currentGoal.targetAmountCents)}
                  {currentGoal.type === 'monthly_investment' && <span className="text-xs font-normal text-muted"> / mês</span>}
                </b>
              </div>

              {currentGoal.targetDate && (
                <div className="text-right border-l border-navy/10 pl-4 sm:pl-6 hidden md:block">
                  <small className="block text-[11px] text-muted">Data Alvo</small>
                  <b className="text-sm font-bold text-navy flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted" />
                    {currentGoal.targetDate.split('-').reverse().join('/')}
                  </b>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================
              TIPO 1: VALOR EM DINHEIRO TOTAL
              ======================================================== */}
          {currentGoal.type === 'total_amount' && totalAmountStats && (
            <div className="space-y-5">
              {/* Linha do 0 até o Valor Definido */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-navy/10 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-extrabold text-navy">
                      Progresso da Meta: 0 até {Money.formatCents(totalAmountStats.targetCents)}
                    </h4>
                    <p className="text-xs text-muted">
                      Comparação em tempo real do saldo acumulado na origem com o valor alvo da meta.
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black text-navy">
                      {totalAmountStats.rawPercent.toFixed(1)}%
                    </span>
                    <span className="text-xs font-semibold text-muted ml-1">concluído</span>
                  </div>
                </div>

                {/* Régua e Barra Visual */}
                <div className="space-y-2 pt-2">
                  <div className="relative h-6 w-full rounded-full bg-navy/[0.06] border border-navy/10 overflow-visible shadow-inner">
                    {/* Barra de preenchimento */}
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-navy via-navy-light to-gold transition-all duration-700 shadow-sm"
                      style={{ width: `${totalAmountStats.percent}%` }}
                    />

                    {/* Marcador flutuante da posição atual */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700 pointer-events-none"
                      style={{ left: `${totalAmountStats.percent}%` }}
                    >
                      <div className="h-9 w-9 rounded-full bg-white border-4 border-gold shadow-md flex items-center justify-center">
                        <i className="h-2 w-2 rounded-full bg-navy-deep" />
                      </div>
                    </div>
                  </div>

                  {/* Marcadores da Régua (0 até Meta) */}
                  <div className="flex items-center justify-between text-xs font-bold text-muted pt-1">
                    <div className="flex flex-col items-start">
                      <span className="text-[11px] text-muted/80">Início</span>
                      <span className="text-navy font-extrabold">R$ 0,00</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[11px] text-muted/80">Saldo Atual</span>
                      <span className="text-gold-deep font-extrabold">
                        {Money.formatCents(totalAmountStats.currentCents)}
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[11px] text-muted/80">Meta Alvo</span>
                      <span className="text-navy font-extrabold">
                        {Money.formatCents(totalAmountStats.targetCents)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cards Informativos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                  <div className="p-3.5 rounded-xl bg-navy/[0.02] border border-navy/10">
                    <span className="text-[11px] font-semibold text-muted block">Status Atual</span>
                    <b className="text-sm font-bold text-navy flex items-center gap-1.5 mt-0.5">
                      {totalAmountStats.isCompleted ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-ok" />
                          <span className="text-ok">Meta Atingida!</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 text-gold-deep" />
                          <span>Em andamento</span>
                        </>
                      )}
                    </b>
                  </div>

                  <div className="p-3.5 rounded-xl bg-navy/[0.02] border border-navy/10">
                    <span className="text-[11px] font-semibold text-muted block">Faltam para atingir</span>
                    <b className="text-sm font-bold text-navy mt-0.5 block">
                      {totalAmountStats.remainingCents === 0
                        ? 'R$ 0,00 (Concluída)'
                        : Money.formatCents(totalAmountStats.remainingCents)}
                    </b>
                  </div>

                  <div className="p-3.5 rounded-xl bg-navy/[0.02] border border-navy/10">
                    <span className="text-[11px] font-semibold text-muted block">Prazo</span>
                    <b className="text-sm font-bold text-navy mt-0.5 block">
                      {totalAmountStats.daysRemaining !== null ? (
                        totalAmountStats.daysRemaining > 0 ? (
                          `${totalAmountStats.daysRemaining} dias restantes`
                        ) : totalAmountStats.daysRemaining === 0 ? (
                          'Vence hoje'
                        ) : (
                          'Prazo encerrado'
                        )
                      ) : (
                        'Sem data limite'
                      )}
                    </b>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TIPO 2: INVESTIMENTOS MENSAIS
              ======================================================== */}
          {currentGoal.type === 'monthly_investment' && monthlyStats && (
            <div className="space-y-6">
              {/* Gráfico Mês a Mês: Montante Esperado vs. Efetivamente Enviado (Recebido) */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-navy/10 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-extrabold text-navy">
                        Investimentos Mês a Mês: Planejado vs. Efetivamente Enviado (Recebido)
                      </h4>
                      {chartYear > new Date().getFullYear() ? (
                        <span className="pill bg-gold/20 text-gold-deep text-[10px] font-extrabold">
                          ✨ Projeção Futura ({chartYear})
                        </span>
                      ) : chartYear < new Date().getFullYear() ? (
                        <span className="pill bg-navy/10 text-navy text-[10px] font-extrabold">
                          📅 Histórico ({chartYear})
                        </span>
                      ) : (
                        <span className="pill bg-ok/20 text-ok text-[10px] font-extrabold">
                          📌 Ano Corrente ({chartYear})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {chartYear > new Date().getFullYear()
                        ? `Projeção matemática dos aportes mensais e rendimentos esperados para o ano de ${chartYear}.`
                        : chartYear < new Date().getFullYear()
                        ? `Histórico de aportes enviados para a caixinha ao longo do ano de ${chartYear}.`
                        : 'Mostra quanto deveria ter conforme a meta e o valor enviado para a caixinha com movimentação efetuada.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Controles de Navegação: Seta Esquerda / Direita */}
                    <div className="flex items-center gap-1 bg-navy/[0.04] p-1 rounded-xl border border-navy/10">
                      <button
                        type="button"
                        onClick={handlePrevYear}
                        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white text-navy hover:shadow-sm transition"
                        title="Ver ano anterior (o que passou)"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-xs font-black text-navy px-2 min-w-[50px] text-center">
                        {chartYear}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextYear}
                        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white text-navy hover:shadow-sm transition"
                        title="Ver próximo ano (projeção futura)"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {chartYear !== new Date().getFullYear() && (
                      <button
                        type="button"
                        onClick={handleResetCurrentYear}
                        className="btn-line text-[11px] h-7 px-2.5 font-bold text-gold-deep border-gold/40 hover:bg-gold/10"
                      >
                        Voltar para {new Date().getFullYear()}
                      </button>
                    )}

                    <div className="flex items-center gap-3 text-xs font-bold pl-2 border-l border-navy/10 flex-wrap">
                      <span className="flex items-center gap-1.5 text-navy">
                        <span className="h-3 w-3 rounded-md bg-[#3F6FD8]" />
                        Meta Atingida
                      </span>
                      <span className="flex items-center gap-1.5 text-danger">
                        <span className="h-3 w-3 rounded-md bg-[#EF4444]" />
                        Abaixo da Meta
                      </span>
                      <span className="flex items-center gap-1.5 text-gold-deep">
                        <span className="h-3 w-3 rounded-md bg-[#F5B82E]" />
                        Meta Planejada
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visualizador de Barras SVG Interativo */}
                <div className="relative pt-2">
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 sm:gap-2.5 items-end h-56 pt-6 pb-2 border-b border-navy/10">
                    {monthlyStats.monthsData.map((m, idx) => {
                      const maxValCents = Math.max(
                        ...monthlyStats.monthsData.map((d) => Math.max(d.targetMonthlyCents, d.actualSentMonthCents)),
                        100
                      );

                      const targetHeightPct = (m.targetMonthlyCents / maxValCents) * 100;
                      const actualHeightPct = (m.actualSentMonthCents / maxValCents) * 100;
                      const isHovered = hoveredBarIndex === idx;
                      const isUnderTarget = m.isPastOrCurrent && !m.achievedTarget;

                      return (
                        <div
                          key={m.month}
                          className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                          onMouseEnter={() => setHoveredBarIndex(idx)}
                          onMouseLeave={() => setHoveredBarIndex(null)}
                        >
                          {/* Colunas lado a lado */}
                          <div className="w-full flex items-end justify-center gap-1 h-full pb-1">
                            {/* Barra Efetivamente Enviado (Vermelha quando abaixo da meta, Azul quando meta atingida) */}
                            <div
                              className={`w-1/2 rounded-t-md transition-all duration-300 group-hover:brightness-110 shadow-sm ${
                                isUnderTarget ? 'bg-[#EF4444]' : 'bg-[#3F6FD8]'
                              }`}
                              style={{
                                height: `${Math.max(4, actualHeightPct)}%`,
                                opacity: m.actualSentMonthCents > 0 ? 1 : 0.25,
                              }}
                            />

                            {/* Barra Meta Planejada */}
                            <div
                              className="w-1/2 rounded-t-md bg-[#F5B82E] transition-all duration-300 group-hover:brightness-110 shadow-sm"
                              style={{ height: `${Math.max(4, targetHeightPct)}%` }}
                            />
                          </div>

                          {/* Rótulo do Mês */}
                          <span
                            className={`text-[10px] sm:text-xs font-bold transition-colors ${
                              isHovered ? 'text-navy scale-110 font-black' : m.isPastOrCurrent ? 'text-navy' : 'text-muted/60'
                            }`}
                          >
                            {m.month}
                          </span>

                          {/* Tooltip flutuante no Hover */}
                          {isHovered && (
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap rounded-xl bg-navy px-3 py-2 text-xs text-white shadow-xl pointer-events-none animate-in fade-in zoom-in-95">
                              <div className="font-bold border-b border-white/10 pb-1 mb-1.5 flex items-center justify-between gap-3 text-[11px]">
                                <span>{m.month} de {chartYear}</span>
                                {!m.isPastOrCurrent ? (
                                  <span className="text-[#A5C0FF] font-bold">Projeção Futura</span>
                                ) : m.achievedTarget ? (
                                  <span className="text-ok font-extrabold flex items-center gap-0.5">✓ Meta Atingida</span>
                                ) : (
                                  <span className="text-[#FF8080] font-extrabold">Abaixo da Meta</span>
                                )}
                              </div>
                              <div className="space-y-1 text-[11px]">
                                <div className="flex items-center justify-between gap-3">
                                  <span className={isUnderTarget ? 'text-[#FF8080]' : 'text-[#A5C0FF]'}>
                                    {m.isPastOrCurrent ? 'Enviado (Recebido):' : 'Previsão de Envio:'}
                                  </span>
                                  <b className={isUnderTarget ? 'text-[#FF8080]' : 'text-white'}>
                                    {m.isPastOrCurrent ? Money.formatCents(m.actualSentMonthCents) : Money.formatCents(m.targetMonthlyCents)}
                                  </b>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-[#FFD580]">Meta do Mês:</span>
                                  <b className="text-white">{Money.formatCents(m.targetMonthlyCents)}</b>
                                </div>
                                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-1 mt-1">
                                  <span className="text-white/70">Acumulado Esperado:</span>
                                  <b className="text-ok">{Money.formatCents(m.accumulatedExpectedCents)}</b>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-muted">
                  <div className="flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-navy/60" />
                    <span>Apenas transações com status <b>Recebido / Efetuado</b> são contabilizadas no montante real enviado.</span>
                  </div>
                  <span className="font-semibold text-navy">
                    Taxa considerada: <b>{monthlyStats.returnRateAnnual}% ao ano</b>
                  </span>
                </div>
              </div>

              {/* Previsão Futura: Próximos 10 anos, 20 anos, 30 anos */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-navy/[0.02] via-white to-gold/[0.04] border border-navy/10 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-gold-deep" />
                      <h4 className="text-sm sm:text-base font-extrabold text-navy">
                        Previsão Futura com Juros Compostos (10, 20 e 30 Anos)
                      </h4>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      Projeção matemática caso você continue aportando <b>{Money.formatCents(monthlyStats.targetMonthlyCents)}</b> todos os meses a uma taxa de <b>{monthlyStats.returnRateAnnual}% ao ano</b>.
                    </p>
                  </div>
                </div>

                {/* Cards de Marcos Temporais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {monthlyStats.projections
                    .filter((p) => [5, 10, 20, 30].includes(p.years))
                    .map((proj) => {
                      return (
                        <div
                          key={proj.years}
                          className="p-4 rounded-2xl bg-white border border-navy/10 shadow-sm hover:border-gold/50 transition-all flex flex-col justify-between gap-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="pill bg-navy/5 text-navy font-extrabold text-xs">
                              {proj.label}
                            </span>
                            <span className="text-[10px] font-bold text-gold-deep bg-gold/15 px-2 py-0.5 rounded-full">
                              Efeito Bola de Neve
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] text-muted block">Montante Total Acumulado</span>
                            <b className="text-lg sm:text-xl font-black text-navy leading-tight mt-0.5 block">
                              {Money.formatCents(proj.planned.totalAmount)}
                            </b>
                          </div>

                          <div className="space-y-1.5 pt-2 border-t border-navy/5 text-xs">
                            <div className="flex items-center justify-between text-muted text-[11px]">
                              <span>Total Investido do Bolso:</span>
                              <b className="text-navy">{Money.formatCents(proj.planned.totalInvested)}</b>
                            </div>
                            <div className="flex items-center justify-between text-ok text-[11px]">
                              <span>Ganho em Juros Compostos:</span>
                              <b className="font-extrabold">+{Money.formatCents(proj.planned.totalInterest)}</b>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Tabela Resumo Comparativa de Crescimento */}
                <div className="overflow-x-auto rounded-xl border border-navy/10 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-navy/[0.04] text-navy font-extrabold border-b border-navy/10">
                        <th className="p-3">Horizonte de Tempo</th>
                        <th className="p-3">Total Investido</th>
                        <th className="p-3">Juros Acumulados</th>
                        <th className="p-3">Montante Projetado (Ritmo Planejado)</th>
                        <th className="p-3 relative z-30">
                          <div
                            className="inline-flex items-center gap-1.5 group cursor-help"
                          >
                            <span className="text-gold-deep">Montante (No Ritmo Atual Real)</span>
                            <span className="grid h-4 w-4 place-items-center rounded-full bg-gold/25 text-gold-deep text-[10px] font-extrabold hover:bg-gold/40 transition">
                              <Info className="h-2.5 w-2.5" />
                            </span>

                            {/* Dica de Tela Flutuante posicionada abaixo do header */}
                            <div className="pointer-events-none absolute top-full right-2 mt-1.5 hidden group-hover:block w-72 rounded-2xl bg-navy p-3.5 text-[11px] font-normal text-white shadow-[0_20px_40px_-10px_rgba(10,31,68,.7)] border border-white/15 z-50 animate-in fade-in zoom-in-95">
                              <div className="font-extrabold text-gold border-b border-white/10 pb-1.5 mb-1.5 flex items-center justify-between text-xs">
                                <span>💡 Como é calculado este valor?</span>
                              </div>
                              <p className="text-white/90 leading-snug mb-2 text-[11px]">
                                Projeta o montante futuro com base no seu <b>comportamento real de investimentos</b> deste ano:
                              </p>
                              <div className="space-y-1.5 text-white/80 text-[10.5px]">
                                <div className="flex items-start justify-between gap-2">
                                  <span>• Saldo inicial na origem:</span>
                                  <b className="text-white">{Money.formatCents(currentOriginBalanceCents)}</b>
                                </div>
                                <div className="flex items-start justify-between gap-2">
                                  <span>• Média real aportada:</span>
                                  <b className="text-gold">{Money.formatCents(monthlyStats.avgMonthlyActualCents)}/mês</b>
                                </div>
                                <div className="flex items-start justify-between gap-2">
                                  <span>• Juros compostos:</span>
                                  <b className="text-ok">{monthlyStats.returnRateAnnual}% ao ano</b>
                                </div>
                              </div>
                              <p className="text-[9.5px] text-white/50 border-t border-white/10 pt-1.5 mt-2">
                                Fórmula: Capitalização mensal composta de anuidade com aportes no ritmo médio histórico.
                              </p>
                            </div>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy/5">
                      {monthlyStats.projections.map((proj) => (
                        <tr key={proj.years} className="hover:bg-navy/[0.01] transition-colors">
                          <td className="p-3 font-bold text-navy flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-gold" />
                            {proj.label}
                          </td>
                          <td className="p-3 text-muted">{Money.formatCents(proj.planned.totalInvested)}</td>
                          <td className="p-3 text-ok font-semibold">+{Money.formatCents(proj.planned.totalInterest)}</td>
                          <td className="p-3 font-extrabold text-navy">{Money.formatCents(proj.planned.totalAmount)}</td>
                          <td className="p-3 font-extrabold text-gold-deep">
                            {Money.formatCents(proj.actual.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
