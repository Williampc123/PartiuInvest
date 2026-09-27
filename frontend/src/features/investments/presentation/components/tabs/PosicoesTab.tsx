import React, { useState } from 'react';
import { PortfolioPosition } from '../../../domain/types';
import {
  Trophy,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  MoreHorizontal,
} from 'lucide-react';
import { groupPositionsByClass, RealAssetClassGroup } from '../../../infrastructure/investmentsService';

interface PosicoesTabProps {
  positions: PortfolioPosition[];
  totalValue: number;
  totalCost: number;
  hideValues: boolean;
}

type SortColumn =
  | 'ticker'
  | 'qty'
  | 'subType'
  | 'avgPrice'
  | 'curPrice'
  | 'variationPct'
  | 'returnPct'
  | 'vacancy'
  | 'total'
  | 'receivedDividends'
  | 'pvp'
  | 'dy'
  | 'yieldOnCost'
  | 'rating'
  | 'currentPct'
  | 'targetPct'
  | 'shouldBuy';

type SortDirection = 'asc' | 'desc';

export const PosicoesTab: React.FC<PosicoesTabProps> = ({
  positions,
  totalValue,
  totalCost,
  hideValues,
}) => {
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [sortColumn, setSortColumn] = useState<SortColumn>('total');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const toggleExpand = (cls: string) => {
    setExpandedClasses((prev) => ({ ...prev, [cls]: !prev[cls] }));
  };

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection(col === 'ticker' || col === 'subType' ? 'asc' : 'desc');
    }
  };

  const sortItems = (items: RealAssetClassGroup['items']) => {
    return [...items].sort((a, b) => {
      let valA: any = a[sortColumn];
      let valB: any = b[sortColumn];

      if (typeof valA === 'string' || typeof valB === 'string') {
        const strA = (valA || '').toString().toLowerCase();
        const strB = (valB || '').toString().toLowerCase();
        return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      }

      if (typeof valA === 'boolean' || typeof valB === 'boolean') {
        const numA = valA ? 1 : 0;
        const numB = valB ? 1 : 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });
  };

  const renderSortIcon = (col: SortColumn) => {
    if (sortColumn !== col) {
      return <ArrowUpDown className="h-2.5 w-2.5 text-slate-500 opacity-40 group-hover:opacity-100 transition inline ml-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-2.5 w-2.5 text-amber-400 inline ml-1" />
    ) : (
      <ArrowDown className="h-2.5 w-2.5 text-amber-400 inline ml-1" />
    );
  };

  const fmt = (val: number, isCurrency = true) => {
    if (hideValues) return '••••••';
    if (isCurrency) {
      return `R$ ${(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return (val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const assetClasses = groupPositionsByClass(positions, totalValue);
  const totalProfitBrl = totalValue - totalCost;
  const totalProfitPct = totalCost > 0 ? (totalProfitBrl / totalCost) * 100 : 0;

  // Destaques da Carteira Reais
  const sortedByReturn = [...positions].sort((a, b) => b.profitPercentage - a.profitPercentage);
  const bestPosition = sortedByReturn.length > 0 ? sortedByReturn[0] : null;
  const worstPosition = sortedByReturn.length > 1 ? sortedByReturn[sortedByReturn.length - 1] : null;

  // Posições no Lucro Reais
  const profitablePositions = positions.filter((p) => p.profitAmount >= 0);
  const unprofitablePositions = positions.filter((p) => p.profitAmount < 0);
  const profitablePct = positions.length > 0 ? (profitablePositions.length / positions.length) * 100 : 0;

  // Oportunidades Reais (posições com preço atual abaixo do preço médio)
  const opportunities = positions.filter((p) => p.currentPrice < p.averagePrice);

  return (
    <div className="space-y-5 text-slate-200">
      {/* 4 Cards Superiores com Dados Reais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Patrimônio Total */}
        <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="p-1 rounded bg-[#1C2538] text-slate-300">📊</span>
            <span>Patrimônio total</span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{fmt(totalValue)}</span>
              <span
                className={`text-[11px] font-extrabold ${
                  totalProfitPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {totalProfitPct >= 0 ? '+' : ''}
                {totalProfitPct.toFixed(2)}% {totalProfitPct >= 0 ? '▲' : '▼'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Valor investido: <b className="text-slate-300">{fmt(totalCost)}</b>
            </div>
          </div>
        </div>

        {/* 2. Destaques da Carteira */}
        <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span>Destaques da carteira</span>
          </div>

          <div className="my-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Melhor posição</span>
              {bestPosition ? (
                <>
                  <b className="text-white block font-bold">{bestPosition.ticker}</b>
                  <span className="text-emerald-400 font-extrabold text-xs">
                    +{bestPosition.profitPercentage.toFixed(2)}% ↗
                  </span>
                </>
              ) : (
                <span className="text-slate-500 font-bold">---</span>
              )}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Pior posição</span>
              {worstPosition ? (
                <>
                  <b className="text-white block font-bold">{worstPosition.ticker}</b>
                  <span
                    className={`font-extrabold text-xs ${
                      worstPosition.profitPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {worstPosition.profitPercentage.toFixed(2)}% {worstPosition.profitPercentage >= 0 ? '↗' : '↘'}
                  </span>
                </>
              ) : (
                <span className="text-slate-500 font-bold">---</span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Posições no Lucro */}
        <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded bg-[#1C2538] text-slate-300">📊</span>
              <span>Posições no lucro</span>
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white">
                {profitablePositions.length} de {positions.length}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[10px]">
                {profitablePct.toFixed(0)}%
              </span>
            </div>

            {/* Barra de Progresso Verde e Vermelha */}
            <div className="h-2 w-full rounded-full bg-white/10 flex overflow-hidden my-2">
              <div style={{ width: `${profitablePct}%` }} className="bg-emerald-400 h-full transition-all" />
              <div style={{ width: `${100 - profitablePct}%` }} className="bg-rose-500 h-full transition-all" />
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-emerald-400">{profitablePositions.length} no lucro ▲</span>
              <span className="text-rose-400">{unprofitablePositions.length} no prejuízo ▾</span>
            </div>
          </div>
        </div>

        {/* 4. Oportunidades de Compra */}
        <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="p-1 rounded bg-[#1C2538] text-slate-300">🛒</span>
            <span>Abaixo do P. Médio</span>
          </div>

          <div className="my-2">
            <div className="text-xl font-black text-white">{opportunities.length} ativos</div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Ativos com cotação abaixo do custo médio
            </span>
          </div>
        </div>
      </div>

      {/* Lista de Ativos com Grupos */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white">Meus Ativos ({positions.length})</h3>
        </div>

        {assetClasses.length > 0 ? (
          <div className="space-y-2">
            {assetClasses.map((cls) => {
              const isExpanded = !!expandedClasses[cls.id];
              return (
                <div
                  key={cls.id}
                  className="rounded-2xl bg-[#141A26] border border-[#212B3E] overflow-hidden transition shadow-sm hover:border-[#2D3A54]"
                >
                  <div
                    onClick={() => toggleExpand(cls.id)}
                    className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-[#182030] transition select-none"
                  >
                    <div className="flex items-center gap-3 min-w-[150px]">
                      <span className="text-slate-500 font-mono text-xs">:::</span>
                      <span
                        className={`h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs ${cls.iconColor}`}
                      >
                        {cls.icon}
                      </span>
                      <span className="font-bold text-white text-sm">{cls.name}</span>
                    </div>

                    <div className="text-center min-w-[50px]">
                      <span className="text-[10px] text-slate-400 block uppercase">Ativos</span>
                      <b className="text-white text-xs">{cls.count}</b>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <span className="text-[10px] text-slate-400 block uppercase">Valor total</span>
                      <b className="text-white text-xs">{fmt(cls.totalValue)}</b>
                    </div>

                    <div className="text-right min-w-[85px]">
                      <span className="text-[10px] text-slate-400 block uppercase">Variação</span>
                      <span
                        className={`text-xs font-bold ${
                          cls.variationPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {cls.variationPct >= 0 ? '+' : ''}
                        {cls.variationPct.toFixed(2)}% {cls.variationPct >= 0 ? '▲' : '▼'}
                      </span>
                    </div>

                    <div className="text-right min-w-[95px]">
                      <span className="text-[10px] text-slate-400 block uppercase">Rentabilidade</span>
                      <span
                        className={`text-xs font-extrabold ${
                          cls.returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {cls.returnPct >= 0 ? '+' : ''}
                        {cls.returnPct.toFixed(2)}% {cls.returnPct >= 0 ? '↗' : '↘'}
                      </span>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <span className="text-[10px] text-slate-400 block uppercase">% na carteira</span>
                      <span className="text-xs font-bold text-slate-200 flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {cls.currentPct.toFixed(1)}% / {cls.targetPct}%
                      </span>
                    </div>

                    <div className="text-slate-400 pl-2">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {isExpanded && (() => {
                    const isFii = cls.id === 'fii' || cls.id === 'reit';
                    return (
                      <div className="bg-[#0D121B] border-t border-[#1E2638] p-4 animate-in fade-in duration-150 overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300 whitespace-nowrap">
                          <thead className="uppercase text-[10px] text-slate-400 font-bold border-b border-white/5 select-none bg-[#0D121B]">
                            <tr>
                              {/* 1. Ativo */}
                              <th
                                onClick={() => handleSort('ticker')}
                                className="py-2.5 px-2 cursor-pointer hover:text-white transition group"
                              >
                                <span className="inline-flex items-center">
                                  Ativo {renderSortIcon('ticker')}
                                </span>
                              </th>

                              {/* 2. Quant. */}
                              <th
                                onClick={() => handleSort('qty')}
                                className="py-2.5 px-2 cursor-pointer hover:text-white transition group"
                              >
                                <span className="inline-flex items-center">
                                  Quant. {renderSortIcon('qty')}
                                </span>
                              </th>

                              {/* 3. Tipo (somente FIIs) */}
                              {isFii && (
                                <th
                                  onClick={() => handleSort('subType')}
                                  className="py-2.5 px-2 cursor-pointer hover:text-white transition group"
                                >
                                  <span className="inline-flex items-center">
                                    Tipo {renderSortIcon('subType')}
                                  </span>
                                </th>
                              )}

                              {/* 4. Preço Médio */}
                              <th
                                onClick={() => handleSort('avgPrice')}
                                className="py-2.5 px-2 cursor-pointer hover:text-white transition group"
                              >
                                <span className="inline-flex items-center">
                                  Preço Médio {renderSortIcon('avgPrice')}
                                </span>
                              </th>

                              {/* 5. Preço Atual */}
                              <th
                                onClick={() => handleSort('curPrice')}
                                className="py-2.5 px-2 cursor-pointer hover:text-white transition group"
                              >
                                <span className="inline-flex items-center">
                                  Preço Atual {renderSortIcon('curPrice')}
                                </span>
                              </th>

                              {/* 6. Variação */}
                              <th
                                onClick={() => handleSort('variationPct')}
                                className="py-2.5 px-2 cursor-pointer hover:text-white transition group"
                              >
                                <span className="inline-flex items-center">
                                  Variação <span className="text-[10px] font-normal text-slate-500 ml-0.5">ⓘ</span> {renderSortIcon('variationPct')}
                                </span>
                              </th>

                              {/* 7. Rentabilidade */}
                              <th
                                onClick={() => handleSort('returnPct')}
                                className="py-2.5 px-2 cursor-pointer hover:text-white transition group"
                              >
                                <span className="inline-flex items-center">
                                  Rentabilidade <span className="text-[10px] font-normal text-slate-500 ml-0.5">ⓘ</span> {renderSortIcon('returnPct')}
                                </span>
                              </th>

                              {/* 8. Vacância (somente FIIs) */}
                              {isFii && (
                                <th
                                  onClick={() => handleSort('vacancy')}
                                  className="py-2.5 px-2 cursor-pointer hover:text-white transition group"
                                >
                                  <span className="inline-flex items-center">
                                    Vacância {renderSortIcon('vacancy')}
                                  </span>
                                </th>
                              )}

                              {/* 9. Saldo */}
                              <th
                                onClick={() => handleSort('total')}
                                className="py-2.5 px-2 cursor-pointer hover:text-white transition group"
                              >
                                <span className="inline-flex items-center">
                                  Saldo {renderSortIcon('total')}
                                </span>
                              </th>

                              {/* 10. Proventos Recebidos */}
                              <th
                                onClick={() => handleSort('receivedDividends')}
                                className="py-2.5 px-2 cursor-pointer hover:text-white transition group"
                              >
                                <span className="inline-flex items-center">
                                  Proventos Recebidos <span className="text-[10px] font-normal text-slate-500 ml-0.5">ⓘ</span> {renderSortIcon('receivedDividends')}
                                </span>
                              </th>

                              {/* 11. P/VP (somente FIIs) */}
                              {isFii && (
                                <th
                                  onClick={() => handleSort('pvp')}
                                  className="py-2.5 px-2 cursor-pointer hover:text-white transition group"
                                >
                                  <span className="inline-flex items-center">
                                    P/VP {renderSortIcon('pvp')}
                                  </span>
                                </th>
                              )}

                              {/* 12. DY */}
                              <th
                                onClick={() => handleSort('dy')}
                                className="py-2.5 px-2 cursor-pointer hover:text-white transition group"
                              >
                                <span className="inline-flex items-center">
                                  DY <span className="text-[10px] font-normal text-slate-500 ml-0.5">ⓘ</span> {renderSortIcon('dy')}
                                </span>
                              </th>

                              {/* 13. Yield On Cost */}
                              <th
                                onClick={() => handleSort('yieldOnCost')}
                                className="py-2.5 px-2 cursor-pointer hover:text-white transition group"
                              >
                                <span className="inline-flex items-center">
                                  Yield On Cost <span className="text-[10px] font-normal text-slate-500 ml-0.5">ⓘ</span> {renderSortIcon('yieldOnCost')}
                                </span>
                              </th>

                              {/* 14. Nota */}
                              <th
                                onClick={() => handleSort('rating')}
                                className="py-2.5 px-2 cursor-pointer hover:text-white transition group"
                              >
                                <span className="inline-flex items-center">
                                  Nota <span className="text-[10px] font-normal text-slate-500 ml-0.5">ⓘ</span> {renderSortIcon('rating')}
                                </span>
                              </th>

                              {/* 15. % Carteira */}
                              <th
                                onClick={() => handleSort('currentPct')}
                                className="py-2.5 px-2 cursor-pointer hover:text-white transition group"
                              >
                                <span className="inline-flex items-center">
                                  % Carteira <span className="text-[10px] font-normal text-slate-500 ml-0.5">ⓘ</span> {renderSortIcon('currentPct')}
                                </span>
                              </th>

                              {/* 16. % Ideal */}
                              <th
                                onClick={() => handleSort('targetPct')}
                                className="py-2.5 px-2 cursor-pointer hover:text-white transition group"
                              >
                                <span className="inline-flex items-center">
                                  % Ideal <span className="text-[10px] font-normal text-slate-500 ml-0.5">ⓘ</span> {renderSortIcon('targetPct')}
                                </span>
                              </th>

                              {/* 17. Comprar ? */}
                              <th
                                onClick={() => handleSort('shouldBuy')}
                                className="py-2.5 px-2 cursor-pointer hover:text-white transition group"
                              >
                                <span className="inline-flex items-center">
                                  Comprar ? {renderSortIcon('shouldBuy')}
                                </span>
                              </th>

                              {/* 18. Opções */}
                              <th className="py-2.5 px-2 text-center">
                                <span>Opções</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {sortItems(cls.items).map((it) => (
                              <tr key={it.ticker} className="hover:bg-white/5 transition">
                                {/* 1. Ativo */}
                                <td className="py-2.5 px-2 font-bold text-white">
                                  <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded bg-[#1C2538] border border-[#2A3750] flex items-center justify-center text-[10px] font-black text-amber-400">
                                      {it.ticker.slice(0, 2)}
                                    </div>
                                    <div>
                                      <span className="font-bold text-white block">{it.ticker}</span>
                                      {it.name !== it.ticker && (
                                        <span className="text-[10px] text-slate-400 font-normal block max-w-[120px] truncate">
                                          {it.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* 2. Quant. */}
                                <td className="py-2.5 px-2 text-slate-200 font-medium">
                                  {it.qty.toLocaleString('pt-BR')}
                                </td>

                                {/* 3. Tipo (somente FIIs) */}
                                {isFii && (
                                  <td className="py-2.5 px-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1C2538] text-slate-300 border border-[#2B3952]">
                                      {it.subType || 'Indefinido'}
                                    </span>
                                  </td>
                                )}

                                {/* 4. Preço Médio */}
                                <td className="py-2.5 px-2">
                                  <span className="inline-flex items-center gap-1 text-slate-300">
                                    {fmt(it.avgPrice)}
                                    <Edit2 className="h-3 w-3 text-slate-500 hover:text-slate-300 cursor-pointer" />
                                  </span>
                                </td>

                                {/* 5. Preço Atual */}
                                <td className="py-2.5 px-2 font-bold text-white">
                                  {fmt(it.curPrice)}
                                </td>

                                {/* 6. Variação */}
                                <td className="py-2.5 px-2">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                      it.variationPct >= 0
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}
                                  >
                                    {it.variationPct >= 0 ? '+' : ''}
                                    {it.variationPct.toFixed(2)}% {it.variationPct >= 0 ? '▲' : '▼'}
                                  </span>
                                </td>

                                {/* 7. Rentabilidade */}
                                <td className="py-2.5 px-2">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                                      it.returnPct >= 0
                                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                    }`}
                                  >
                                    {it.returnPct >= 0 ? '+' : ''}
                                    {it.returnPct.toFixed(2)}% {it.returnPct >= 0 ? '↗' : '↘'}
                                  </span>
                                </td>

                                {/* 8. Vacância (somente FIIs) */}
                                {isFii && (
                                  <td className="py-2.5 px-2 text-slate-400">
                                    {it.vacancy !== undefined && it.vacancy !== null && it.vacancy > 0
                                      ? `${it.vacancy.toFixed(2)}%`
                                      : it.vacancy === 0
                                      ? '0,00%'
                                      : '-'}
                                  </td>
                                )}

                                {/* 9. Saldo */}
                                <td className="py-2.5 px-2 font-black text-white">
                                  {fmt(it.total)}
                                </td>

                                {/* 10. Proventos Recebidos */}
                                <td className="py-2.5 px-2 font-semibold text-emerald-400">
                                  {it.receivedDividends > 0 ? fmt(it.receivedDividends) : 'R$ 0,00'}
                                </td>

                                {/* 11. P/VP (somente FIIs) */}
                                {isFii && (
                                  <td className="py-2.5 px-2 text-slate-300">
                                    {it.pvp ? it.pvp.toFixed(2) : '-'}
                                  </td>
                                )}

                                {/* 12. DY */}
                                <td className="py-2.5 px-2 text-slate-300">
                                  {it.dy ? `${it.dy.toFixed(2)}%` : '0,00%'}
                                </td>

                                {/* 13. Yield On Cost */}
                                <td className="py-2.5 px-2 text-slate-300">
                                  {it.yieldOnCost ? `${it.yieldOnCost.toFixed(2)}%` : '0,00%'}
                                </td>

                                {/* 14. Nota */}
                                <td className="py-2.5 px-2">
                                  <span className="inline-flex items-center justify-center h-5 w-6 rounded bg-[#1A2336] text-slate-200 text-[11px] font-bold border border-[#2B3952]">
                                    {it.rating || 10}
                                  </span>
                                </td>

                                {/* 15. % Carteira */}
                                <td className="py-2.5 px-2 text-slate-300">
                                  {it.currentPct ? `${it.currentPct.toFixed(2)}%` : '0,00%'}
                                </td>

                                {/* 16. % Ideal */}
                                <td className="py-2.5 px-2 text-slate-400">
                                  {it.targetPct ? `${it.targetPct.toFixed(2)}%` : '0,00%'}
                                </td>

                                {/* 17. Comprar ? */}
                                <td className="py-2.5 px-2">
                                  {it.shouldBuy ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
                                      <Check className="h-3 w-3" /> Sim
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/80">
                                      <span className="text-[10px] opacity-70">⊘</span> Não
                                    </span>
                                  )}
                                </td>

                                {/* 18. Opções */}
                                <td className="py-2.5 px-2 text-center">
                                  <button
                                    type="button"
                                    className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-white transition"
                                    title="Opções"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] p-8 text-center space-y-3">
            <Layers className="h-8 w-8 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">Nenhuma posição ativa</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Cadastre suas compras de ativos para visualizar seus ganhos e destaques.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
