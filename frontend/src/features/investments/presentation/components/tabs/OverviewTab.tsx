import React from 'react';
import { PortfolioPosition } from '../../../domain/types';
import { TrendingUp, TrendingDown, DollarSign, PieChart, ArrowUpRight, Trash2 } from 'lucide-react';

interface OverviewTabProps {
  positions: PortfolioPosition[];
  totalValue: number;
  totalCost: number;
  totalProfitBrl: number;
  totalProfitPct: number;
  onOpenNewTransaction: () => void;
  onDeleteTransaction: (ticker: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  positions,
  totalValue,
  totalCost,
  totalProfitBrl,
  totalProfitPct,
  onOpenNewTransaction,
}) => {
  const annualDividends = positions.reduce((sum, p) => sum + p.annualEstimatedDividends, 0);
  const monthlyDividends = annualDividends / 12;

  // Distribuição por Tipo
  const stocksVal = positions.filter((p) => p.type === 'STOCK').reduce((sum, p) => sum + p.totalCurrentValue, 0);
  const fiisVal = positions.filter((p) => p.type === 'FII').reduce((sum, p) => sum + p.totalCurrentValue, 0);
  const cryptoVal = positions.filter((p) => p.type === 'CRYPTO').reduce((sum, p) => sum + p.totalCurrentValue, 0);
  const othersVal = positions.filter((p) => !['STOCK', 'FII', 'CRYPTO'].includes(p.type)).reduce((sum, p) => sum + p.totalCurrentValue, 0);

  const getPct = (val: number) => (totalValue > 0 ? (val / totalValue) * 100 : 0);

  return (
    <div className="space-y-6">
      {/* 1. Cards de Resumo Consolidado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Patrimônio Atual */}
        <div className="rounded-2xl bg-gradient-to-br from-navy-soft/80 to-navy-deep p-5 border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Patrimônio Total</span>
            <div className="h-8 w-8 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white tracking-tight">
            R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Custo investido: R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Rentabilidade Total */}
        <div className="rounded-2xl bg-gradient-to-br from-navy-soft/80 to-navy-deep p-5 border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Rentabilidade Total</span>
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${totalProfitBrl >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {totalProfitBrl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
          </div>
          <div className={`mt-2 text-2xl font-black tracking-tight ${totalProfitBrl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalProfitBrl >= 0 ? '+' : ''}R$ {totalProfitBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className={`mt-1 text-xs font-bold ${totalProfitPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalProfitPct >= 0 ? '▲' : '▼'} {Math.abs(totalProfitPct).toFixed(2)}% de retorno
          </div>
        </div>

        {/* Renda Passiva Estimada */}
        <div className="rounded-2xl bg-gradient-to-br from-navy-soft/80 to-navy-deep p-5 border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Proventos Mensais (Est.)</span>
            <div className="h-8 w-8 rounded-xl bg-blue/20 flex items-center justify-center text-blue-light">
              <span className="text-sm">💰</span>
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white tracking-tight">
            R$ {monthlyDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span className="text-xs text-slate-400 font-normal">/mês</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-bold">
            ~R$ {annualDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / ano
          </div>
        </div>

        {/* Ativos em Carteira */}
        <div className="rounded-2xl bg-gradient-to-br from-navy-soft/80 to-navy-deep p-5 border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Ativos em Custódia</span>
            <div className="h-8 w-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
              <PieChart className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white tracking-tight">
            {positions.length} <span className="text-xs text-slate-400 font-normal">ativos</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Diversificação multi-classe
          </div>
        </div>
      </div>

      {/* 2. Barra de Alocação de Classes */}
      <div className="rounded-2xl bg-navy-deep/80 border border-white/10 p-5 backdrop-blur-xl">
        <h3 className="text-sm font-bold text-white mb-3">Distribuição do Patrimônio</h3>
        
        {/* Barra de Progresso Segmentada */}
        <div className="h-3 w-full rounded-full bg-white/10 flex overflow-hidden">
          <div style={{ width: `${getPct(stocksVal)}%` }} className="bg-blue transition-all" title={`Ações: ${getPct(stocksVal).toFixed(1)}%`} />
          <div style={{ width: `${getPct(fiisVal)}%` }} className="bg-emerald-500 transition-all" title={`FIIs: ${getPct(fiisVal).toFixed(1)}%`} />
          <div style={{ width: `${getPct(cryptoVal)}%` }} className="bg-amber-500 transition-all" title={`Cripto: ${getPct(cryptoVal).toFixed(1)}%`} />
          <div style={{ width: `${getPct(othersVal)}%` }} className="bg-purple-500 transition-all" title={`Outros: ${getPct(othersVal).toFixed(1)}%`} />
        </div>

        {/* Legendas com Valores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue" />
            <span className="text-slate-300 font-medium">Ações:</span>
            <b className="text-white">{getPct(stocksVal).toFixed(1)}%</b>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-slate-300 font-medium">FIIs:</span>
            <b className="text-white">{getPct(fiisVal).toFixed(1)}%</b>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-slate-300 font-medium">Criptomoedas:</span>
            <b className="text-white">{getPct(cryptoVal).toFixed(1)}%</b>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-purple-500" />
            <span className="text-slate-300 font-medium">Renda Fixa/Outros:</span>
            <b className="text-white">{getPct(othersVal).toFixed(1)}%</b>
          </div>
        </div>
      </div>

      {/* 3. Tabela Completa de Posições (Estilo Investidor10) */}
      <div className="rounded-2xl bg-navy-deep/80 border border-white/10 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white">Meus Ativos em Carteira</h3>
            <p className="text-xs text-slate-400">Posições consolidadas com base no histórico de transações</p>
          </div>
          <button
            type="button"
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/20 hover:bg-gold/30 text-gold border border-gold/40 text-xs font-bold transition"
          >
            Adicionar Aporte
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-white/5 uppercase text-[10px] font-bold tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Ativo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Qtd</th>
                <th className="px-4 py-3">Preço Médio</th>
                <th className="px-4 py-3">Cotação Atual</th>
                <th className="px-4 py-3">Valor Total</th>
                <th className="px-4 py-3">Lucro / Prejuízo</th>
                <th className="px-4 py-3">Alocação</th>
                <th className="px-4 py-3">DY 12M</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Nenhum ativo cadastrado na carteira. Clique em <b>"Nova Transação"</b> ou <b>"Importar B3"</b> para começar!
                  </td>
                </tr>
              ) : (
                positions.map((pos) => (
                  <tr key={pos.ticker} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-white text-sm">{pos.ticker}</span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[140px] hidden sm:inline">{pos.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        pos.type === 'STOCK' ? 'bg-blue/20 text-blue-light border border-blue/30' :
                        pos.type === 'FII' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        pos.type === 'CRYPTO' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-purple-500/20 text-purple-300'
                      }`}>
                        {pos.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-bold">
                      {pos.quantity < 1 ? pos.quantity.toFixed(4) : pos.quantity.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      R$ {pos.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-bold text-white">
                      R$ {pos.currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-black text-white">
                      R$ {pos.totalCurrentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`font-bold ${pos.profitAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pos.profitAmount >= 0 ? '+' : ''}R$ {pos.profitAmount.toFixed(2)}
                        <span className="block text-[10px] opacity-80">
                          ({pos.profitPercentage >= 0 ? '+' : ''}{pos.profitPercentage.toFixed(2)}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div style={{ width: `${pos.allocationPercentage}%` }} className="h-full bg-gold" />
                        </div>
                        <span className="font-bold text-slate-200">{pos.allocationPercentage.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-400">
                      {pos.dy ? `${pos.dy.toFixed(1)}%` : '-'}
                    </td>
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
