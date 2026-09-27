import React, { useState } from 'react';
import { MarketAsset } from '../../../domain/types';
import { ArrowLeftRight, CheckCircle2, TrendingUp } from 'lucide-react';

interface ComparerTabProps {
  assets: MarketAsset[];
}

export const ComparerTab: React.FC<ComparerTabProps> = ({ assets }) => {
  const [asset1Ticker, setAsset1Ticker] = useState<string>('PETR4');
  const [asset2Ticker, setAsset2Ticker] = useState<string>('VALE3');

  const asset1 = assets.find((a) => a.ticker === asset1Ticker) || assets[0];
  const asset2 = assets.find((a) => a.ticker === asset2Ticker) || assets[1] || assets[0];

  return (
    <div className="space-y-6">
      {/* Seletores dos Ativos */}
      <div className="p-5 rounded-2xl bg-navy-deep/80 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ativo 1:</label>
          <select
            value={asset1Ticker}
            onChange={(e) => setAsset1Ticker(e.target.value)}
            className="w-full bg-navy-soft/70 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-gold"
          >
            {assets.map((a) => (
              <option key={a.ticker} value={a.ticker} className="bg-navy-deep text-white">
                {a.ticker} - {a.name} ({a.type})
              </option>
            ))}
          </select>
        </div>

        <div className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center text-gold shrink-0">
          <ArrowLeftRight className="h-5 w-5" />
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ativo 2:</label>
          <select
            value={asset2Ticker}
            onChange={(e) => setAsset2Ticker(e.target.value)}
            className="w-full bg-navy-soft/70 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-gold"
          >
            {assets.map((a) => (
              <option key={a.ticker} value={a.ticker} className="bg-navy-deep text-white">
                {a.ticker} - {a.name} ({a.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela Comparativa Lado a Lado */}
      <div className="rounded-2xl bg-navy-deep/80 border border-white/10 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 bg-white/5">
          <h3 className="text-base font-black text-white">Comparativo Direto de Indicadores</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-white/5 uppercase text-[10px] font-bold text-slate-400">
              <tr>
                <th className="px-5 py-3">Indicador</th>
                <th className="px-5 py-3 text-gold text-sm font-black">{asset1?.ticker}</th>
                <th className="px-5 py-3 text-blue-light text-sm font-black">{asset2?.ticker}</th>
                <th className="px-5 py-3">Vencedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              <tr className="hover:bg-white/5">
                <td className="px-5 py-3.5 text-slate-300 font-bold">Cotação Atual</td>
                <td className="px-5 py-3.5 font-bold text-white">R$ {asset1?.price.toFixed(2)}</td>
                <td className="px-5 py-3.5 font-bold text-white">R$ {asset2?.price.toFixed(2)}</td>
                <td className="px-5 py-3.5 text-slate-400">-</td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="px-5 py-3.5 text-slate-300 font-bold">Dividend Yield (DY 12M)</td>
                <td className="px-5 py-3.5 font-black text-emerald-400">{asset1?.dy?.toFixed(1) || 0}%</td>
                <td className="px-5 py-3.5 font-black text-emerald-400">{asset2?.dy?.toFixed(1) || 0}%</td>
                <td className="px-5 py-3.5 font-bold text-gold">
                  {(asset1?.dy || 0) > (asset2?.dy || 0) ? `🏆 ${asset1?.ticker}` : `🏆 ${asset2?.ticker}`}
                </td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="px-5 py-3.5 text-slate-300 font-bold">Preço / Lucro (P/L)</td>
                <td className="px-5 py-3.5 font-bold text-white">{asset1?.pl?.toFixed(1) || '-'}</td>
                <td className="px-5 py-3.5 font-bold text-white">{asset2?.pl?.toFixed(1) || '-'}</td>
                <td className="px-5 py-3.5 font-bold text-gold">
                  {asset1?.pl && asset2?.pl ? (asset1.pl < asset2.pl ? `🏆 ${asset1.ticker} (Mais Barato)` : `🏆 ${asset2.ticker} (Mais Barato)`) : '-'}
                </td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="px-5 py-3.5 text-slate-300 font-bold">Preço / Valor Patrimonial (P/VP)</td>
                <td className="px-5 py-3.5 font-bold text-white">{asset1?.pvp?.toFixed(2) || '-'}</td>
                <td className="px-5 py-3.5 font-bold text-white">{asset2?.pvp?.toFixed(2) || '-'}</td>
                <td className="px-5 py-3.5 font-bold text-gold">
                  {asset1?.pvp && asset2?.pvp ? (asset1.pvp < asset2.pvp ? `🏆 ${asset1.ticker}` : `🏆 ${asset2.ticker}`) : '-'}
                </td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="px-5 py-3.5 text-slate-300 font-bold">Retorno sobre Patrimônio (ROE)</td>
                <td className="px-5 py-3.5 font-bold text-amber-300">{asset1?.roe ? `${asset1.roe.toFixed(1)}%` : '-'}</td>
                <td className="px-5 py-3.5 font-bold text-amber-300">{asset2?.roe ? `${asset2.roe.toFixed(1)}%` : '-'}</td>
                <td className="px-5 py-3.5 font-bold text-gold">
                  {(asset1?.roe || 0) > (asset2?.roe || 0) ? `🏆 ${asset1?.ticker}` : `🏆 ${asset2?.ticker}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
