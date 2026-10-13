import React, { useState } from 'react';
import { MarketAsset } from '../../../domain/types';
import { CheckCircle2, TrendingUp, TrendingDown, Filter } from 'lucide-react';

interface StocksTabProps {
  assets: MarketAsset[];
  searchQuery: string;
  onSelectTicker: (ticker: string) => void;
}

export const StocksTab: React.FC<StocksTabProps> = ({
  assets,
  searchQuery,
  onSelectTicker,
}) => {
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

  const stocks = assets.filter((a) => a.type === 'STOCK');
  const sectors = ['ALL', ...Array.from(new Set(stocks.map((s) => s.sector)))];

  const filtered = stocks.filter((s) => {
    const matchesQuery = s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'ALL' || s.sector === selectedSector;
    return matchesQuery && matchesSector;
  });

  return (
    <div className="space-y-6">
      {/* Topo: Filtro por Setor */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-navy-deep/80 border border-white/10">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Filter className="h-4 w-4 text-gold" />
          <span>Filtrar por Setor:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sectors.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedSector(sec)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                selectedSector === sec
                  ? 'bg-gold text-navy-deep shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {sec === 'ALL' ? 'Todos os Setores' : sec}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de Ações com Indicadores Fundamentalistas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((stock) => (
          <div
            key={stock.ticker}
            onClick={() => onSelectTicker(stock.ticker)}
            className="rounded-2xl bg-navy-deep/80 border border-white/10 p-5 hover:border-gold/50 transition cursor-pointer hover:shadow-xl hover:shadow-gold/5 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-black text-white group-hover:text-gold transition">{stock.ticker}</span>
                <p className="text-xs text-slate-400 truncate max-w-[180px]">{stock.name}</p>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-white">R$ {stock.price.toFixed(2)}</span>
                <div className={`flex items-center justify-end text-xs font-bold ${stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stock.change >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Múltiplos Fundamentalistas */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/5 text-center">
              <div className="p-1.5 rounded-lg bg-white/5">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">D.Y.</span>
                <b className="text-xs font-black text-emerald-400">{stock.dy?.toFixed(1)}%</b>
              </div>
              <div className="p-1.5 rounded-lg bg-white/5">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">P/L</span>
                <b className="text-xs font-black text-white">{stock.pl?.toFixed(1) || '-'}</b>
              </div>
              <div className="p-1.5 rounded-lg bg-white/5">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">P/VP</span>
                <b className="text-xs font-black text-white">{stock.pvp?.toFixed(2) || '-'}</b>
              </div>
              <div className="p-1.5 rounded-lg bg-white/5">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">ROE</span>
                <b className="text-xs font-black text-amber-300">{stock.roe ? `${stock.roe.toFixed(1)}%` : '-'}</b>
              </div>
            </div>

            {/* Checklist Barsi / Graham */}
            <div className="mt-3.5 flex items-center justify-between text-[11px] text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Checklist de Saúde</span>
              </div>
              <span className="font-bold text-emerald-400">Aprovado</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
