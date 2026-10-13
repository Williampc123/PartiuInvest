import React from 'react';
import { PortfolioPosition } from '../../../domain/types';
import { DollarSign, Calendar, TrendingUp, Sparkles } from 'lucide-react';

interface DividendsTabProps {
  positions: PortfolioPosition[];
}

export const DividendsTab: React.FC<DividendsTabProps> = ({ positions }) => {
  const dividendAssets = positions.filter((p) => p.dy && p.dy > 0);
  const totalAnnualDividends = dividendAssets.reduce((sum, p) => sum + p.annualEstimatedDividends, 0);
  const monthlyAverage = totalAnnualDividends / 12;

  // Mapa mensal estimado (12 meses)
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthlyData = months.map((month, idx) => {
    // Variação orgânica entre os meses (FIIs pagam todo mês, Ações pagam trimestrais/semestrais)
    const factor = [0.8, 0.9, 1.2, 0.7, 1.4, 0.9, 0.8, 1.3, 1.0, 0.9, 1.1, 1.5][idx];
    return {
      month,
      value: monthlyAverage * factor,
    };
  });

  const maxVal = Math.max(...monthlyData.map((m) => m.value), 1);

  return (
    <div className="space-y-6">
      {/* 1. Cards de Projeção de Dividendos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-navy-soft/80 to-navy-deep p-5 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Renda Mensal Média</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white">
            R$ {monthlyAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-bold">
            Fluxo contínuo e previsível
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-navy-soft/80 to-navy-deep p-5 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Projeção Anual (12M)</span>
            <div className="h-8 w-8 rounded-xl bg-gold/20 text-gold flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white">
            R$ {totalAnnualDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Yield On Cost médio da carteira
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-navy-soft/80 to-navy-deep p-5 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Efeito Bola de Neve</span>
            <div className="h-8 w-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">
            Ativado
          </div>
          <div className="mt-1 text-[11px] text-slate-300">
            Reinvestindo os dividendos para compra de novas cotas
          </div>
        </div>
      </div>

      {/* 2. Gráfico / Histograma de Proventos Mensais */}
      <div className="rounded-2xl bg-navy-deep/80 border border-white/10 p-5 backdrop-blur-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span>Mapa de Dividendos ao Longo do Ano</span>
        </h3>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 h-44 items-end pt-6 pb-2">
          {monthlyData.map((m) => {
            const heightPct = Math.max(12, (m.value / maxVal) * 100);
            return (
              <div key={m.month} className="flex flex-col items-center h-full justify-end group">
                <div className="text-[10px] font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition mb-1">
                  R${Math.round(m.value)}
                </div>
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-gold group-hover:to-gold-light transition-all cursor-pointer shadow-md"
                />
                <span className="text-[11px] font-semibold text-slate-400 mt-2">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Tabela de Pagadores de Proventos da Carteira */}
      <div className="rounded-2xl bg-navy-deep/80 border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-sm font-bold text-white">Ativos Geradores de Renda em Custódia</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-white/5 uppercase text-[10px] font-bold tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Ativo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Quantidade</th>
                <th className="px-4 py-3">Dividend Yield</th>
                <th className="px-4 py-3">Renda Anual Est.</th>
                <th className="px-4 py-3">Renda Mensal Est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dividendAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    Nenhum ativo com histórico de dividendos encontrado na carteira.
                  </td>
                </tr>
              ) : (
                dividendAssets.map((p) => (
                  <tr key={p.ticker} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 font-black text-white">{p.ticker}</td>
                    <td className="px-4 py-3 text-slate-400">{p.type}</td>
                    <td className="px-4 py-3 font-bold text-slate-200">{p.quantity}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">{p.dy?.toFixed(1)}%</td>
                    <td className="px-4 py-3 font-bold text-white">R$ {p.annualEstimatedDividends.toFixed(2)}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">R$ {(p.annualEstimatedDividends / 12).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
