import React from 'react';
import { CryptoTicker } from '../../../domain/types';
import { TrendingUp, TrendingDown, RefreshCw, Zap } from 'lucide-react';

interface CryptoTabProps {
  cryptos: CryptoTicker[];
  searchQuery: string;
  onSelectCrypto: (symbol: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const CryptoTab: React.FC<CryptoTabProps> = ({
  cryptos,
  searchQuery,
  onSelectCrypto,
  onRefresh,
  isLoading,
}) => {
  const filtered = cryptos.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Topo: Status Binance API ao Vivo */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-navy-deep/80 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Mercado Spot Binance (Ao Vivo)</h3>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                WebSocket & REST 100% Free
              </span>
            </div>
            <p className="text-xs text-slate-400">Cotações em USD e conversão em Reais (BRL) em tempo real</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Atualizar Cotações</span>
        </button>
      </div>

      {/* Grid de Criptomoedas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((crypto) => (
          <div
            key={crypto.symbol}
            onClick={() => onSelectCrypto(crypto.symbol)}
            className="rounded-2xl bg-navy-deep/80 border border-white/10 p-5 hover:border-amber-500/50 transition cursor-pointer hover:shadow-xl hover:shadow-amber-500/5 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center text-xl">
                  {crypto.icon}
                </div>
                <div>
                  <span className="text-base font-black text-white group-hover:text-amber-400 transition">{crypto.ticker}</span>
                  <p className="text-xs text-slate-400 truncate max-w-[120px]">{crypto.name}</p>
                </div>
              </div>

              <div className="text-right">
                <div className={`flex items-center justify-end text-xs font-bold ${crypto.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {crypto.change24h >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                  {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
                </div>
                <span className="text-[10px] text-slate-400">24h</span>
              </div>
            </div>

            {/* Preços USD e BRL */}
            <div className="mt-4 pt-3 border-t border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Preço USD:</span>
                <b className="text-sm font-black text-white">
                  ${' '}
                  {crypto.priceUsd < 1
                    ? crypto.priceUsd.toFixed(4)
                    : crypto.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </b>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Preço BRL:</span>
                <b className="text-xs font-bold text-amber-300">
                  R${' '}
                  {crypto.priceBrl < 1
                    ? crypto.priceBrl.toFixed(4)
                    : crypto.priceBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </b>
              </div>
            </div>

            {/* Máxima e Mínima 24h */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-white/5 text-[10px]">
              <div>
                <span className="text-slate-400 block">Mínima 24h</span>
                <span className="font-bold text-slate-300">${crypto.low24h < 1 ? crypto.low24h.toFixed(3) : crypto.low24h.toLocaleString('en-US')}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Máxima 24h</span>
                <span className="font-bold text-slate-300">${crypto.high24h < 1 ? crypto.high24h.toFixed(3) : crypto.high24h.toLocaleString('en-US')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
