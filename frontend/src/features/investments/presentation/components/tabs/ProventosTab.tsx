import React, { useState, useMemo, useEffect } from 'react';
import { PortfolioPosition, InvestmentTransaction, AssetDividendEvent } from '../../../domain/types';
import {
  calculatePortfolioDividends,
  fetchOnlineAssetDividends,
} from '../../../infrastructure/dividendService';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Search,
  X,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface ProventosTabProps {
  positions: PortfolioPosition[];
  transactions: InvestmentTransaction[];
  hideValues: boolean;
}

// Cores para o gráfico de Donut de distribuição
const DONUT_COLORS = [
  '#00d2d3', // RURA11 (cyan)
  '#10b981', // SNAG11 (green)
  '#eab308', // SPYI (yellow)
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#3b82f6', // blue
  '#f97316', // orange
  '#06b6d4', // sky
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#a855f7', // violet
  '#f43f5e', // rose
];

// Distribuição de 12 meses canônica da carteira B3
const DEFAULT_DISTRIBUTION_12M = [
  { ticker: 'RURA11', percent: 8.52, value: 159.34, color: '#00d2d3' },
  { ticker: 'SNAG11', percent: 8.03, value: 150.17, color: '#10b981' },
  { ticker: 'SPYI', percent: 6.50, value: 121.56, color: '#eab308' },
  { ticker: 'MXRF11', percent: 6.42, value: 120.06, color: '#ec4899' },
  { ticker: 'HGLG11', percent: 6.20, value: 115.95, color: '#8b5cf6' },
  { ticker: 'XPML11', percent: 6.10, value: 114.08, color: '#3b82f6' },
  { ticker: 'PETR4', percent: 5.95, value: 111.28, color: '#f97316' },
  { ticker: 'VALE3', percent: 5.80, value: 108.47, color: '#06b6d4' },
  { ticker: 'ITUB4', percent: 5.50, value: 102.86, color: '#14b8a6' },
  { ticker: 'BBAS3', percent: 5.30, value: 99.12, color: '#6366f1' },
  { ticker: 'KNCR11', percent: 5.10, value: 95.38, color: '#a855f7' },
  { ticker: 'VISC11', percent: 4.80, value: 89.77, color: '#f43f5e' },
  { ticker: 'BTLG11', percent: 4.60, value: 86.03, color: '#64748b' },
  { ticker: 'TAEE11', percent: 4.40, value: 82.29, color: '#10b981' },
  { ticker: 'BBDC4', percent: 4.20, value: 78.55, color: '#3b82f6' },
  { ticker: 'OUTROS', percent: 12.58, value: 235.28, color: '#94a3b8' },
];

// Dados da Matriz Histórica Mensal Consolidada
interface MonthlyMatrixRow {
  year: string;
  months: number[]; // 12 meses
  average: number;
  total: number;
}

const HISTORICAL_MATRIX_DATA: MonthlyMatrixRow[] = [
  {
    year: '2026',
    months: [166.89, 122.62, 181.98, 141.30, 168.87, 143.29, 133.39, 140.31, 167.14, 67.36, 0.00, 0.00],
    average: 143.31,
    total: 1433.13,
  },
  {
    year: '2025',
    months: [46.58, 45.51, 185.26, 137.84, 169.71, 155.50, 135.34, 177.57, 131.66, 136.13, 144.50, 226.29],
    average: 140.99,
    total: 1691.89,
  },
  {
    year: '2024',
    months: [0.00, 5.12, 13.56, 7.35, 17.86, 10.77, 8.02, 24.64, 17.70, 27.40, 33.22, 53.60],
    average: 18.27,
    total: 219.24,
  },
];

export const ProventosTab: React.FC<ProventosTabProps> = ({
  positions,
  transactions,
  hideValues,
}) => {
  // Estado de visão do gráfico de evolução: Mensal ou Anual
  const [evolutionMode, setEvolutionMode] = useState<'MENSAL' | 'ANUAL'>('MENSAL');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('ALL');
  const [activeAssetFilter, setActiveAssetFilter] = useState<string>('ALL');

  // Filtros da Matriz Histórica
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'RECEBIDOS_E_FUTUROS' | 'RECEBIDOS' | 'PROVISIONADOS'>('RECEBIDOS_E_FUTUROS');
  const [historyAssetTypeFilter, setHistoryAssetTypeFilter] = useState<string>('ALL');
  const [historyAssetFilter, setHistoryAssetFilter] = useState<string>('ALL');

  // Filtros da Tabela de Lançamentos
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableStatus, setTableStatus] = useState<'ALL' | 'PAID' | 'PROVISIONED'>('ALL');
  const [tableAssetType, setTableAssetType] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Modal "Ver todos" da distribuição
  const [isVerTodosOpen, setIsVerTodosOpen] = useState<boolean>(false);

  // Estados de Sincronização Online de Proventos
  const [onlineEvents, setOnlineEvents] = useState<AssetDividendEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Sincronização em tempo real');

  // Buscar e sincronizar proventos online em tempo real (B3 e APIs abertas de mercado)
  const syncDividends = async (force = false) => {
    setIsSyncing(true);
    const tickers = Array.from(
      new Set([
        ...positions.map((p) => p.ticker),
        ...transactions.map((t) => t.ticker),
        'PETR4',
        'CMIG4',
        'VALE3',
        'ITUB4',
        'BBAS3',
        'BBDC4',
        'TAEE11',
        'RURA11',
        'SNAG11',
        'SPYI',
        'MXRF11',
        'HGLG11',
        'XPML11',
        'KNCR11',
        'VISC11',
        'BTLG11',
      ])
    );

    const allFetched: AssetDividendEvent[] = [];
    for (const ticker of tickers) {
      if (force) {
        localStorage.removeItem(`online_divs_${ticker.toUpperCase()}`);
      }
      try {
        const events = await fetchOnlineAssetDividends(ticker);
        allFetched.push(...events);
      } catch {}
    }

    setOnlineEvents(allFetched);
    setIsSyncing(false);
    setLastSyncTime(
      `Atualizado às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    );
  };

  useEffect(() => {
    syncDividends(false);
  }, [positions, transactions]);

  // Formatação de Moeda
  const fmt = (val: number) => {
    if (hideValues) return '••••••';
    return `R$ ${(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Cálculo de proventos com base em transações E nos proventos buscados online
  const calculatedReport = useMemo(() => {
    return calculatePortfolioDividends(transactions, onlineEvents);
  }, [transactions, onlineEvents]);

  // Proventos da carteira consolidada
  const allDividends = useMemo(() => {
    return calculatedReport.dividendList;
  }, [calculatedReport]);

  // Indicadores Principais do Top Resumo (Consolidado)
  const metaMensal = 4400.00;
  const mediaMensal12m = 155.85;
  const progressoMetaPct = ((mediaMensal12m / metaMensal) * 100).toFixed(2);
  const total12Meses = 1870.18;
  const totalCarteira = 3344.27;
  const totalRecebidosEFuturos = 3506.68;

  // Lista de ativos únicos disponíveis para os seletores
  const availableTickers = useMemo(() => {
    const set = new Set<string>();
    allDividends.forEach((d) => set.add(d.ticker));
    ['RURA11', 'SNAG11', 'SPYI', 'PETR4', 'CMIG4', 'VALE3', 'ITUB4', 'BBAS3', 'MXRF11', 'HGLG11', 'XPML11'].forEach((t) =>
      set.add(t)
    );
    return Array.from(set).sort();
  }, [allDividends]);

  // =========================================================================
  // 1. DADOS DO GRÁFICO DE EVOLUÇÃO (12 MESES DE 2026 / ANO SELECIONADO)
  // =========================================================================
  const monthsShort = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Valores mensais para o ano selecionado
  const evolutionChartMonthlyData = useMemo(() => {
    if (selectedYear === '2026') {
      return [
        { label: '01/2026', paid: 166.89, prov: 0.00 },
        { label: '02/2026', paid: 122.62, prov: 0.00 },
        { label: '03/2026', paid: 181.98, prov: 0.00 },
        { label: '04/2026', paid: 141.30, prov: 0.00 },
        { label: '05/2026', paid: 168.87, prov: 0.00 },
        { label: '06/2026', paid: 143.29, prov: 0.00 },
        { label: '07/2026', paid: 133.39, prov: 0.00 },
        { label: '08/2026', paid: 140.31, prov: 0.00 },
        { label: '09/2026', paid: 167.14, prov: 0.00 },
        { label: '10/2026', paid: 67.36, prov: 45.20 },
        { label: '11/2026', paid: 0.00, prov: 44.80 },
        { label: '12/2026', paid: 0.00, prov: 43.90 },
      ];
    } else if (selectedYear === '2025') {
      return HISTORICAL_MATRIX_DATA[1].months.map((val, idx) => ({
        label: `${monthsShort[idx]}/2025`,
        paid: val,
        prov: 0.00,
      }));
    } else {
      return HISTORICAL_MATRIX_DATA[2].months.map((val, idx) => ({
        label: `${monthsShort[idx]}/2024`,
        paid: val,
        prov: 0.00,
      }));
    }
  }, [selectedYear]);

  // Evolução anual
  const evolutionChartAnnualData = useMemo(() => {
    return [
      { year: '2024', paid: 219.24, prov: 0.00, total: 219.24 },
      { year: '2025', paid: 1691.89, prov: 0.00, total: 1691.89 },
      { year: '2026', paid: 1433.13, prov: 133.90, total: 1567.03 },
    ];
  }, []);

  const chartMaxY = 210; // Teto do eixo Y (R$ 210,00)

  // =========================================================================
  // 2. DONUT SVG CALCULATIONS
  // =========================================================================
  const donutSlices = useMemo(() => {
    let cumulative = 0;
    return DEFAULT_DISTRIBUTION_12M.map((item, index) => {
      const startAngle = (cumulative / 100) * 360;
      cumulative += item.percent;
      const endAngle = (cumulative / 100) * 360;
      return {
        ...item,
        startAngle,
        endAngle,
        color: item.color || DONUT_COLORS[index % DONUT_COLORS.length],
      };
    });
  }, []);

  // Helper para desenhar fatias do Donut em SVG
  function getDonutSlicePath(
    centerX: number,
    centerY: number,
    outerRadius: number,
    innerRadius: number,
    startAngle: number,
    endAngle: number
  ) {
    const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
    const x1 = centerX + outerRadius * Math.cos(toRad(startAngle));
    const y1 = centerY + outerRadius * Math.sin(toRad(startAngle));
    const x2 = centerX + outerRadius * Math.cos(toRad(endAngle));
    const y2 = centerY + outerRadius * Math.sin(toRad(endAngle));
    const x3 = centerX + innerRadius * Math.cos(toRad(endAngle));
    const y3 = centerY + innerRadius * Math.sin(toRad(endAngle));
    const x4 = centerX + innerRadius * Math.cos(toRad(startAngle));
    const y4 = centerY + innerRadius * Math.sin(toRad(startAngle));

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  }

  // =========================================================================
  // 3. TABELA DE LANÇAMENTOS COM PAGINAÇÃO
  // =========================================================================
  const filteredDividends = useMemo(() => {
    return allDividends.filter((item) => {
      // Busca
      if (tableSearch.trim()) {
        const query = tableSearch.trim().toUpperCase();
        if (!item.ticker.includes(query) && !item.type.toUpperCase().includes(query)) {
          return false;
        }
      }

      // Status
      if (tableStatus === 'PAID' && !item.isPaid) return false;
      if (tableStatus === 'PROVISIONED' && item.isPaid) return false;

      // Tipo de Ativo
      if (tableAssetType !== 'ALL' && item.assetType !== tableAssetType) return false;

      return true;
    });
  }, [allDividends, tableSearch, tableStatus, tableAssetType]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredDividends.length / itemsPerPage));
  const paginatedDividends = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDividends.slice(start, start + itemsPerPage);
  }, [filteredDividends, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6 text-navy">
      {/* Barra de Status e Sincronização Online B3 / Mercado Aberto */}
      <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all duration-300 ${
        isSyncing
          ? 'bg-amber-50/90 border-amber-200/90 shadow-[0_4px_16px_-6px_rgba(245,184,46,.25)]'
          : 'bg-white/80 border-white/95 shadow-[inset_0_1px_0_#fff,0_4px_12px_-5px_rgba(10,31,68,.08)]'
      } text-xs`}>
        <div className="flex items-center gap-2.5">
          {isSyncing ? (
            <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
          ) : (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          )}
          <div className="flex items-center gap-2">
            <span className={`font-bold ${isSyncing ? 'text-amber-900' : 'text-navy'}`}>
              {isSyncing ? 'Sincronizando proventos oficiais da B3 em tempo real...' : 'Proventos atualizados online'}
            </span>
            <span className="text-[11px] text-muted hidden sm:inline">• {lastSyncTime}</span>
          </div>
        </div>

        <button
          type="button"
          disabled={isSyncing}
          onClick={() => syncDividends(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy text-white text-xs font-bold shadow-xs hover:bg-navy/90 disabled:opacity-50 transition cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Sincronizando...' : 'Atualizar Proventos Online'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO SUPERIOR: RESUMO (ESQ) + EVOLUÇÃO DE PROVENTOS (DIR)                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ----------------------------------------------------------------------- */}
        {/* CARD ESQUERDA: RESUMO (4 colunas)                                       */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-4 rounded-2xl bg-white/90 border border-white/95 p-5 shadow-[inset_0_1px_0_#fff,0_8px_20px_-10px_rgba(10,31,68,.12)] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-navy mb-4">Resumo</h3>

            {/* Média Mensal (últ. 12 meses) */}
            <div className="space-y-2 pb-4 border-b border-navy/10">
              <span className="text-xs font-bold text-muted block">Média Mensal (últ. 12 meses)</span>
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-navy text-sm">
                  {fmt(mediaMensal12m)} <span className="text-muted font-normal">/ {fmt(metaMensal)}</span>
                </span>
                <span className="font-bold text-navy text-xs">{progressoMetaPct}%</span>
              </div>
              {/* Barra de progresso */}
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-navy rounded-full transition-all duration-500"
                  style={{ width: `${progressoMetaPct}%` }}
                />
              </div>
            </div>

            {/* Total de 12 meses */}
            <div className="py-4 border-b border-navy/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1 text-xs font-bold text-muted">
                  <span>Total de 12 meses</span>
                  <Info className="h-3 w-3 text-muted/70" />
                </div>
                <b className="text-xl font-black text-navy mt-1 block">{fmt(total12Meses)}</b>
              </div>
              <ChevronDown className="h-4 w-4 text-muted cursor-pointer hover:text-navy transition" />
            </div>

            {/* Total da carteira */}
            <div className="py-4 border-b border-navy/10">
              <span className="text-xs font-bold text-muted block">Total da carteira</span>
              <b className="text-2xl font-black text-navy mt-1 block">{fmt(totalCarteira)}</b>
            </div>

            {/* Distribuição de proventos em 12 meses */}
            <div className="pt-4">
              <span className="text-xs font-bold text-muted block mb-3">Distribuição de proventos em 12 meses</span>

              <div className="flex items-center justify-between gap-4">
                {/* Donut SVG */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg width="112" height="112" viewBox="0 0 120 120" className="transform -rotate-90">
                    {donutSlices.map((slice) => (
                      <path
                        key={slice.ticker}
                        d={getDonutSlicePath(60, 60, 56, 32, slice.startAngle, slice.endAngle)}
                        fill={slice.color}
                        className="transition hover:opacity-85 cursor-pointer"
                      >
                        <title>{`${slice.ticker}: ${slice.percent.toFixed(2)}% (${fmt(slice.value)})`}</title>
                      </path>
                    ))}
                  </svg>
                  {/* Furo central do Donut */}
                  <div className="absolute h-14 w-14 rounded-full bg-white shadow-inner pointer-events-none flex items-center justify-center">
                    <span className="text-[10px] font-black text-navy">12M</span>
                  </div>
                </div>

                {/* Legenda dos top pagadores */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm bg-[#00d2d3]" />
                      <span className="font-bold text-navy">RURA11</span>
                    </div>
                    <span className="font-semibold text-muted">8,52%</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm bg-[#10b981]" />
                      <span className="font-bold text-navy">SNAG11</span>
                    </div>
                    <span className="font-semibold text-muted">8,03%</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm bg-[#eab308]" />
                      <span className="font-bold text-navy">SPYI</span>
                    </div>
                    <span className="font-semibold text-muted">6,50%</span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsVerTodosOpen(true)}
                      className="w-full py-1.5 px-3 rounded-xl border border-navy/15 text-xs font-bold text-navy hover:bg-navy/5 transition shadow-xs"
                    >
                      Ver todos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CARD DIREITA: EVOLUÇÃO DE PROVENTOS (8 colunas)                         */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-8 rounded-2xl bg-white/90 border border-white/95 p-5 shadow-[inset_0_1px_0_#fff,0_8px_20px_-10px_rgba(10,31,68,.12)] flex flex-col justify-between space-y-4">
          <div>
            {/* Header da Evolução com Alternador e Filtros */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-navy/10">
              <h3 className="text-sm font-black text-navy">Evolução de Proventos</h3>

              <div className="flex flex-wrap items-center gap-2">
                {/* Alternador Mensal / Anual */}
                <div className="flex items-center p-0.5 rounded-xl bg-navy/[0.06] border border-navy/10 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setEvolutionMode('MENSAL')}
                    className={`px-3 py-1 rounded-lg transition ${
                      evolutionMode === 'MENSAL' ? 'bg-navy text-white shadow-xs' : 'text-muted hover:text-navy'
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvolutionMode('ANUAL')}
                    className={`px-3 py-1 rounded-lg transition ${
                      evolutionMode === 'ANUAL' ? 'bg-navy text-white shadow-xs' : 'text-muted hover:text-navy'
                    }`}
                  >
                    Anual
                  </button>
                </div>

                {/* Seletor de Ano (apenas no modo mensal) */}
                {evolutionMode === 'MENSAL' && (
                  <div className="relative">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-1 rounded-xl bg-white border border-navy/15 text-xs font-bold text-navy shadow-xs focus:outline-none cursor-pointer"
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                    </select>
                    <ChevronDown className="h-3.5 w-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}

                {/* Filtro: Tipo de ativo */}
                <div className="relative">
                  <select
                    value={assetTypeFilter}
                    onChange={(e) => setAssetTypeFilter(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1 rounded-xl bg-white border border-navy/15 text-xs font-bold text-navy shadow-xs focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Tipo de ativo</option>
                    <option value="FII">FIIs</option>
                    <option value="STOCK">Ações</option>
                    <option value="BDR">BDRs</option>
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Filtro: Ativos */}
                <div className="relative">
                  <select
                    value={activeAssetFilter}
                    onChange={(e) => setActiveAssetFilter(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1 rounded-xl bg-white border border-navy/15 text-xs font-bold text-navy shadow-xs focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Ativos</option>
                    {availableTickers.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Legenda das Barras */}
            <div className="flex items-center justify-end gap-5 text-xs pt-2">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-[#3b82f6]" />
                <span className="font-semibold text-muted">Proventos recebidos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-[#cbd5e1]" />
                <span className="font-semibold text-muted">Proventos a receber</span>
                <Info className="h-3 w-3 text-muted/60" />
              </div>
            </div>

            {/* Gráfico de Barras Responsivo */}
            <div className="mt-4">
              {evolutionMode === 'MENSAL' ? (
                <div className="relative h-64 flex flex-col justify-between">
                  {/* Linhas de Grade e Eixo Y */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-muted">
                    <div className="border-b border-navy/5 flex items-center justify-between">
                      <span>R$ 210,00</span>
                    </div>
                    <div className="border-b border-navy/5 flex items-center justify-between">
                      <span>R$ 180,00</span>
                    </div>
                    <div className="border-b border-navy/5 flex items-center justify-between">
                      <span>R$ 150,00</span>
                    </div>
                    <div className="border-b border-navy/5 flex items-center justify-between">
                      <span>R$ 120,00</span>
                    </div>
                    <div className="border-b border-navy/5 flex items-center justify-between">
                      <span>R$ 90,00</span>
                    </div>
                    <div className="border-b border-navy/5 flex items-center justify-between">
                      <span>R$ 60,00</span>
                    </div>
                    <div className="border-b border-navy/5 flex items-center justify-between">
                      <span>R$ 30,00</span>
                    </div>
                    <div className="border-b border-navy/15 flex items-center justify-between">
                      <span>R$ 0,00</span>
                    </div>
                  </div>

                  {/* Barras dos 12 Meses */}
                  <div className="h-full flex items-end justify-between gap-1.5 pl-14 pr-2 z-10">
                    {evolutionChartMonthlyData.map((d) => {
                      const paidHeight = (d.paid / chartMaxY) * 100;
                      const provHeight = (d.prov / chartMaxY) * 100;
                      const total = d.paid + d.prov;

                      return (
                        <div
                          key={d.label}
                          className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                        >
                          {/* Tooltip ao passar o mouse */}
                          <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 bg-navy text-white text-[10px] font-bold py-1 px-2 rounded shadow pointer-events-none z-20 whitespace-nowrap">
                            {d.label}: {fmt(total)}
                            {d.prov > 0 && ` (A receber: ${fmt(d.prov)})`}
                          </div>

                          <div className="w-full max-w-[28px] flex flex-col justify-end">
                            {/* Barra A Receber (topo) */}
                            {d.prov > 0 && (
                              <div
                                style={{ height: `${provHeight}%` }}
                                className="w-full rounded-t bg-[#cbd5e1] transition group-hover:brightness-95 shadow-xs"
                              />
                            )}
                            {/* Barra Recebido (base) */}
                            {d.paid > 0 && (
                              <div
                                style={{ height: `${paidHeight}%` }}
                                className={`w-full ${d.prov > 0 ? '' : 'rounded-t'} bg-[#3b82f6] transition group-hover:brightness-95 shadow-xs`}
                              />
                            )}
                            {total === 0 && <div className="w-full h-1 bg-slate-200 rounded" />}
                          </div>

                          <span className="text-[10px] text-muted font-bold mt-2">{d.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Modo Anual */
                <div className="h-64 flex items-end justify-center gap-12 pt-6 pb-2 border-b border-navy/10 px-4">
                  {evolutionChartAnnualData.map((d) => {
                    const maxAnnual = 2000;
                    const paidPct = (d.paid / maxAnnual) * 100;
                    const provPct = (d.prov / maxAnnual) * 100;

                    return (
                      <div
                        key={d.year}
                        className="flex flex-col items-center h-full justify-end group cursor-pointer w-24"
                      >
                        <span className="text-xs font-bold text-navy mb-1.5 opacity-90 group-hover:opacity-100">
                          {fmt(d.total)}
                        </span>
                        <div className="w-full max-w-[48px] flex flex-col justify-end">
                          {d.prov > 0 && (
                            <div
                              style={{ height: `${provPct}%` }}
                              className="w-full rounded-t bg-[#cbd5e1] transition shadow-xs"
                            />
                          )}
                          {d.paid > 0 && (
                            <div
                              style={{ height: `${paidPct}%` }}
                              className={`w-full ${d.prov > 0 ? '' : 'rounded-t'} bg-[#3b82f6] transition shadow-xs`}
                            />
                          )}
                        </div>
                        <span className="text-xs text-navy font-bold mt-2">{d.year}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dica explicativa abaixo do gráfico */}
          <div className="text-center pt-2">
            <span className="inline-block px-3 py-1 rounded-full bg-navy/[0.04] text-[11px] text-muted border border-navy/10 font-medium">
              Você pode clicar nas barras para visualizar os detalhes de cada mês.
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO MÉDIA: HISTÓRICO MENSAL (MATRIZ POR ANO)                           */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-white/90 border border-white/95 p-5 shadow-[inset_0_1px_0_#fff,0_8px_20px_-10px_rgba(10,31,68,.10)] space-y-4">
        {/* Cabeçalho do Histórico com Badge e Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-navy/10">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-navy">Histórico mensal</h3>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              Total {fmt(historyStatusFilter === 'RECEBIDOS_E_FUTUROS' ? totalRecebidosEFuturos : historyStatusFilter === 'PROVISIONADOS' ? 162.41 : totalCarteira)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status (Recebidos e Futuros / Recebidos / A Receber) */}
            <div className="relative">
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value as any)}
                className="appearance-none pl-3 pr-8 py-1 rounded-xl bg-white border border-navy/15 text-xs font-bold text-navy shadow-xs focus:outline-none cursor-pointer"
              >
                <option value="RECEBIDOS_E_FUTUROS">Recebidos e Futuros</option>
                <option value="RECEBIDOS">Recebidos</option>
                <option value="PROVISIONADOS">A Receber</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Tipo de ativo */}
            <div className="relative">
              <select
                value={historyAssetTypeFilter}
                onChange={(e) => setHistoryAssetTypeFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1 rounded-xl bg-white border border-navy/15 text-xs font-bold text-navy shadow-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tipo de ativo</option>
                <option value="FII">FIIs</option>
                <option value="STOCK">Ações</option>
                <option value="BDR">BDRs</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Ativos */}
            <div className="relative">
              <select
                value={historyAssetFilter}
                onChange={(e) => setHistoryAssetFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1 rounded-xl bg-white border border-navy/15 text-xs font-bold text-navy shadow-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">Ativos</option>
                {availableTickers.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tabela Matriz */}
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs text-navy whitespace-nowrap">
            <thead className="bg-slate-50/70 text-[11px] text-muted font-bold border-b border-navy/10">
              <tr>
                <th className="py-2.5 px-3 text-left">Ano ⇅</th>
                {monthsNames.map((m) => (
                  <th key={m} className="py-2.5 px-2">
                    {m}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right">Média ⇅</th>
                <th className="py-2.5 px-3 text-right font-black">Total ⇅</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5 font-semibold">
              {HISTORICAL_MATRIX_DATA.map((row) => (
                <tr key={row.year} className="hover:bg-navy/[0.03] transition">
                  <td className="py-3 px-3 text-left font-black text-navy">{row.year}</td>
                  {row.months.map((val, idx) => (
                    <td key={idx} className="py-3 px-2 text-navy">
                      {hideValues ? '•••' : val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  ))}
                  <td className="py-3 px-3 text-right text-muted flex items-center justify-end gap-1">
                    <Info className="h-3 w-3 text-muted/60" />
                    <span>{hideValues ? '•••' : row.average.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-navy">
                    {hideValues ? '••••••' : row.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO INFERIOR: LANÇAMENTOS DETALHADOS DE PROVENTOS (COM PAGINAÇÃO)       */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-white/90 border border-white/95 overflow-hidden shadow-[inset_0_1px_0_#fff,0_8px_20px_-10px_rgba(10,31,68,.10)]">
        {/* Cabeçalho da Tabela com Filtros e Busca */}
        <div className="p-4 border-b border-navy/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-navy">Lançamentos de Proventos</h3>
            <span className="text-xs text-ok font-black bg-ok/10 px-2.5 py-0.5 rounded-full border border-ok/20">
              {filteredDividends.length} proventos
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Campo de Busca por Ticker */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar ativo..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1 rounded-xl bg-white border border-navy/15 text-xs text-navy font-bold w-36 focus:outline-none uppercase"
              />
            </div>

            {/* Filtro: Tipo de Ativo */}
            <select
              value={tableAssetType}
              onChange={(e) => {
                setTableAssetType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1 rounded-xl bg-white border border-navy/15 text-xs text-navy font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todas Classes</option>
              <option value="FII">FIIs</option>
              <option value="STOCK">Ações</option>
              <option value="BDR">BDRs</option>
            </select>

            {/* Alternador de Status: Todos | Pagos | A Receber */}
            <div className="flex items-center gap-1 bg-navy/[0.04] p-0.5 rounded-xl border border-navy/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setTableStatus('ALL');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg transition ${
                  tableStatus === 'ALL' ? 'bg-navy text-white shadow-xs' : 'text-muted hover:text-navy'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => {
                  setTableStatus('PAID');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg transition ${
                  tableStatus === 'PAID' ? 'bg-ok text-white shadow-xs' : 'text-muted hover:text-navy'
                }`}
              >
                Pagos
              </button>
              <button
                type="button"
                onClick={() => {
                  setTableStatus('PROVISIONED');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg transition ${
                  tableStatus === 'PROVISIONED' ? 'bg-amber-600 text-white shadow-xs' : 'text-muted hover:text-navy'
                }`}
              >
                A Receber
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Lançamentos */}
        {paginatedDividends.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-navy whitespace-nowrap">
              <thead className="bg-slate-100/60 uppercase text-[10px] text-muted font-bold border-b border-navy/10">
                <tr>
                  <th className="py-3 px-4">Ativo</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Data COM</th>
                  <th className="py-3 px-3">Pagamento</th>
                  <th className="py-3 px-3 text-right">Valor por cota</th>
                  <th className="py-3 px-3 text-right">Posição na Data COM</th>
                  <th className="py-3 px-3 text-right font-bold text-navy">Valor Bruto</th>
                  <th className="py-3 px-4 text-right font-black text-navy">Total Líquido</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {paginatedDividends.map((item) => {
                  const [comY, comM, comD] = item.dateCom.split('-');
                  const formattedCom = comD ? `${comD}/${comM}/${comY}` : item.dateCom;

                  const [payY, payM, payD] = item.paymentDate.split('-');
                  const formattedPay = payD ? `${payD}/${payM}/${payY}` : item.paymentDate;
                  const isJcp = item.type.toUpperCase().includes('JCP') || item.type.toUpperCase().includes('JSCP');

                  return (
                    <tr key={item.id} className="hover:bg-navy/[0.03] transition">
                      {/* Ativo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-navy">{item.ticker}</span>
                          <span className="text-[10px] font-bold text-muted bg-navy/[0.04] px-1.5 py-0.5 rounded">
                            {item.assetType}
                          </span>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isJcp
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : item.type.toLowerCase().includes('rend')
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>

                      {/* Data COM */}
                      <td className="py-3 px-3 font-semibold text-navy">{formattedCom}</td>

                      {/* Pagamento */}
                      <td className="py-3 px-3 font-bold text-navy">{formattedPay}</td>

                      {/* Valor por Cota */}
                      <td className="py-3 px-3 text-right font-semibold text-navy">
                        R$ {item.rate.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 6 })}
                      </td>

                      {/* Posição na Data COM */}
                      <td className="py-3 px-3 text-right font-bold text-navy">
                        {item.quantityOnDateCom.toLocaleString('pt-BR')} cotas
                      </td>

                      {/* Valor Bruto */}
                      <td className="py-3 px-3 text-right font-bold text-navy">
                        {fmt(item.totalGross || item.totalAmount)}
                      </td>

                      {/* Total Líquido */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-black text-ok text-sm block">{fmt(item.totalAmount)}</span>
                        {isJcp && (
                          <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1 py-0.2 rounded border border-amber-200 inline-block mt-0.5">
                            -15% IRRF
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {item.isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-ok/10 text-ok border border-ok/20">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Pago</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="h-3 w-3" />
                            <span>A Receber</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted text-xs">
            Nenhum evento de provento encontrado para os filtros selecionados.
          </div>
        )}

        {/* Barra de Paginação */}
        <div className="p-4 border-t border-navy/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40 text-xs">
          <div className="flex items-center gap-3 text-muted">
            <span>
              Exibindo {(currentPage - 1) * itemsPerPage + 1} a{' '}
              {Math.min(currentPage * itemsPerPage, filteredDividends.length)} de {filteredDividends.length} proventos
            </span>

            {/* Seletor de itens por página */}
            <div className="flex items-center gap-1 text-[11px]">
              <span>Por página:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 rounded bg-white border border-navy/15 text-navy font-bold focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Botões de Página */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-1.5 rounded-lg border border-navy/15 text-navy hover:bg-navy/5 disabled:opacity-40 disabled:pointer-events-none transition"
              title="Página Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`h-7 w-7 rounded-lg text-xs font-bold transition ${
                    currentPage === pageNum
                      ? 'bg-navy text-white shadow-xs'
                      : 'border border-navy/15 text-navy hover:bg-navy/5'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && (
              <>
                <span className="px-1 text-muted">...</span>
                <button
                  type="button"
                  onClick={() => handlePageChange(totalPages)}
                  className={`h-7 w-7 rounded-lg text-xs font-bold transition ${
                    currentPage === totalPages
                      ? 'bg-navy text-white shadow-xs'
                      : 'border border-navy/15 text-navy hover:bg-navy/5'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="p-1.5 rounded-lg border border-navy/15 text-navy hover:bg-navy/5 disabled:opacity-40 disabled:pointer-events-none transition"
              title="Próxima Página"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: VER TODOS (DISTRIBUIÇÃO DE PROVENTOS EM 12 MESES)                  */}
      {/* ========================================================================= */}
      {isVerTodosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-white/95 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-navy/10">
              <div>
                <h3 className="text-base font-black text-navy">Distribuição de proventos em 12 meses</h3>
                <p className="text-xs text-muted">Detalhamento de todos os ativos pagadores no período</p>
              </div>
              <button
                type="button"
                onClick={() => setIsVerTodosOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-navy/5 flex items-center justify-center text-muted hover:text-navy transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
              {DEFAULT_DISTRIBUTION_12M.map((item, idx) => (
                <div
                  key={item.ticker}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-navy/5 hover:border-navy/15 transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-sm shrink-0"
                      style={{ backgroundColor: item.color || DONUT_COLORS[idx % DONUT_COLORS.length] }}
                    />
                    <span className="font-extrabold text-navy text-xs">{item.ticker}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-bold text-navy">{fmt(item.value)}</span>
                    <span className="font-semibold text-muted w-14 text-right">{item.percent.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-navy/10 flex items-center justify-between text-xs font-bold text-navy">
              <span>Total acumulado em 12 meses:</span>
              <span className="text-sm font-black text-ok">{fmt(total12Meses)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
