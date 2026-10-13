import React, { useState } from 'react';
import { PortfolioPosition, InvestmentTransaction } from '../../../domain/types';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  PlusCircle,
  UploadCloud,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  MoreHorizontal,
} from 'lucide-react';
import {
  groupPositionsByClass,
  computeEvolutionHistory,
  RealAssetClassGroup,
} from '../../../infrastructure/investmentsService';

interface ResumoTabProps {
  positions: PortfolioPosition[];
  transactions: InvestmentTransaction[];
  totalValue: number;
  totalCost: number;
  totalProfitBrl: number;
  totalProfitPct: number;
  hideValues: boolean;
  onOpenAddModal?: () => void;
  onOpenB3?: () => void;
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

export const ResumoTab: React.FC<ResumoTabProps> = ({
  positions,
  transactions,
  totalValue,
  totalCost,
  totalProfitBrl,
  totalProfitPct,
  hideValues,
  onOpenAddModal,
  onOpenB3,
}) => {
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
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

  // 12 Meses de Dados de Evolução Histórica baseados nas transações reais
  const historyData = computeEvolutionHistory(transactions, totalCost, totalProfitBrl);
  const maxBarValue = Math.max(1, ...historyData.map((d) => d.applied + d.profit));

  // Agrupamento Real por Classes de Ativos
  const assetClasses = groupPositionsByClass(positions, totalValue);

  // Proventos anuais estimados reais e proventos recebidos acumulados
  const annualEstimatedDivs = positions.reduce(
    (acc, pos) => acc + (pos.annualEstimatedDividends || 0),
    0
  );
  const monthlyEstimatedDivs = annualEstimatedDivs / 12;
  const totalReceivedDividends = positions.reduce(
    (acc, pos) => acc + (pos.receivedDividends || 0),
    0
  );

  const totalVariationBrl = totalValue - totalCost;
  const totalVariationPct = totalCost > 0 ? (totalVariationBrl / totalCost) * 100 : 0;

  const totalAssetsCount = positions.length;

  return (
    <div className="space-y-5 text-slate-200">
      {/* ========================================================================= */}
      {/* 1. CARDS DO TOPO (PATRIMÔNIO, LUCRO TOTAL, PROVENTOS 12M, RENTABILIDADE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Patrimônio Total */}
        <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="p-1 rounded bg-[#1C2538] text-slate-300">📊</span>
            <span>Patrimônio total</span>
          </div>

          <div className="my-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white tracking-tight">
                {fmt(totalValue)}
              </span>
              <span
                className={`inline-flex items-center text-[11px] font-extrabold ${
                  totalVariationPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {totalVariationPct >= 0 ? '+' : ''}
                {totalVariationPct.toFixed(2)}% {totalVariationPct >= 0 ? '▲' : '▼'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Valor investido: <b className="text-slate-300">{fmt(totalCost)}</b>
            </div>
          </div>
        </div>

        {/* Card 2: Lucro Total */}
        <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="p-1 rounded bg-[#1C2538] text-slate-300">💰</span>
            <span>Lucro total</span>
          </div>

          <div className="my-2.5">
            <div
              className={`text-2xl font-black tracking-tight ${
                totalProfitBrl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {fmt(totalProfitBrl)}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mt-1">
              <div>
                Ganho de Capital <br />
                <b className={totalVariationBrl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{fmt(totalVariationBrl)}</b>
              </div>
              <div>
                Proventos Recebidos <br />
                <b className="text-emerald-400">{fmt(totalReceivedDividends)}</b>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Proventos */}
        <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="p-1 rounded bg-[#1C2538] text-slate-300">📄</span>
            <span>Proventos da Carteira</span>
          </div>

          <div className="my-2.5">
            <div className="text-2xl font-black text-emerald-400 tracking-tight">
              {fmt(totalReceivedDividends)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Projeção 12M: <b className="text-slate-300">{fmt(annualEstimatedDivs)}</b>
            </div>
          </div>
        </div>

        {/* Card 4: Rentabilidade Total */}
        <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="p-1 rounded bg-[#1C2538] text-slate-300">📈</span>
            <span>Rentabilidade da Carteira</span>
          </div>

          <div className="my-2.5 flex items-center justify-between">
            <div
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-extrabold text-xs ${
                totalProfitPct >= 0
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
              }`}
            >
              <span>
                {totalProfitPct >= 0 ? '+' : ''}
                {totalProfitPct.toFixed(2)}%
              </span>
              {totalProfitPct >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="text-[10px] text-slate-400 text-right">
              Variação cotas: <b className={totalVariationPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{totalVariationPct >= 0 ? '+' : ''}{totalVariationPct.toFixed(2)}%</b>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. LINHA DO MEIO: EVOLUÇÃO DO PATRIMÔNIO (60%) + ATIVOS NA CARTEIRA (40%) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Evolução do Patrimônio (Stacked Bar Chart Real) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#141A26] border border-[#212B3E] p-5 shadow-sm relative">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-black text-white">Evolução do Patrimônio</h3>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1A2234] border border-[#27344D] text-xs font-semibold text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Últimos 12 Meses</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex items-center justify-center gap-6 text-xs text-slate-300 mb-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-emerald-600" />
              <span>Valor aplicado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-emerald-400" />
              <span>Ganho de Capital</span>
            </div>
          </div>

          {/* Gráfico de Barras */}
          {totalValue > 0 ? (
            <div className="relative h-48 flex items-end justify-between gap-1.5 pt-4 pb-2 border-b border-white/5 px-2">
              {historyData.map((item, idx) => {
                const appliedHeight = maxBarValue > 0 ? (item.applied / maxBarValue) * 100 : 0;
                const profitHeight = maxBarValue > 0 ? (Math.max(0, item.profit) / maxBarValue) * 100 : 0;
                const isHovered = hoveredBarIndex === idx;

                return (
                  <div
                    key={item.label}
                    className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group relative"
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-16 z-20 w-44 bg-[#0B0F17] border border-[#2B3852] rounded-xl p-2.5 shadow-2xl text-[10px] pointer-events-none animate-in fade-in zoom-in-95">
                        <b className="text-white block pb-1 border-b border-white/10">{item.label}</b>
                        <div className="mt-1 space-y-1">
                          <div className="flex justify-between text-slate-300">
                            <span>Patrimônio:</span>
                            <b className="text-white">{fmt(item.applied + item.profit)}</b>
                          </div>
                          <div className="flex justify-between text-emerald-400">
                            <span>■ Valor aplicado:</span>
                            <b>{fmt(item.applied)}</b>
                          </div>
                          <div className="flex justify-between text-emerald-300">
                            <span>■ Ganho de Capital:</span>
                            <b>{fmt(item.profit)}</b>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Barras */}
                    <div className="w-full max-w-[24px] flex flex-col justify-end">
                      <div
                        style={{ height: `${profitHeight}%` }}
                        className={`w-full rounded-t-sm transition-all ${
                          isHovered ? 'bg-emerald-300' : 'bg-emerald-400'
                        }`}
                      />
                      <div
                        style={{ height: `${appliedHeight}%` }}
                        className={`w-full transition-all ${
                          isHovered ? 'bg-emerald-500' : 'bg-emerald-600'
                        }`}
                      />
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400 mt-2">{item.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-xl">
              <span className="text-xs text-slate-400">Sem histórico de movimentações registrado</span>
            </div>
          )}
        </div>

        {/* Ativos na Carteira (Donut Chart Real & Distribuição) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#141A26] border border-[#212B3E] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-white">Distribuição por Classes</h3>
            <span className="text-xs text-slate-400">{assetClasses.length} classe(s)</span>
          </div>

          {assetClasses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Donut Chart */}
              <div className="sm:col-span-5 flex items-center justify-center relative">
                <div className="h-32 w-32 rounded-full border-8 border-[#1A2234] flex items-center justify-center flex-col shadow-inner">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
                  <b className="text-xs font-black text-white">{totalAssetsCount} ativos</b>
                </div>
              </div>

              {/* Lista com Porcentagens à Direita */}
              <div className="sm:col-span-7 space-y-2 text-xs">
                {assetClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between text-[11px] py-0.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: cls.color }} />
                      <span className="text-slate-300 font-medium truncate max-w-[110px]">{cls.name}</span>
                    </div>
                    <div className="text-right">
                      <b className="text-white font-bold">{cls.currentPct.toFixed(1)}%</b>
                      <span className="text-[10px] text-slate-500 block">{fmt(cls.totalValue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-xl">
              <span className="text-xs text-slate-400">Nenhum ativo cadastrado</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PARTE INFERIOR: MEUS ATIVOS COM ACCORDION EXPANSÍVEL POR CLASSE        */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white">
            Meus Ativos ({totalAssetsCount})
          </h3>
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
                  {/* Linha Principal da Classe */}
                  {/* Linha Principal da Classe */}
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

                  {/* Tabela de Ativos Individuais ao Expandir */}
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
          <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] p-8 text-center space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-[#1C2538] border border-[#2B3852] flex items-center justify-center mx-auto text-slate-400">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Nenhum ativo cadastrado na carteira</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                Adicione suas compras manualmente ou faça o upload da sua planilha de negociações da B3 para ver o resumo completo.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              {onOpenAddModal && (
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Adicionar Lançamento</span>
                </button>
              )}
              {onOpenB3 && (
                <button
                  type="button"
                  onClick={onOpenB3}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1C2538] hover:bg-[#25324A] border border-[#2B3852] text-white font-bold text-xs transition"
                >
                  <UploadCloud className="h-4 w-4 text-amber-400" />
                  <span>Importar B3</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
