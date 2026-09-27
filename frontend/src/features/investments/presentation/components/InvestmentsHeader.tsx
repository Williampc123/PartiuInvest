import React from 'react';
import { MacroRates } from '../../domain/types';
import { Search, Plus, X, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

interface InvestmentsHeaderProps {
  macroRates: MacroRates | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewTransaction: () => void;
  onClose: () => void;
}

export const InvestmentsHeader: React.FC<InvestmentsHeaderProps> = ({
  macroRates,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onOpenNewTransaction,
  onClose,
}) => {
  const tabs = [
    { id: 'overview', label: 'Minha Carteira', icon: '📊' },
    { id: 'stocks', label: 'Ações B3', icon: '📈' },
    { id: 'fiis', label: 'FIIs', icon: '🏢' },
    { id: 'crypto', label: 'Criptomoedas (Binance)', icon: '🪙' },
    { id: 'dividends', label: 'Dividendos', icon: '💰' },
    { id: 'tax', label: 'Imposto de Renda (PRO)', icon: '⚖️', isPro: true },
    { id: 'b3', label: 'Importar B3 (PRO)', icon: '📑', isPro: true },
    { id: 'ai', label: 'Diagnóstico IA (PRO)', icon: '🤖', isPro: true },
    { id: 'comparer', label: 'Comparador', icon: '🔄' },
    { id: 'calculators', label: 'Calculadoras', icon: '🧮' },
  ];

  return (
    <header className="flex-shrink-0 border-b border-white/10 bg-navy-deep/95 backdrop-blur-xl">
      {/* 1. Market Ticker Marquee Strip (Investidor10 Live Bar) */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-1.5 text-xs text-slate-300">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-semibold text-slate-400">IBOV:</span>
            <span className="font-bold text-white">{(macroRates?.ibovespa.points || 132600).toLocaleString('pt-BR')} pts</span>
            <span className={`flex items-center text-[11px] font-bold ${(macroRates?.ibovespa.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(macroRates?.ibovespa.change || 0) >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
              {Math.abs(macroRates?.ibovespa.change || 0.72)}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-semibold text-slate-400">DÓLAR:</span>
            <span className="font-bold text-white">R$ {(macroRates?.usd || 5.45).toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-semibold text-slate-400">CDI:</span>
            <span className="font-bold text-emerald-400">{(macroRates?.cdi || 10.40).toFixed(2)}% a.a.</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-semibold text-slate-400">SELIC:</span>
            <span className="font-bold text-white">{(macroRates?.selic || 10.50).toFixed(2)}%</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-semibold text-slate-400">IPCA 12M:</span>
            <span className="font-bold text-amber-400">{(macroRates?.ipca12m || 4.25).toFixed(2)}%</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Mercado Aberto
          </span>
        </div>
      </div>

      {/* 2. Main Navigation Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-6 py-3">
        {/* Logo & Identity */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-gold to-[#E2A11B] flex items-center justify-center text-navy-deep font-black shadow-lg shadow-gold/20">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">Investidor<span className="text-gold">10</span></span>
                <span className="rounded-md bg-gold/20 border border-gold/40 px-1.5 py-0.2 text-[10px] font-extrabold uppercase text-gold">PRO</span>
              </div>
              <p className="text-[11px] text-slate-400">Central de Análise e Inteligência Financeira</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl bg-white/5"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar ação, FII, cripto (ex: PETR4, HGLG11, BTC)..."
              className="w-full pl-9 pr-4 py-2 bg-navy-soft/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/60 transition"
            />
          </div>

          <button
            type="button"
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-gold to-[#E2A11B] hover:from-gold-light hover:to-gold text-navy-deep font-extrabold text-xs shadow-md shadow-gold/20 transition active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span className="hidden sm:inline">Nova Transação</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="hidden md:flex items-center justify-center h-9 w-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition"
            title="Fechar (ESC)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 3. Horizontal Navigation Tabs */}
      <div className="flex items-center gap-1 px-4 md:px-6 overflow-x-auto no-scrollbar border-t border-white/5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'border-gold text-gold bg-gold/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.isPro && (
                <span className="flex items-center gap-0.5 rounded bg-gold/20 px-1 py-0.2 text-[9px] font-black text-gold border border-gold/30">
                  <Sparkles className="h-2.5 w-2.5" /> PRO
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
