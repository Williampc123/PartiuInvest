import React, { useState } from 'react';
import { PortfolioPosition, InvestmentTransaction } from '../../../domain/types';
import {
  Calendar,
  ChevronDown,
  Coins,
} from 'lucide-react';

interface ProventosTabProps {
  positions: PortfolioPosition[];
  transactions: InvestmentTransaction[];
  hideValues: boolean;
}

export const ProventosTab: React.FC<ProventosTabProps> = ({
  positions,
  transactions,
  hideValues,
}) => {
  const [viewMode, setViewMode] = useState<'mensal' | 'anual'>('mensal');
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));

  const fmt = (val: number) => {
    if (hideValues) return '••••••';
    return `R$ ${(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calcula proventos anuais e mensais baseados nas posições reais
  const dividendPositions = positions.filter((p) => (p.dy || 0) > 0 && p.quantity > 0);
  const totalAnnualEstimated = dividendPositions.reduce((acc, p) => acc + (p.annualEstimatedDividends || 0), 0);
  const monthlyAverage = totalAnnualEstimated / 12;

  // Distribuição de Proventos pelos Ativos Reais
  const dividendDistribution = dividendPositions.map((p) => ({
    ticker: p.ticker,
    name: p.name,
    annualVal: p.annualEstimatedDividends || 0,
    pct: totalAnnualEstimated > 0 ? ((p.annualEstimatedDividends || 0) / totalAnnualEstimated) * 100 : 0,
    dy: p.dy || 0,
    type: p.type,
    qty: p.quantity,
    monthlyVal: (p.annualEstimatedDividends || 0) / 12,
  }));

  // 12 Meses de Barras Estimadas ou Reais
  const currentMonth = new Date().getMonth();
  const monthsLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthlyChartData = monthsLabels.map((lbl, idx) => ({
    label: `${lbl}/${selectedYear.slice(-2)}`,
    val: monthlyAverage,
    isPast: idx <= currentMonth,
  }));

  const maxVal = Math.max(1, ...monthlyChartData.map((d) => d.val));

  return (
    <div className="space-y-6 text-slate-200">
      {/* 1. SEÇÃO SUPERIOR: RESUMO LATERAL + EVOLUÇÃO DE PROVENTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card Resumo Lateral */}
        <div className="lg:col-span-4 rounded-2xl bg-[#141A26] border border-[#212B3E] p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-white">Resumo de Proventos</h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Média Mensal Estimada (12M)</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <b className="text-lg font-black text-white">{fmt(monthlyAverage)}</b>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5">
              <span className="text-[11px] text-slate-400 block">Proventos Estimados em 12 Meses</span>
              <b className="text-lg font-black text-emerald-400">{fmt(totalAnnualEstimated)}</b>
            </div>

            <div className="pt-2 border-t border-white/5">
              <span className="text-[11px] text-slate-400 block">Ativos Geradores de Renda</span>
              <b className="text-base font-black text-white">{dividendPositions.length} ativos</b>
            </div>
          </div>

          {/* Distribuição */}
          <div className="pt-3 border-t border-white/5">
            <span className="text-[11px] text-slate-400 block mb-2">Distribuição por Ativo</span>
            {dividendDistribution.length > 0 ? (
              <div className="space-y-1.5 text-[11px]">
                {dividendDistribution.slice(0, 5).map((d) => (
                  <div key={d.ticker} className="flex items-center justify-between">
                    <span className="text-slate-300 font-semibold">{d.ticker}</span>
                    <div className="text-right">
                      <b className="text-white">{d.pct.toFixed(1)}%</b>
                      <span className="text-slate-400 text-[10px] ml-1.5">({fmt(d.annualVal)}/ano)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-500">Sem ativos com dividendos cadastrados</span>
            )}
          </div>
        </div>

        {/* Card Gráfico Evolução de Proventos */}
        <div className="lg:col-span-8 rounded-2xl bg-[#141A26] border border-[#212B3E] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-black text-white">Evolução e Previsão de Proventos</h3>

              <div className="flex items-center gap-2">
                <div className="flex rounded-xl bg-[#1A2234] p-0.5 border border-[#27344D]">
                  <button
                    type="button"
                    onClick={() => setViewMode('mensal')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      viewMode === 'mensal' ? 'bg-[#2A3750] text-white shadow' : 'text-slate-400'
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('anual')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      viewMode === 'anual' ? 'bg-[#2A3750] text-white shadow' : 'text-slate-400'
                    }`}
                  >
                    Anual
                  </button>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1A2234] border border-[#27344D] text-xs font-semibold text-slate-300">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedYear}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Legenda */}
            <div className="flex items-center justify-center gap-6 text-xs text-slate-300 mb-6">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-blue-500" />
                <span>Média / Projeção Mensal</span>
              </div>
            </div>

            {/* Gráfico de Barras Azuis */}
            {totalAnnualEstimated > 0 ? (
              <div className="h-44 flex items-end justify-between gap-2 pt-4 pb-2 border-b border-white/5 px-2">
                {monthlyChartData.map((d) => {
                  const heightPct = maxVal > 0 ? (d.val / maxVal) * 100 : 0;
                  return (
                    <div
                      key={d.label}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                    >
                      <span className="text-[9px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition mb-1">
                        {fmt(d.val)}
                      </span>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full max-w-[28px] rounded-t bg-blue-500 hover:bg-blue-400 transition shadow"
                      />
                      <span className="text-[10px] text-slate-400 font-semibold mt-2">{d.label.split('/')[0]}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-xl">
                <span className="text-xs text-slate-400">Nenhum provento a ser exibido</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 text-center mt-3">
            Valores calculados com base nas cotações e dividend yields (DY) atuais dos seus ativos.
          </p>
        </div>
      </div>

      {/* 2. TABELA: ATIVOS PAGADORES DE PROVENTOS DA SUA CARTEIRA */}
      <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#212B3E] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-white">Ativos Pagadores na Carteira</h3>
            <span className="text-xs text-emerald-400 font-bold">
              Total Estimado {fmt(totalAnnualEstimated)}/ano
            </span>
          </div>
        </div>

        {dividendPositions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#101520] uppercase text-[10px] text-slate-400 font-bold border-b border-white/5">
                <tr>
                  <th className="py-2.5 px-4">Ativo</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Quantidade</th>
                  <th className="py-2.5 px-3">DY Anual</th>
                  <th className="py-2.5 px-3">Valor Total em Custódia</th>
                  <th className="py-2.5 px-3">Estimativa Mensal</th>
                  <th className="py-2.5 px-4 font-black text-emerald-400">Estimativa Anual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dividendPositions.map((d) => (
                  <tr key={d.ticker} className="hover:bg-white/5 transition">
                    <td className="py-2.5 px-4 font-black text-white">{d.ticker}</td>
                    <td className="py-2.5 px-3 text-slate-400">{d.type}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{d.quantity}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-400">{d.dy?.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 font-bold text-white">{fmt(d.totalCurrentValue)}</td>
                    <td className="py-2.5 px-3 text-slate-300">{fmt((d.annualEstimatedDividends || 0) / 12)}</td>
                    <td className="py-2.5 px-4 font-black text-emerald-400">
                      {fmt(d.annualEstimatedDividends || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhum ativo pagador de dividendos (Ações ou FIIs) cadastrado na carteira.
          </div>
        )}
      </div>
    </div>
  );
};
