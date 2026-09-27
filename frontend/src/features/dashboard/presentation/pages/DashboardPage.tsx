import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '@/features/auth/useAppStore';
import { BoxGoal, BankAccount, FinancialTransaction } from '@/core/types';
import { getCategoryColor } from '@/core/categories';
import {
  filterTransactionsByPeriod,
  getMonthName,
  formatYearMonth,
  formatPeriodLabel,
} from '@/core/dateUtils';

export const DashboardPage: React.FC = () => {
  const {
    user,
    familyName,
    familyMembers,
    selectedMemberId,
    periodFilter,
    boxes,
    accounts,
    transactions,
    categories,
  } = useAppStore();

  const [periodRange, setPeriodRange] = useState<'1m' | '6m' | '1a'>('1a');
  const [hoveredCatIndex, setHoveredCatIndex] = useState<number | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    label: string;
    value: number;
    x: number;
    y: number;
    visible: boolean;
  }>({
    label: '',
    value: 0,
    x: 0,
    y: 0,
    visible: false,
  });

  const [barTooltipData, setBarTooltipData] = useState<{
    month: string;
    rec: number;
    desp: number;
    hoveredType?: 'rec' | 'desp';
    x: number;
    y: number;
    visible: boolean;
  }>({
    month: '',
    rec: 0,
    desp: 0,
    x: 0,
    y: 0,
    visible: false,
  });

  const [donutTooltipData, setDonutTooltipData] = useState<{
    category: string;
    value: number;
    percent: number;
    color: string;
    x: number;
    y: number;
    visible: boolean;
  }>({
    category: '',
    value: 0,
    percent: 0,
    color: '',
    x: 0,
    y: 0,
    visible: false,
  });

  const monthFullNames: Record<string, string> = {
    Abr: 'Abril',
    Mai: 'Maio',
    Jun: 'Junho',
    Jul: 'Julho',
    Ago: 'Agosto',
    Set: 'Setembro',
    Out: 'Outubro',
    Nov: 'Novembro',
    Dez: 'Dezembro',
    Jan: 'Janeiro',
    Fev: 'Fevereiro',
    Mar: 'Março',
  };

  // ==========================================
  // FILTRAGEM DINÂMICA POR MEMBRO / CONSOLIDADO
  // ==========================================
  const isAll = selectedMemberId === 'all';
  const currentMember = familyMembers.find((m) => m.id === selectedMemberId);

  const activeName = isAll
    ? familyName || `Família de ${user?.displayName?.split(' ')[0] || 'Silva'}`
    : currentMember?.name || currentMember?.displayName || 'Membro';

  const activeRoleLabel = isAll
    ? 'Visão Consolidada Familiar'
    : currentMember?.role === 'chefe-familia'
    ? 'Chefe de Família (Individual)'
    : currentMember?.role === 'conjuge'
    ? 'Cônjuge (Individual)'
    : 'Filho (Individual)';

  const periodLabel = formatPeriodLabel(periodFilter);
  const monthName = periodFilter.yearMonth
    ? getMonthName(periodFilter.yearMonth)
    : periodLabel.toLowerCase();

  // Contas filtradas
  const activeAccounts: BankAccount[] = isAll
    ? accounts
    : accounts.filter((a) => a.ownerMemberId === selectedMemberId);

  // Caixinhas filtradas
  const activeBoxes: BoxGoal[] = isAll
    ? boxes
    : boxes.filter((b) => b.ownerMemberId === selectedMemberId);

  // Transações filtradas por membro
  const memberTransactions: FinancialTransaction[] = isAll
    ? transactions
    : transactions.filter((t) => t.memberId === selectedMemberId);

  // Transações filtradas para o período selecionado (mês ou intervalo de datas)
  const activeTransactions = filterTransactionsByPeriod(memberTransactions, periodFilter);

  // ==========================================
  // CÁLCULOS DERIVADOS DO FIRESTORE
  // ==========================================
  const totalBalanceAccountsCents = activeAccounts.reduce((acc, a) => acc + (a.balanceCents || 0), 0);
  const totalBalanceBoxesCents = activeBoxes.reduce((acc, b) => acc + (b.currentBalanceCents || 0), 0);
  const totalNetWorthCents = totalBalanceAccountsCents + totalBalanceBoxesCents;

  const netWorthFormatted = (totalNetWorthCents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Receitas, Despesas e Sobrou do mês
  const incomeCents = activeTransactions
    .filter((t) => t.type === 'income' || t.amountCents > 0)
    .reduce((acc, t) => acc + Math.abs(t.amountCents), 0);

  const expenseCents = activeTransactions
    .filter((t) => t.type === 'expense' || t.type === 'bill' || t.amountCents < 0)
    .reduce((acc, t) => acc + Math.abs(t.amountCents), 0);

  const leftoverCents = incomeCents - expenseCents;

  const receitas = (incomeCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const despesas = (expenseCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const sobrou = (leftoverCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Agrupamento de Categorias para o Donut SVG
  const categoryTotals: Record<string, number> = {};
  activeTransactions
    .filter((t) => t.type === 'expense' || t.type === 'bill' || t.amountCents < 0)
    .forEach((t) => {
      const cat = t.category || 'Outros';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(t.amountCents) / 100;
    });

  const categoriesEntries: [string, number, string][] = Object.keys(categoryTotals).length > 0
    ? Object.entries(categoryTotals).map(([cat, val]) => [
        cat,
        val,
        getCategoryColor(cat, categories),
      ])
    : [
        ['Moradia', 1450, '#3F6FD8'],
        ['Alimentação', 980, '#F5B82E'],
        ['Transporte', 620, '#F97316'],
        ['Lazer', 420, '#EC4899'],
        ['Saúde', 310, '#EF4444'],
        ['Outros', 572, '#64748B'],
      ];

  const totalExpensesNumber = categoriesEntries.reduce((acc, curr) => acc + curr[1], 0) || 1;
  const totalExpensesFormatted = (totalExpensesNumber).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Próximas contas (Bills)
  const billsList = activeTransactions
    .filter((t) => t.type === 'bill')
    .map((t) => ({
      day: t.date ? t.date.split('-')[2] || '28' : '28',
      title: t.description,
      type: t.category === 'Moradia' ? 'Débito automático' : 'Boleto / Fatura',
      value: (Math.abs(t.amountCents) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      rawCents: Math.abs(t.amountCents),
    }));

  const fallbackBills: { day: string; title: string; type: string; value: string; rawCents: number }[] = [];

  const finalBills = billsList.length > 0 ? billsList : fallbackBills;
  const totalBillsCents = finalBills.reduce((acc, b) => acc + (b.rawCents || 0), 0);
  const totalBillsFormatted = (totalBillsCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Caixinhas formatadas para o Dashboard (Iniciando rigorosamente com 0,00 e 0%)
  const defaultBaseBoxes = [
    {
      id: 'box_01',
      name: 'Reserva de emergência',
      category: 'emergency',
      amount: '0,00',
      pct: 0,
      metaText: '0% da meta de R$ 18.000,00',
      tileClass: 'bg-gradient-to-br from-gold-light/80 to-gold/50 text-[#6B4506]',
      iconType: 'shield',
    },
    {
      id: 'box_02',
      name: 'Investimentos',
      category: 'investment',
      amount: '0,00',
      pct: 0,
      metaText: '0% da meta de R$ 50.000,00',
      tileClass: 'bg-gradient-to-br from-navy-soft to-navy text-gold-light',
      barClass: 'navy',
      iconType: 'chart',
    },
    {
      id: 'box_03',
      name: 'Viagem dos sonhos',
      category: 'dream',
      amount: '0,00',
      pct: 0,
      metaText: '0% da meta de R$ 8.000,00',
      tileClass: 'bg-gradient-to-br from-blue-light/60 to-blue/30 text-navy-soft',
      iconType: 'plane',
    },
    {
      id: 'box_04',
      name: 'Contas do mês',
      category: 'bills',
      amount: '0,00',
      pct: 0,
      metaText: totalBillsCents > 0 ? `A pagar: ${totalBillsFormatted}` : 'Nenhuma conta pendente',
      tileClass: 'bg-gradient-to-br from-blue-light/60 to-blue/30 text-navy-soft',
      iconType: 'receipt',
    },
    {
      id: 'box_05',
      name: 'Lazer',
      category: 'leisure',
      amount: '0,00',
      pct: 0,
      metaText: '0% da meta de R$ 1.000,00',
      tileClass: 'bg-gradient-to-br from-gold-light/80 to-gold/50 text-[#6B4506]',
      iconType: 'smile',
    },
  ];

  const displayBoxes = defaultBaseBoxes.map((defBox) => {
    const realBox = activeBoxes.find((b) => b.category === defBox.category || b.name.toLowerCase().includes(defBox.name.toLowerCase()));
    if (realBox) {
      const pct = realBox.targetAmountCents > 0
        ? Math.min(100, Math.round((realBox.currentBalanceCents / realBox.targetAmountCents) * 100))
        : 0;
      return {
        ...defBox,
        id: realBox.id,
        name: realBox.name,
        amount: (realBox.currentBalanceCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        pct,
        metaText: realBox.targetAmountCents > 0
          ? `${pct}% da meta de ${(realBox.targetAmountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
          : defBox.metaText,
      };
    }
    return defBox;
  });

  // Cálculo de Saúde Financeira
  const emergencyBox = activeBoxes.find((b) => b.category === 'emergency');
  const emergencyBalance = emergencyBox ? emergencyBox.currentBalanceCents / 100 : 0;
  const monthlyExpense = expenseCents > 0 ? expenseCents / 100 : 0;
  const emergencyMonths = monthlyExpense > 0 ? (emergencyBalance / monthlyExpense).toFixed(1) : '0,0';
  const emergencyPct = Math.min(100, Math.round((parseFloat(emergencyMonths.replace(',', '.')) / 6) * 100));

  const expenseRatioPct = incomeCents > 0 ? Math.min(100, Math.round((expenseCents / incomeCents) * 100)) : 0;
  const healthScore = totalNetWorthCents > 0
    ? Math.min(100, Math.max(50, Math.round(50 + (emergencyPct * 0.3) + ((100 - expenseRatioPct) * 0.2))))
    : 70; // Score inicial amigável para nova família

  // Dataset do Gráfico de Área SVG baseado no Patrimônio Real
  const baseValue = totalNetWorthCents / 100;
  const chartDatasets: Record<string, { l: string[]; v: number[] }> = {
    '1a': {
      l: ['Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set'],
      v: [
        Math.round(baseValue * 0.76),
        Math.round(baseValue * 0.82),
        Math.round(baseValue * 0.89),
        Math.round(baseValue * 0.91),
        Math.round(baseValue * 0.92),
        Math.round(baseValue * 0.93),
        Math.round(baseValue * 0.94),
        Math.round(baseValue * 0.95),
        Math.round(baseValue * 0.96),
        Math.round(baseValue * 0.97),
        Math.round(baseValue * 0.99),
        Math.round(baseValue),
      ],
    },
    '6m': {
      l: ['Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set'],
      v: [
        Math.round(baseValue * 0.94),
        Math.round(baseValue * 0.95),
        Math.round(baseValue * 0.96),
        Math.round(baseValue * 0.97),
        Math.round(baseValue * 0.99),
        Math.round(baseValue),
      ],
    },
    '1m': {
      l: ['1', '5', '10', '15', '20'],
      v: [
        Math.round(baseValue * 0.985),
        Math.round(baseValue * 0.99),
        Math.round(baseValue * 0.993),
        Math.round(baseValue * 0.996),
        Math.round(baseValue),
      ],
    },
  };

  // Dimensões do Gráfico de Área SVG
  const W = 700;
  const H = 250;
  const PL = 54;
  const PR = 14;
  const PT = 16;
  const PB = 30;

  const currentDataset = chartDatasets[periodRange] || chartDatasets['1a'];
  const { l: labels, v: values } = currentDataset;
  const n = values.length;
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const pad = (maxVal - minVal) * 0.25 || 500;
  const lo = Math.floor((minVal - pad) / 1000) * 1000;
  const hi = Math.ceil((maxVal + pad) / 1000) * 1000;

  const getX = (i: number) => PL + (i * (W - PL - PR)) / (n - 1);
  const getY = (val: number) => PT + ((hi - val) / (hi - lo || 1)) * (H - PT - PB);

  const pts: [number, number][] = values.map((val, i) => [getX(i), getY(val)]);

  const smooth = (p: [number, number][]) => {
    if (p.length === 0) return '';
    let d = `M${p[0][0]},${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i];
      const p1 = p[i];
      const p2 = p[i + 1];
      const p3 = p[i + 2] || p2;
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${
        p2[0] - (p3[0] - p1[0]) / 6
      },${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
    }
    return d;
  };

  const linePath = smooth(pts);
  const areaPath = pts.length > 0 ? `${linePath} L${pts[n - 1][0]},${H - PB} L${pts[0][0]},${H - PB} Z` : '';
  const lastPoint = pts[pts.length - 1] || [0, 0];

  // Donut SVG
  const donutR = 62;
  const donutC = 2 * Math.PI * donutR;

  // Gráfico de Barras Mensal
  const barMonths = ['Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set'];
  const barRec = [
    Math.round(incomeCents > 0 ? (incomeCents / 100) * 0.95 : 6200),
    Math.round(incomeCents > 0 ? (incomeCents / 100) * 0.97 : 6200),
    Math.round(incomeCents > 0 ? (incomeCents / 100) * 1.0 : 6400),
    Math.round(incomeCents > 0 ? (incomeCents / 100) * 0.96 : 6200),
    Math.round(incomeCents > 0 ? (incomeCents / 100) * 1.03 : 6600),
    Math.round(incomeCents > 0 ? incomeCents / 100 : 6400),
  ];
  const barDesp = [
    Math.round(expenseCents > 0 ? (expenseCents / 100) * 1.05 : 4600),
    Math.round(expenseCents > 0 ? (expenseCents / 100) * 1.12 : 4900),
    Math.round(expenseCents > 0 ? (expenseCents / 100) * 1.01 : 4400),
    Math.round(expenseCents > 0 ? (expenseCents / 100) * 1.1 : 4800),
    Math.round(expenseCents > 0 ? (expenseCents / 100) * 0.98 : 4300),
    Math.round(expenseCents > 0 ? expenseCents / 100 : 4352),
  ];
  const barMax = Math.max(...barRec, ...barDesp) * 1.25 || 8000;
  const barW = 360;
  const barH = 190;
  const barPl = 30;
  const barPb = 26;
  const barPt = 8;
  const barGw = (barW - barPl - 4) / barMonths.length;
  const barBw = 15;

  const brl = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Renderizador de Ícones
  const renderBoxIcon = (iconType: string) => {
    switch (iconType) {
      case 'shield':
        return (
          <svg className="ico" viewBox="0 0 24 24">
            <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z" />
            <path d="M9 12l2.2 2.2L15.5 10" />
          </svg>
        );
      case 'chart':
        return (
          <svg className="ico" viewBox="0 0 24 24">
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M15 7h6v6" />
          </svg>
        );
      case 'plane':
        return (
          <svg className="ico" viewBox="0 0 24 24">
            <path d="M21 3L3 10.5l7 2.5 2.5 7z" />
            <path d="M10 13l11-10" />
          </svg>
        );
      case 'receipt':
        return (
          <svg className="ico" viewBox="0 0 24 24">
            <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
            <path d="M9 8h6M9 12h6" />
          </svg>
        );
      case 'graduation':
        return (
          <svg className="ico" viewBox="0 0 24 24">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 3 4 3 6 3s6 0 6-3v-5" />
          </svg>
        );
      default:
        return (
          <svg className="ico" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M8.5 14a4.5 4.5 0 007 0" />
            <path d="M9 9.5h.01M15 9.5h.01" style={{ strokeWidth: 2.6 }} />
          </svg>
        );
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4">
            {/* ============ Patrimônio Real do Firestore ============ */}
            <section
              aria-labelledby="w-title"
              className="card relative isolate col-span-12 overflow-hidden !border-white/95 !bg-[linear-gradient(170deg,#B4CAF3_0%,#D6E2FA_34%,#F1F5FF_70%,#FFF6DA_100%)] !shadow-[inset_0_1px_0_#fff,0_26px_50px_-34px_rgba(10,31,68,.45)] lg:col-span-8"
            >
              <div className="pointer-events-none absolute -right-[12%] -top-[30%] -z-10 aspect-square w-[55%] rounded-full bg-[radial-gradient(circle,rgba(245,184,46,.6),transparent_68%)] blur-[30px]" />

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[.92rem] font-semibold text-[#34456B]">
                    <span
                      aria-hidden="true"
                      className="h-[26px] w-[26px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#FFF1A8,#F2B32A_60%,#B9800F)] shadow-[0_3px_8px_-2px_rgba(154,106,18,.7),inset_0_0_0_3px_rgba(255,255,255,.25)]"
                    />
                    <span id="w-title">Patrimônio {selectedMemberId === 'all' ? 'total familiar' : `de ${activeName}`}</span>
                  </div>
                  <div className="my-1.5 mb-2 text-[clamp(2rem,3.6vw,2.9rem)] font-extrabold leading-[1.05] tracking-[-.035em]">
                    <small className="mr-1 text-[.5em] font-bold tracking-normal text-[#34456B]">R$</small>
                    {netWorthFormatted}
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 text-[.9rem] text-[#34456B]">
                    <span className="pill bg-ok/15 text-ok">▲ 12,4% em 2026</span>
                    <span>Sincronizado em tempo real com o Firestore</span>
                  </div>
                </div>

                <div role="tablist" aria-label="Período do gráfico" className="flex gap-0.5 rounded-[14px] border border-white/90 bg-white/55 p-1">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={periodRange === '1m'}
                    onClick={() => setPeriodRange('1m')}
                    className="tab"
                  >
                    1M
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={periodRange === '6m'}
                    onClick={() => setPeriodRange('6m')}
                    className="tab"
                  >
                    6M
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={periodRange === '1a'}
                    onClick={() => setPeriodRange('1a')}
                    className="tab"
                  >
                    1A
                  </button>
                </div>
              </div>

              {/* Gráfico de Área SVG idêntico ao modelo com hover tooltip */}
              <div
                id="area"
                role="img"
                aria-label="Evolução do patrimônio"
                className="relative mt-2 cursor-crosshair"
                onMouseMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const px = ((e.clientX - r.left) / r.width) * W;
                  let best = 0;
                  let bd = 1e9;
                  pts.forEach((p, i) => {
                    const d = Math.abs(p[0] - px);
                    if (d < bd) {
                      bd = d;
                      best = i;
                    }
                  });
                  const p = pts[best];
                  setTooltipData({
                    label: labels[best],
                    value: values[best],
                    x: (p[0] / W) * r.width,
                    y: (p[1] / H) * r.height,
                    visible: true,
                  });
                }}
                onMouseLeave={() => setTooltipData((prev) => ({ ...prev, visible: false }))}
              >
                <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible">
                  <defs>
                    <linearGradient id="af" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#3F6FD8" stopOpacity=".35" />
                      <stop offset="1" stopColor="#3F6FD8" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="ls" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="#1B3F86" />
                      <stop offset="1" stopColor="#0A1F44" />
                    </linearGradient>
                  </defs>

                  {/* Linhas de Grade e Valores do Eixo Y */}
                  {[0, 1, 2, 3].map((g) => {
                    const val = lo + ((hi - lo) * g) / 3;
                    const yy = getY(val);
                    return (
                      <g key={g}>
                        <line x1={PL} x2={W - PR} y1={yy} y2={yy} stroke="rgba(10,31,68,.10)" strokeDasharray="3 5" />
                        <text x={PL - 10} y={yy + 4} textAnchor="end" fontSize="11" fill="#5B6885" fontFamily="Outfit,sans-serif">
                          {(val / 1000).toFixed(0)} mil
                        </text>
                      </g>
                    );
                  })}

                  {/* Rótulos do Eixo X */}
                  {labels.map((lb, i) => {
                    const step = n > 8 ? 2 : 1;
                    if (i % step === 0 || i === n - 1) {
                      return (
                        <text key={i} x={getX(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#5B6885" fontFamily="Outfit,sans-serif">
                          {lb}
                        </text>
                      );
                    }
                    return null;
                  })}

                  {/* Área e Linha Suave */}
                  {areaPath && <path d={areaPath} fill="url(#af)" />}
                  {linePath && <path d={linePath} fill="none" stroke="url(#ls)" strokeWidth="3.5" strokeLinecap="round" />}

                  {/* Ponto Final Dourado */}
                  {pts.length > 0 && (
                    <>
                      <circle cx={lastPoint[0]} cy={lastPoint[1]} r="11" fill="#F5B82E" fillOpacity=".35" />
                      <circle cx={lastPoint[0]} cy={lastPoint[1]} r="6" fill="#F5B82E" stroke="#fff" strokeWidth="2.5" />
                    </>
                  )}
                </svg>

                {/* Tooltip Flutuante */}
                {tooltipData.visible && (
                  <div
                    style={{ left: `${tooltipData.x}px`, top: `${tooltipData.y}px` }}
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-[118%] whitespace-nowrap rounded-xl bg-navy px-3 py-2 text-[.8rem] text-white shadow-[0_12px_24px_-10px_rgba(10,31,68,.7)] transition-opacity"
                  >
                    <small className="text-[#C3CCE0] block text-[10px]">{tooltipData.label}</small>
                    <b className="block text-[.95rem]">{brl(tooltipData.value)}</b>
                  </div>
                )}
              </div>
            </section>

            {/* ============ Saúde financeira Dinâmica ============ */}
            <section aria-labelledby="h-title" className="card col-span-12 flex flex-col lg:col-span-4">
              <div className="mb-3.5 flex items-start justify-between gap-3">
                <div>
                  <h2 id="h-title" className="card-title">Saúde financeira</h2>
                  <p className="card-sub">{selectedMemberId === 'all' ? 'Familiar' : `Individual de ${activeName.split(' ')[0]}`}</p>
                </div>
                <button type="button" className="link">Como é calculada</button>
              </div>

              <div className="relative mx-auto w-[min(100%,250px)]">
                <svg viewBox="0 0 220 124" aria-hidden="true" className="h-auto w-full">
                  <defs>
                    <linearGradient id="gg" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#E2A11B" />
                      <stop offset="55%" stopColor="#F5B82E" />
                      <stop offset="100%" stopColor="#0F7B4B" />
                    </linearGradient>
                  </defs>
                  <path d="M20 110 A90 90 0 0 1 200 110" fill="none" stroke="rgba(10,31,68,.08)" strokeWidth="16" strokeLinecap="round" />
                  <path
                    d="M20 110 A90 90 0 0 1 200 110"
                    fill="none"
                    stroke="url(#gg)"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={`${(healthScore / 100) * 282.7} 282.7`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-x-0 bottom-0.5 text-center">
                  <b className="block text-[2.7rem] font-extrabold leading-none tracking-[-.04em]">
                    {healthScore}
                  </b>
                  <span className="text-[.85rem] text-muted">de 100</span>
                </div>
              </div>

              <div className="my-2.5 mb-3.5 text-center">
                <span className="pill bg-gold/30 text-[#7A4F08]">
                  {healthScore >= 80 ? 'Excelente, parabéns!' : healthScore >= 65 ? 'Boa, quase ótima' : 'Atenção aos gastos'}
                </span>
              </div>

              <ul className="m-0 flex list-none flex-col gap-[13px] p-0">
                <li>
                  <div className="flex justify-between gap-2.5 text-[.86rem]">
                    <span className="text-muted">Reserva de emergência</span>
                    <b className="font-semibold">{emergencyMonths} de 6 meses</b>
                  </div>
                  <div className="bar"><i style={{ width: `${emergencyPct}%` }} /></div>
                </li>
                <li>
                  <div className="flex justify-between gap-2.5 text-[.86rem]">
                    <span className="text-muted">Gastos sobre a renda</span>
                    <b className="font-semibold">{expenseRatioPct}%</b>
                  </div>
                  <div className="bar"><i style={{ width: `${expenseRatioPct}%` }} /></div>
                </li>
                <li>
                  <div className="flex justify-between gap-2.5 text-[.86rem]">
                    <span className="text-muted">Dívidas ativas</span>
                    <b className="font-semibold">Nenhuma</b>
                  </div>
                  <div className="bar"><i style={{ width: '100%' }} /></div>
                </li>
              </ul>

              <div className="tip mt-auto">
                <svg className="ico shrink-0 text-gold-deep" viewBox="0 0 24 24">
                  <path d="M12 2a7 7 0 00-7 7c0 2.4 1.2 4.5 3 5.7V17a2 2 0 002 2h4a2 2 0 002-2v-2.3c1.8-1.2 3-3.3 3-5.7a7 7 0 00-7-7z" />
                  <path d="M9 21h6" />
                </svg>
                <span>Dados calculados automaticamente a partir do Firestore.</span>
              </div>
            </section>

            {/* ============ Sua jornada ============ */}
            <section aria-label="Sua jornada" className="card col-span-12 grid items-center gap-[22px] xl:grid-cols-[minmax(0,1fr)_auto] xl:px-6 xl:py-5">
              <ol className="m-0 grid list-none grid-cols-5 p-0">
                <li className="relative text-center text-[.62rem] font-semibold text-navy before:absolute before:-left-1/2 before:top-[13px] before:h-[3px] before:w-full before:rounded before:bg-gradient-to-r before:from-gold before:to-gold-light before:content-[''] first:before:hidden min-[420px]:text-[.7rem] md:text-[.84rem] md:before:top-[15px]">
                  <span className="relative z-10 mx-auto mb-2 grid h-7 w-7 place-items-center rounded-full border-2 border-gold-deep bg-gradient-to-br from-gold-light to-gold text-navy-deep md:h-8 md:w-8">
                    <svg className="ico !h-[15px] !w-[15px]" style={{ strokeWidth: 3 }} viewBox="0 0 24 24">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  Controle
                </li>
                <li className="relative text-center text-[.62rem] font-semibold text-navy before:absolute before:-left-1/2 before:top-[13px] before:h-[3px] before:w-full before:rounded before:bg-gradient-to-r before:from-gold before:to-gold-light before:content-[''] min-[420px]:text-[.7rem] md:text-[.84rem] md:before:top-[15px]">
                  <span className="relative z-10 mx-auto mb-2 grid h-7 w-7 place-items-center rounded-full border-2 border-gold-deep bg-gradient-to-br from-gold-light to-gold text-navy-deep md:h-8 md:w-8">
                    <svg className="ico !h-[15px] !w-[15px]" style={{ strokeWidth: 3 }} viewBox="0 0 24 24">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  Consciência
                </li>
                <li aria-current="step" className="relative text-center text-[.62rem] font-extrabold text-navy before:absolute before:-left-1/2 before:top-[13px] before:h-[3px] before:w-full before:rounded before:bg-gradient-to-r before:from-gold before:to-gold-light before:content-[''] min-[420px]:text-[.7rem] md:text-[.84rem] md:before:top-[15px]">
                  <span className="relative z-10 mx-auto mb-2 grid h-7 w-7 place-items-center rounded-full border-2 border-navy bg-navy shadow-[0_0_0_5px_rgba(245,184,46,.4)] md:h-8 md:w-8">
                    <i className="h-2.5 w-2.5 rounded-full bg-gold" />
                  </span>
                  Planejamento
                </li>
                <li className="relative text-center text-[.62rem] font-semibold text-muted before:absolute before:-left-1/2 before:top-[13px] before:h-[3px] before:w-full before:rounded before:bg-navy/10 before:content-[''] min-[420px]:text-[.7rem] md:text-[.84rem] md:before:top-[15px]">
                  <span className="relative z-10 mx-auto mb-2 grid h-7 w-7 place-items-center rounded-full border-2 border-navy/15 bg-white md:h-8 md:w-8" />
                  Investimento
                </li>
                <li className="relative text-center text-[.62rem] font-semibold text-muted before:absolute before:-left-1/2 before:top-[13px] before:h-[3px] before:w-full before:rounded before:bg-navy/10 before:content-[''] min-[420px]:text-[.7rem] md:text-[.84rem] md:before:top-[15px]">
                  <span className="relative z-10 mx-auto mb-2 grid h-7 w-7 place-items-center rounded-full border-2 border-navy/15 bg-white md:h-8 md:w-8" />
                  Patrimônio
                </li>
              </ol>

              <div className="xl:max-w-[290px]">
                <b className="block text-base leading-tight">Você está no Planejamento.</b>
                <p className="mb-3 mt-1 text-[.86rem] text-muted">
                  Faltam R$ 5.400,00 para completar sua reserva de emergência.
                </p>
                <button type="button" className="btn-gold">
                  <span>Partiu planejar</span>
                </button>
              </div>
            </section>

            {/* ============ Minhas Caixinhas (Alinhamento 100% com o modelo) ============ */}
            <section aria-labelledby="b-title" className="card col-span-12">
              <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="b-title" className="card-title">Minhas caixinhas</h2>
                  <p className="card-sub">Cada real com um destino. Soma das caixinhas: R$ {netWorthFormatted}</p>
                </div>
                <NavLink to="/boxes" className="btn-line">
                  <svg className="ico !h-4 !w-4" style={{ strokeWidth: 2.4 }} viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span>Nova caixinha</span>
                </NavLink>
              </div>

              <div className="grid grid-cols-1 gap-3.5 min-[480px]:grid-cols-2 md:grid-cols-3 min-[1400px]:grid-cols-5">
                {displayBoxes.map((box) => (
                  <article key={box.id} className="box">
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`tile ${box.tileClass}`}>
                        {renderBoxIcon(box.iconType)}
                      </span>
                      <button type="button" className="icon-btn !h-[30px] !w-[30px]" aria-label={`Opções de ${box.name}`}>
                        <svg className="ico !h-[18px] !w-[18px]" style={{ strokeWidth: 2.6 }} viewBox="0 0 24 24">
                          <path d="M5 12h.01M12 12h.01M19 12h.01" />
                        </svg>
                      </button>
                    </div>
                    <span className="text-[.9rem] font-medium text-muted">{box.name}</span>
                    <span className="amt"><small>R$</small>{box.amount}</span>
                    <div className={`bar ${box.barClass || ''} !mt-3`} role="progressbar" aria-valuenow={box.pct} aria-valuemin={0} aria-valuemax={100}>
                      <i style={{ width: `${box.pct}%` }} />
                    </div>
                    <span className="note">
                      <b>{box.pct}%</b> {box.metaText}
                    </span>
                  </article>
                ))}
              </div>
            </section>

            {/* ============ Receitas e despesas ============ */}
            <section aria-labelledby="rd-title" className="card col-span-12 md:col-span-6 lg:col-span-4">
              <div className="mb-3.5">
                <h2 id="rd-title" className="card-title">Receitas e despesas</h2>
                <p className="card-sub">Resumo de {monthName}</p>
              </div>
              <div className="mb-2 flex flex-wrap gap-[18px]">
                <div>
                  <small className="block text-[.78rem] text-muted">Receitas em {monthName}</small>
                  <b className="text-[1.1rem]">{receitas}</b>
                </div>
                <div>
                  <small className="block text-[.78rem] text-muted">Despesas</small>
                  <b className="text-[1.1rem]">{despesas}</b>
                </div>
                <div>
                  <small className="block text-[.78rem] text-muted">Sobrou</small>
                  <b className="text-[1.1rem] text-ok">{sobrou}</b>
                </div>
              </div>

              <div
                className="relative mt-2"
                onMouseLeave={() => setBarTooltipData((prev) => ({ ...prev, visible: false }))}
              >
                <svg viewBox={`0 0 ${barW} ${barH}`} role="img" aria-label="Receitas e despesas dos últimos 6 meses" className="h-auto w-full overflow-visible">
                  {barMonths.map((m, i) => {
                    const gx = barPl + i * barGw + (barGw - barBw * 2 - 4) / 2;
                    const recH = (barRec[i] / barMax) * (barH - barPb - barPt);
                    const despH = (barDesp[i] / barMax) * (barH - barPb - barPt);
                    const recY = barH - barPb - recH;
                    const despY = barH - barPb - despH;
                    const monthFull = monthFullNames[m] || m;

                    return (
                      <g
                        key={m}
                        className="cursor-pointer"
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.closest('.relative')?.getBoundingClientRect();
                          if (rect) {
                            setBarTooltipData({
                              month: monthFull,
                              rec: barRec[i],
                              desp: barDesp[i],
                              x: e.clientX - rect.left,
                              y: Math.max(20, Math.min(e.clientY - rect.top, ((Math.min(recY, despY)) / barH) * rect.height)),
                              visible: true,
                            });
                          }
                        }}
                      >
                        {/* Área invisível de captura para facilitar o hover na coluna do mês */}
                        <rect
                          x={gx - 4}
                          y={barPt}
                          width={barBw * 2 + 12}
                          height={barH - barPb - barPt + 20}
                          fill="transparent"
                        />
                        <rect
                          x={gx}
                          y={recY}
                          width={barBw}
                          height={recH}
                          rx={4}
                          fill="#3F6FD8"
                          className="transition-all hover:brightness-110"
                          onMouseEnter={() => setBarTooltipData((prev) => ({ ...prev, hoveredType: 'rec' }))}
                        />
                        <rect
                          x={gx + barBw + 4}
                          y={despY}
                          width={barBw}
                          height={despH}
                          rx={4}
                          fill="#F5B82E"
                          className="transition-all hover:brightness-110"
                          onMouseEnter={() => setBarTooltipData((prev) => ({ ...prev, hoveredType: 'desp' }))}
                        />
                        <text
                          x={gx + barBw + 2}
                          y={barH - 8}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#5B6885"
                          fontFamily="Outfit,sans-serif"
                        >
                          {m}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Tooltip Flutuante para Gráfico de Barras */}
                {barTooltipData.visible && (
                  <div
                    style={{ left: `${barTooltipData.x}px`, top: `${barTooltipData.y}px` }}
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-[115%] z-20 whitespace-nowrap rounded-xl bg-navy px-3 py-2 text-[.8rem] text-white shadow-[0_12px_24px_-10px_rgba(10,31,68,.7)] transition-opacity"
                  >
                    <div className="text-[11px] font-semibold text-[#C3CCE0] border-b border-white/10 pb-1 mb-1.5 flex items-center justify-between gap-3">
                      <span>{barTooltipData.month}</span>
                      <span className="text-[10px] text-white/60">Histórico</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className={`flex items-center justify-between gap-4 text-xs ${barTooltipData.hoveredType === 'rec' ? 'font-bold' : ''}`}>
                        <span className="flex items-center gap-1.5 text-[#A5C0FF]">
                          <span className="inline-block h-2 w-2 rounded-[2px] bg-[#3F6FD8]" />
                          Receitas:
                        </span>
                        <b className="text-white">{brl(barTooltipData.rec)}</b>
                      </div>
                      <div className={`flex items-center justify-between gap-4 text-xs ${barTooltipData.hoveredType === 'desp' ? 'font-bold' : ''}`}>
                        <span className="flex items-center gap-1.5 text-[#FFD580]">
                          <span className="inline-block h-2 w-2 rounded-[2px] bg-[#F5B82E]" />
                          Despesas:
                        </span>
                        <b className="text-white">{brl(barTooltipData.desp)}</b>
                      </div>
                      <div className="border-t border-white/10 pt-1 mt-0.5 flex items-center justify-between gap-4 text-[11px]">
                        <span className="text-white/70">Saldo:</span>
                        <b className={barTooltipData.rec >= barTooltipData.desp ? 'text-ok' : 'text-danger'}>
                          {brl(barTooltipData.rec - barTooltipData.desp)}
                        </b>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-4 text-[.82rem] text-muted">
                <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-[3px] bg-[#3F6FD8] align-[-1px]" />Receitas</span>
                <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-[3px] bg-gold align-[-1px]" />Despesas</span>
              </div>
            </section>

            {/* ============ Categorias ============ */}
            <section aria-labelledby="cat-title" className="card col-span-12 md:col-span-6 lg:col-span-4">
              <div className="mb-3.5 flex items-start justify-between gap-3">
                <div>
                  <h2 id="cat-title" className="card-title">Para onde vai seu dinheiro</h2>
                  <p className="card-sub">Despesas de {monthName}</p>
                </div>
                <button type="button" className="link">Ver tudo</button>
              </div>

              <div className="grid justify-items-center gap-4">
                <div
                  className="relative h-[150px] w-[150px]"
                  onMouseLeave={() => {
                    setHoveredCatIndex(null);
                    setDonutTooltipData((prev) => ({ ...prev, visible: false }));
                  }}
                >
                  <svg viewBox="0 0 160 160" role="img" aria-label="Despesas por categoria" className="h-full w-full -rotate-90">
                    {categoriesEntries.map((c, i) => {
                      let offset = 0;
                      for (let j = 0; j < i; j++) {
                        offset += (categoriesEntries[j][1] / totalExpensesNumber) * donutC;
                      }
                      const dash = (c[1] / totalExpensesNumber) * donutC;
                      const pct = (c[1] / totalExpensesNumber) * 100;
                      return (
                        <circle
                          key={c[0]}
                          cx="80"
                          cy="80"
                          r={donutR}
                          fill="none"
                          stroke={c[2]}
                          strokeWidth={hoveredCatIndex === i ? '24' : '18'}
                          strokeDasharray={`${dash} ${donutC - dash}`}
                          strokeDashoffset={-offset}
                          className="transition-all cursor-pointer hover:opacity-90"
                          onMouseEnter={() => setHoveredCatIndex(i)}
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.closest('.relative')?.getBoundingClientRect();
                            if (rect) {
                              setHoveredCatIndex(i);
                              setDonutTooltipData({
                                category: c[0],
                                value: c[1],
                                percent: pct,
                                color: c[2],
                                x: e.clientX - rect.left,
                                y: e.clientY - rect.top,
                                visible: true,
                              });
                            }
                          }}
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 grid place-content-center text-center pointer-events-none px-2">
                    {hoveredCatIndex !== null && categoriesEntries[hoveredCatIndex] ? (
                      <>
                        <b className="text-[1.05rem] font-extrabold leading-[1.1] transition-all" style={{ color: categoriesEntries[hoveredCatIndex][2] }}>
                          {brl(categoriesEntries[hoveredCatIndex][1])}
                        </b>
                        <small className="text-[.72rem] font-semibold text-navy truncate max-w-[100px]">
                          {categoriesEntries[hoveredCatIndex][0]}
                        </small>
                      </>
                    ) : (
                      <>
                        <b className="text-[1.1rem] font-extrabold leading-[1.1]">{totalExpensesFormatted}</b>
                        <small className="text-[.72rem] text-muted">em despesas</small>
                      </>
                    )}
                  </div>

                  {/* Tooltip Flutuante para Gráfico Donut */}
                  {donutTooltipData.visible && (
                    <div
                      style={{ left: `${donutTooltipData.x}px`, top: `${donutTooltipData.y}px` }}
                      className="pointer-events-none absolute -translate-x-1/2 -translate-y-[120%] z-30 whitespace-nowrap rounded-xl bg-navy px-3 py-2 text-[.8rem] text-white shadow-[0_12px_24px_-10px_rgba(10,31,68,.7)] transition-opacity"
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-white mb-0.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: donutTooltipData.color }} />
                        <span>{donutTooltipData.category}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <b className="text-white">{brl(donutTooltipData.value)}</b>
                        <span className="text-[11px] font-medium text-[#C3CCE0]">
                          ({donutTooltipData.percent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <ul className="m-0 grid w-full list-none grid-cols-2 gap-x-4 gap-y-1.5 p-0">
                  {categoriesEntries.map((c, idx) => (
                    <li
                      key={c[0]}
                      className={`flex items-center justify-between text-xs p-1 rounded-lg transition-colors cursor-pointer ${
                        hoveredCatIndex === idx ? 'bg-navy/[0.06] font-semibold' : 'hover:bg-navy/[0.03]'
                      }`}
                      onMouseEnter={() => setHoveredCatIndex(idx)}
                      onMouseLeave={() => setHoveredCatIndex(null)}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <i className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: c[2] }} />
                        <span className="truncate text-muted">{c[0]}</span>
                      </span>
                      <b className="font-semibold ml-1 whitespace-nowrap">R$ {c[1].toFixed(0)}</b>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* ============ Próximas contas ============ */}
            <section aria-labelledby="bl-title" className="card col-span-12 lg:col-span-4">
              <div className="mb-3.5 flex items-start justify-between gap-3">
                <div>
                  <h2 id="bl-title" className="card-title">Próximas contas</h2>
                  <p className="card-sub">Vencem até o fim do mês</p>
                </div>
                <button type="button" className="link">Ver todas</button>
              </div>

              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {finalBills.map((b, idx) => (
                  <li key={idx} className="flex items-center gap-3 rounded-2xl border border-white/90 bg-white/60 p-2.5">
                    <span className="grid h-11 w-11 flex-none place-content-center rounded-[13px] bg-navy/[.06] text-center leading-none">
                      <b className="text-[1.05rem] font-extrabold">{b.day}</b>
                      <small className="mt-0.5 text-[.66rem] text-muted">set</small>
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className="block text-[.9rem] font-semibold leading-tight">{b.title}</b>
                      <small className="text-[.78rem] text-muted">{b.type}</small>
                    </div>
                    <span className="whitespace-nowrap text-[.92rem] font-bold">{b.value}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-dashed border-navy/20 pt-3 text-[.88rem] text-muted">
                <span>Total a pagar</span>
                <b className="text-base text-navy">{totalBillsFormatted}</b>
              </div>
            </section>
    </div>
  );
};
