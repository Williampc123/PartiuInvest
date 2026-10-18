import React, { useState, useId } from 'react';
import { Calculator, ArrowRight, RotateCcw, TrendingUp, PiggyBank, Sparkles, DollarSign, Percent } from 'lucide-react';
import { calculateCompoundInterest } from '../../core/compoundInterest';
import { CompoundInterestInput, CompoundInterestResult } from '../../core/types';
import { CompoundInterestChart } from '../components/CompoundInterestChart';
import { CompoundInterestTable } from '../components/CompoundInterestTable';

export const CompoundInterestPage: React.FC = () => {
  const initialValueId = useId();
  const monthlyValueId = useId();
  const interestRateId = useId();
  const periodId = useId();
  const timingId = useId();

  // Estados do formulário
  const [initialValue, setInitialValue] = useState<number | ''>(5000);
  const [monthlyValue, setMonthlyValue] = useState<number | ''>(500);
  const [interestRate, setInterestRate] = useState<number | ''>(8);
  const [ratePeriod, setRatePeriod] = useState<'annual' | 'monthly'>('annual');
  const [period, setPeriod] = useState<number | ''>(10);
  const [periodType, setPeriodType] = useState<'years' | 'months'>('years');
  const [contributionTiming, setContributionTiming] = useState<'end' | 'start'>('end');

  // Estado do resultado calculado
  const [result, setResult] = useState<CompoundInterestResult>(() =>
    calculateCompoundInterest({
      initialValue: 5000,
      monthlyValue: 500,
      interestRate: 8,
      ratePeriod: 'annual',
      period: 10,
      periodType: 'years',
      contributionTiming: 'end',
    })
  );

  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const input: CompoundInterestInput = {
      initialValue: Number(initialValue) || 0,
      monthlyValue: Number(monthlyValue) || 0,
      interestRate: Number(interestRate) || 0,
      ratePeriod,
      period: Number(period) || 1,
      periodType,
      contributionTiming,
    };

    const calculated = calculateCompoundInterest(input);
    setResult(calculated);
  };

  const handleReset = () => {
    setInitialValue(1000);
    setMonthlyValue(300);
    setInterestRate(8);
    setRatePeriod('annual');
    setPeriod(5);
    setPeriodType('years');
    setContributionTiming('end');

    const calculated = calculateCompoundInterest({
      initialValue: 1000,
      monthlyValue: 300,
      interestRate: 8,
      ratePeriod: 'annual',
      period: 5,
      periodType: 'years',
      contributionTiming: 'end',
    });
    setResult(calculated);
  };

  const interestSharePercent =
    result.totalFinal > 0 ? ((result.totalInterest / result.totalFinal) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      {/* 1. Cabeçalho da Página */}
      <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-gold-light to-gold text-navy-deep shadow-md">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-navy">Calculadora de Juros Compostos</h2>
              <span className="pill bg-gold/25 text-[#7A4F08] text-[10px] py-0 px-2 font-black">PRO</span>
            </div>
            <p className="text-xs text-muted">
              Simule a multiplicação do seu patrimônio com aportes mensais e o efeito dos juros sobre juros.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="btn-line text-xs h-[36px] px-3.5 gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="h-3.5 w-3.5 text-muted" />
          <span>Redefinir Valores</span>
        </button>
      </div>

      {/* 2. Formulário de Parâmetros */}
      <form onSubmit={handleCalculate} className="card space-y-4">
        <div className="flex items-center justify-between border-b border-navy/10 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Parâmetros da Simulação</span>
          <span className="text-[11px] text-muted">Preencha os valores para calcular</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Valor Inicial */}
          <div className="space-y-1.5">
            <label htmlFor={initialValueId} className="block text-xs font-bold text-navy">
              Valor Inicial
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">R$</span>
              <input
                id={initialValueId}
                type="number"
                step="any"
                min="0"
                value={initialValue}
                onChange={(e) => setInitialValue(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0,00"
                className="w-full rounded-xl border border-navy/15 bg-white/90 pl-9 pr-3 py-2.5 text-sm font-bold text-navy placeholder:text-muted/50 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 transition shadow-sm"
              />
            </div>
          </div>

          {/* Valor Mensal (Aporte) */}
          <div className="space-y-1.5">
            <label htmlFor={monthlyValueId} className="block text-xs font-bold text-navy">
              Aporte Mensal
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">R$</span>
              <input
                id={monthlyValueId}
                type="number"
                step="any"
                min="0"
                value={monthlyValue}
                onChange={(e) => setMonthlyValue(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0,00"
                className="w-full rounded-xl border border-navy/15 bg-white/90 pl-9 pr-3 py-2.5 text-sm font-bold text-navy placeholder:text-muted/50 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 transition shadow-sm"
              />
            </div>
          </div>

          {/* Taxa de Juros + Toggle Anual / Mensal */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={interestRateId} className="block text-xs font-bold text-navy">
                Taxa de Juros
              </label>
              <div className="flex rounded-md bg-navy/5 p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setRatePeriod('annual')}
                  className={`px-1.5 py-0.5 rounded transition ${ratePeriod === 'annual' ? 'bg-white text-navy shadow-xs' : 'text-muted'}`}
                >
                  % a.a.
                </button>
                <button
                  type="button"
                  onClick={() => setRatePeriod('monthly')}
                  className={`px-1.5 py-0.5 rounded transition ${ratePeriod === 'monthly' ? 'bg-white text-navy shadow-xs' : 'text-muted'}`}
                >
                  % a.m.
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                id={interestRateId}
                type="number"
                step="0.01"
                min="0"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="8.00"
                className="w-full rounded-xl border border-navy/15 bg-white/90 pl-3 pr-8 py-2.5 text-sm font-bold text-navy placeholder:text-muted/50 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 transition shadow-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">%</span>
            </div>
          </div>

          {/* Período + Toggle Anos / Meses */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={periodId} className="block text-xs font-bold text-navy">
                Período
              </label>
              <div className="flex rounded-md bg-navy/5 p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setPeriodType('years')}
                  className={`px-1.5 py-0.5 rounded transition ${periodType === 'years' ? 'bg-white text-navy shadow-xs' : 'text-muted'}`}
                >
                  Anos
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType('months')}
                  className={`px-1.5 py-0.5 rounded transition ${periodType === 'months' ? 'bg-white text-navy shadow-xs' : 'text-muted'}`}
                >
                  Meses
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                id={periodId}
                type="number"
                min="1"
                step="1"
                value={period}
                onChange={(e) => setPeriod(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="10"
                className="w-full rounded-xl border border-navy/15 bg-white/90 px-3 py-2.5 text-sm font-bold text-navy placeholder:text-muted/50 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 transition shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Linha Inferior com Opção de Aporte e Botão de Ação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-navy/10">
          <div className="flex items-center gap-2">
            <label htmlFor={timingId} className="text-xs font-semibold text-muted">
              Momento do aporte mensal:
            </label>
            <select
              id={timingId}
              value={contributionTiming}
              onChange={(e) => setContributionTiming(e.target.value as 'end' | 'start')}
              className="rounded-lg border border-navy/15 bg-white px-2.5 py-1 text-xs font-bold text-navy focus:border-gold focus:outline-none"
            >
              <option value="end">Fim do mês (Padrão)</option>
              <option value="start">Início do mês (Antecipado)</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-gold text-xs h-[42px] px-6 gap-2 shadow-lg self-end sm:self-auto"
          >
            <Sparkles className="h-4 w-4" />
            <span>Calcular Investimento</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* 3. Cards com Resumo dos Resultados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Final Acumulado */}
        <div className="box relative overflow-hidden bg-gradient-to-br from-white via-white to-gold/15 border-gold/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gold-deep uppercase tracking-wider">Total Acumulado Final</span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gold/20 text-gold-deep">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="amt text-gold-deep mt-2 text-2xl font-black">
            {formatCurrency(result.totalFinal)}
          </div>
          <p className="note text-[11px]">
            Em <b>{result.totalMonths} meses</b> ({ (result.totalMonths / 12).toFixed(1).replace('.0', '') } anos)
          </p>
        </div>

        {/* Total Investido */}
        <div className="box">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Total Investido (Aportes)</span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-light/30 text-navy">
              <PiggyBank className="h-4 w-4 text-navy" />
            </div>
          </div>
          <div className="amt text-navy mt-2 text-2xl font-black">
            {formatCurrency(result.totalInvested)}
          </div>
          <p className="note text-[11px]">
            Inicial {formatCurrency(Number(initialValue) || 0)} + Aportes {formatCurrency(result.totalContributions)}
          </p>
        </div>

        {/* Total em Juros */}
        <div className="box">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Total Ganho em Juros</span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="amt text-emerald-600 mt-2 text-2xl font-black">
            +{formatCurrency(result.totalInterest)}
          </div>
          <p className="note text-[11px]">
            Juros compostos representam <b>{interestSharePercent}%</b> do total
          </p>
        </div>

        {/* Efeito Multiplicador */}
        <div className="box">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Efeito Multiplicador</span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-navy/10 text-navy">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="amt text-navy mt-2 text-2xl font-black">
            {result.netGainRatio.toFixed(2)}x
          </div>
          <p className="note text-[11px]">
            Rentabilidade de <b>{((result.netGainRatio - 1) * 100).toFixed(1)}%</b> sobre o investido
          </p>
        </div>
      </div>

      {/* 4. Banner de Insight */}
      <div className="card flex items-center gap-3.5 bg-gradient-to-r from-navy via-navy-soft to-navy text-white p-4 shadow-md">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold text-navy-deep shadow">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="text-xs leading-relaxed">
          <p className="font-bold text-sm text-gold">
            Efeito Bola de Neve: {interestSharePercent}% do seu saldo final veio puramente de juros!
          </p>
          <p className="text-[#C3CCE0]">
            Ao final de {result.totalMonths} meses a uma taxa equivalente de{' '}
            <b>{result.monthlyRatePercent.toFixed(2)}% ao mês</b> ({result.annualRatePercent.toFixed(2)}% a.a.),
            você terá acumulado <b>{formatCurrency(result.totalFinal)}</b> tendo desembolsado apenas{' '}
            <b>{formatCurrency(result.totalInvested)}</b> do próprio bolso.
          </p>
        </div>
      </div>

      {/* 5. Abas de Visualização (Gráfico vs Tabela) */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-2xl bg-white/80 p-1 border border-navy/10 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'chart'
                ? 'bg-navy text-white shadow-sm'
                : 'text-muted hover:text-navy'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Gráfico de Evolução</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'table'
                ? 'bg-navy text-white shadow-sm'
                : 'text-muted hover:text-navy'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Tabela Detalhada</span>
          </button>
        </div>
      </div>

      {/* 6. Renderização da Aba Ativa */}
      {activeTab === 'chart' ? (
        <CompoundInterestChart result={result} />
      ) : (
        <CompoundInterestTable result={result} />
      )}
    </div>
  );
};
