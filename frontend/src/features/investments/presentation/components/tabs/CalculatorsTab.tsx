import React, { useState } from 'react';
import { Calculator, DollarSign, Sparkles, TrendingUp } from 'lucide-react';

export const CalculatorsTab: React.FC = () => {
  // Calculadora Barsi
  const [barsiDividend, setBarsiDividend] = useState<number>(3.50);
  const [barsiMinYield, setBarsiMinYield] = useState<number>(6.0); // 6% método Barsi
  const barsiCeilingPrice = barsiMinYield > 0 ? (barsiDividend / (barsiMinYield / 100)) : 0;

  // Calculadora Juros Compostos
  const [initialAmount, setInitialAmount] = useState<number>(5000);
  const [monthlyDeposit, setMonthlyDeposit] = useState<number>(500);
  const [annualRate, setAnnualRate] = useState<number>(11.0);
  const [years, setYears] = useState<number>(10);

  // Cálculo de juros compostos
  const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
  const totalMonths = years * 12;
  let totalAccumulated = initialAmount;
  let totalInvested = initialAmount;

  for (let i = 0; i < totalMonths; i++) {
    totalAccumulated = totalAccumulated * (1 + monthlyRate) + monthlyDeposit;
    totalInvested += monthlyDeposit;
  }
  const totalInterest = totalAccumulated - totalInvested;
  const estimatedMonthlyPassiveIncome = totalAccumulated * (0.008); // ~0.8% ao mês em dividendos

  return (
    <div className="space-y-8">
      {/* 1. Calculadora de Preço Teto (Método Luiz Barsi / Décio Bazin) */}
      <div className="rounded-2xl bg-navy-deep/80 border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Calculadora de Preço Teto (Método Luiz Barsi)</h3>
            <p className="text-xs text-slate-400">Descubra até qual valor vale a pena pagar em uma ação para garantir o Yield mínimo desejado</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Dividendo Anual Esperado por Ação (R$):</label>
            <input
              type="number"
              step="0.10"
              value={barsiDividend}
              onChange={(e) => setBarsiDividend(parseFloat(e.target.value) || 0)}
              className="w-full bg-navy-soft/60 border border-white/10 rounded-xl px-4 py-2.5 text-white font-black text-sm focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Yield Mínimo Desejado (% a.a.):</label>
            <input
              type="number"
              step="0.5"
              value={barsiMinYield}
              onChange={(e) => setBarsiMinYield(parseFloat(e.target.value) || 0)}
              className="w-full bg-navy-soft/60 border border-white/10 rounded-xl px-4 py-2.5 text-white font-black text-sm focus:outline-none focus:border-gold"
            />
          </div>

          <div className="rounded-xl bg-gold/10 border border-gold/30 p-4 flex flex-col justify-center">
            <span className="text-[11px] font-bold text-gold uppercase tracking-wider">Preço Teto Máximo</span>
            <div className="text-2xl font-black text-gold mt-1">
              R$ {barsiCeilingPrice.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-300 mt-0.5">Pague até este valor para garantir os {barsiMinYield}% de dividendo</span>
          </div>
        </div>
      </div>

      {/* 2. Simulador de Juros Compostos & Liberdade Financeira */}
      <div className="rounded-2xl bg-navy-deep/80 border border-white/10 p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Simulador de Juros Compostos & Renda Passiva</h3>
            <p className="text-xs text-slate-400">Projeção do efeito bola de neve a médio e longo prazo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Valor Inicial (R$):</label>
            <input
              type="number"
              value={initialAmount}
              onChange={(e) => setInitialAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-navy-soft/60 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Aporte Mensal (R$):</label>
            <input
              type="number"
              value={monthlyDeposit}
              onChange={(e) => setMonthlyDeposit(parseFloat(e.target.value) || 0)}
              className="w-full bg-navy-soft/60 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Rentabilidade Anual Estimada (% a.a.):</label>
            <input
              type="number"
              step="0.5"
              value={annualRate}
              onChange={(e) => setAnnualRate(parseFloat(e.target.value) || 0)}
              className="w-full bg-navy-soft/60 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Período de Investimento (Anos):</label>
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value) || 1)}
              className="w-full bg-navy-soft/60 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-gold"
            />
          </div>
        </div>

        {/* Resultados da Simulação */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <span className="text-xs text-slate-400">Total Investido do Bolso</span>
            <div className="text-xl font-black text-white mt-1">
              R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
            <span className="text-xs text-emerald-400 font-bold">Total Acumulado em Juros</span>
            <div className="text-xl font-black text-emerald-400 mt-1">
              + R$ {totalInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="rounded-xl bg-gold/15 border border-gold/40 p-4">
            <span className="text-xs text-gold font-bold">Patrimônio Final Estimado</span>
            <div className="text-2xl font-black text-gold mt-1">
              R$ {totalAccumulated.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1 text-[10px] text-emerald-300 font-bold">
              💰 Renda Passiva Estimada: ~R$ {estimatedMonthlyPassiveIncome.toFixed(2)}/mês
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
