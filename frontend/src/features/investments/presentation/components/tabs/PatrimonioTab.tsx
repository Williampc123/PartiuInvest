import React, { useState } from 'react';
import { PortfolioPosition, InvestmentTransaction } from '../../../domain/types';
import { Calendar, ChevronDown, Layers } from 'lucide-react';
import {
  groupPositionsByClass,
  computeEvolutionHistory,
} from '../../../infrastructure/investmentsService';

interface PatrimonioTabProps {
  positions: PortfolioPosition[];
  transactions: InvestmentTransaction[];
  totalValue: number;
  totalCost: number;
  totalProfitBrl: number;
  hideValues: boolean;
}

export const PatrimonioTab: React.FC<PatrimonioTabProps> = ({
  positions,
  transactions,
  totalValue,
  totalCost,
  totalProfitBrl,
  hideValues,
}) => {
  const [consolidationView, setConsolidationView] = useState<'tipo' | 'ativos'>('tipo');
  const [showIdealPosition, setShowIdealPosition] = useState<boolean>(false);

  const fmt = (val: number) => {
    if (hideValues) return '••••••';
    return `R$ ${(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const historyData = computeEvolutionHistory(transactions, totalCost, totalProfitBrl);
  const maxBarValue = Math.max(1, ...historyData.map((d) => d.applied + d.profit));

  const assetClasses = groupPositionsByClass(positions, totalValue);

  return (
    <div className="space-y-6 text-slate-200">
      {/* 1. EVOLUÇÃO DO PATRIMÔNIO (LARGURA TOTAL) */}
      <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-black text-white">Evolução do Patrimônio</h3>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A2234] border border-[#27344D] text-xs font-semibold text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Últimos 12 Meses</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-center gap-8 text-xs text-slate-300 mb-6">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-emerald-600" />
            <span>Valor aplicado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-emerald-400" />
            <span>Ganho de Capital</span>
          </div>
        </div>

        {/* Gráfico Largo */}
        {totalValue > 0 ? (
          <div className="h-56 flex items-end justify-between gap-3 pt-4 pb-2 border-b border-white/5 px-2">
            {historyData.map((item) => {
              const appliedHeight = maxBarValue > 0 ? (item.applied / maxBarValue) * 100 : 0;
              const profitHeight = maxBarValue > 0 ? (Math.max(0, item.profit) / maxBarValue) * 100 : 0;

              return (
                <div
                  key={item.label}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  <div className="w-full max-w-[36px] flex flex-col justify-end">
                    <div
                      style={{ height: `${profitHeight}%` }}
                      className="w-full rounded-t bg-emerald-400 group-hover:bg-emerald-300 transition"
                    />
                    <div
                      style={{ height: `${appliedHeight}%` }}
                      className="w-full bg-emerald-600 group-hover:bg-emerald-500 transition"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 mt-2">{item.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-44 flex items-center justify-center text-slate-500 text-xs border border-dashed border-white/10 rounded-xl">
            Nenhum patrimônio cadastrado
          </div>
        )}
      </div>

      {/* 2. CONSOLIDAÇÃO DO PATRIMÔNIO (LARGURA TOTAL) */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-white">Consolidação do Patrimônio</h3>

        <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] p-6 shadow-sm">
          {/* Header de Abas Internas */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/5">
            <span className="text-sm font-bold text-white">
              {consolidationView === 'tipo' ? 'Tipo de Ativos' : 'Ativos Individuais'}
            </span>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex rounded-xl bg-[#1A2234] p-0.5 border border-[#27344D]">
                <button
                  type="button"
                  onClick={() => setConsolidationView('tipo')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    consolidationView === 'tipo' ? 'bg-[#2A3750] text-white shadow' : 'text-slate-400'
                  }`}
                >
                  Tipo de ativos
                </button>
                <button
                  type="button"
                  onClick={() => setConsolidationView('ativos')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    consolidationView === 'ativos' ? 'bg-[#2A3750] text-white shadow' : 'text-slate-400'
                  }`}
                >
                  Ativos
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span>Exibir meta ideal ⓘ</span>
                <button
                  type="button"
                  onClick={() => setShowIdealPosition((p) => !p)}
                  className={`h-5 w-9 rounded-full transition-colors relative ${
                    showIdealPosition ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`h-3.5 w-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      showIdealPosition ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Gráfico Donut + Barras Horizontais */}
          {positions.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-6">
              {/* Donut Container */}
              <div className="lg:col-span-4 flex items-center justify-center relative">
                <div className="h-44 w-44 rounded-full border-[12px] border-[#1A2234] flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Patrimônio</span>
                  <b className="text-sm font-black text-white">{fmt(totalValue)}</b>
                </div>
              </div>

              {/* Barras Horizontais com Dados Reais */}
              <div className="lg:col-span-8 space-y-3.5">
                {consolidationView === 'tipo'
                  ? assetClasses.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-4 text-xs">
                        <span className="font-semibold text-white w-28 shrink-0">{item.name}</span>
                        <span className="font-bold text-slate-300 w-28 text-right shrink-0">
                          {fmt(item.totalValue)}
                        </span>
                        <span className="font-bold text-slate-400 w-16 text-right shrink-0">
                          {item.currentPct.toFixed(1)}%
                        </span>

                        <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, item.currentPct)}%`, backgroundColor: item.color }}
                            className="h-full rounded-full transition-all"
                          />
                        </div>
                      </div>
                    ))
                  : positions.map((pos) => (
                      <div key={pos.ticker} className="flex items-center justify-between gap-4 text-xs">
                        <span className="font-semibold text-white w-28 shrink-0">{pos.ticker}</span>
                        <span className="font-bold text-slate-300 w-28 text-right shrink-0">
                          {fmt(pos.totalCurrentValue)}
                        </span>
                        <span className="font-bold text-slate-400 w-16 text-right shrink-0">
                          {pos.allocationPercentage.toFixed(1)}%
                        </span>

                        <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, pos.allocationPercentage)}%` }}
                            className="h-full rounded-full bg-blue-500 transition-all"
                          />
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhuma posição cadastrada para consolidação de patrimônio.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
