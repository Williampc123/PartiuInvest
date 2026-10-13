import React, { useState } from 'react';
import { MarketAsset } from '../../../domain/types';
import { Building2, TrendingUp, TrendingDown, Percent, DollarSign, Filter } from 'lucide-react';

interface FiisTabProps {
  assets: MarketAsset[];
  searchQuery: string;
  onSelectTicker: (ticker: string) => void;
}

export const FiisTab: React.FC<FiisTabProps> = ({
  assets,
  searchQuery,
  onSelectTicker,
}) => {
  const [selectedSegment, setSelectedSegment] = useState<string>('ALL');

  const fiis = assets.filter((a) => a.type === 'FII');
  const segments = ['ALL', ...Array.from(new Set(fiis.map((f) => f.sector)))];

  const filtered = fiis.filter((f) => {
    const matchesQuery = f.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSegment = selectedSegment === 'ALL' || f.sector === selectedSegment;
    return matchesQuery && matchesSegment;
  });

  return (
    <div className="space-y-6">
      {/* Topo: Filtro por Segmento */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-navy-deep/80 border border-white/10">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Building2 className="h-4 w-4 text-emerald-400" />
          <span>Filtrar por Segmento Imobiliário:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {segments.map((seg) => (
            <button
              key={seg}
              type="button"
              onClick={() => setSelectedSegment(seg)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                selectedSegment === seg
                  ? 'bg-emerald-500 text-navy-deep shadow-md font-black'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {seg === 'ALL' ? 'Todos os Segmentos' : seg}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de Fundos Imobiliários com Vacância e Rendimento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((fii) => (
          <div
            key={fii.ticker}
            onClick={() => onSelectTicker(fii.ticker)}
            className="rounded-2xl bg-navy-deep/80 border border-white/10 p-5 hover:border-emerald-500/50 transition cursor-pointer hover:shadow-xl hover:shadow-emerald-500/5 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-white group-hover:text-emerald-400 transition">{fii.ticker}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    {fii.sector}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">{fii.name}</p>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-white">R$ {fii.price.toFixed(2)}</span>
                <div className={`flex items-center justify-end text-xs font-bold ${fii.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {fii.change >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                  {fii.change >= 0 ? '+' : ''}{fii.change.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Múltiplos FII */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/5 text-center">
              <div className="p-2 rounded-xl bg-white/5">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">DY 12M</span>
                <b className="text-xs font-black text-emerald-400">{fii.dy?.toFixed(1)}%</b>
              </div>
              <div className="p-2 rounded-xl bg-white/5">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">P/VP</span>
                <b className={`text-xs font-black ${(fii.pvp || 1) <= 1.02 ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {fii.pvp?.toFixed(2) || '-'}
                </b>
              </div>
              <div className="p-2 rounded-xl bg-white/5">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">Último Rend.</span>
                <b className="text-xs font-black text-white">R$ {fii.lastDividend?.toFixed(2) || '0.90'}</b>
              </div>
              <div className="p-2 rounded-xl bg-white/5">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">Vacância</span>
                <b className="text-xs font-black text-slate-200">{fii.vacancy !== undefined ? `${fii.vacancy.toFixed(1)}%` : '0.0%'}</b>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
