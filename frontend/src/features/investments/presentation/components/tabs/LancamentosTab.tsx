import React, { useState } from 'react';
import { InvestmentTransaction } from '../../../domain/types';
import {
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
  Trash2,
  Plus,
} from 'lucide-react';

interface LancamentosTabProps {
  transactions: InvestmentTransaction[];
  onOpenAddModal: () => void;
  onDeleteTransaction?: (id: string) => void;
  hideValues: boolean;
}

export const LancamentosTab: React.FC<LancamentosTabProps> = ({
  transactions,
  onOpenAddModal,
  onDeleteTransaction,
  hideValues,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isTableOpen, setIsTableOpen] = useState(true);

  const fmt = (val: number) => {
    if (hideValues) return '••••••';
    return `R$ ${(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Consolidação de Aportes a partir das transações reais
  const monthlyAportesMap: Record<string, { buy: number; sell: number }> = {};
  for (const t of transactions) {
    const ym = t.date.slice(0, 7); // '2026-09'
    if (!monthlyAportesMap[ym]) {
      monthlyAportesMap[ym] = { buy: 0, sell: 0 };
    }
    const val = t.quantity * t.price;
    if (t.operation === 'BUY') {
      monthlyAportesMap[ym].buy += val;
    } else {
      monthlyAportesMap[ym].sell -= val;
    }
  }

  const aportesData = Object.entries(monthlyAportesMap)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .slice(-6)
    .map(([ym, data]) => {
      const [y, m] = ym.split('-');
      return {
        label: `${m}/${y}`,
        buy: data.buy,
        sell: data.sell,
      };
    });

  const maxVal = Math.max(1, ...aportesData.map((d) => Math.max(d.buy, Math.abs(d.sell))));

  const filteredTxs = transactions.filter(
    (t) =>
      t.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.name && t.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.broker && t.broker.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-slate-200">
      {/* 1. PAINEL SUPERIOR: CONSOLIDAÇÃO DE APORTES REAL */}
      <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-black text-white">Consolidação de Aportes</h3>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95 shadow"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-center gap-6 text-xs text-slate-300 mb-6">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-[#34D399]" />
            <span>Compras</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-[#F87171]" />
            <span>Vendas</span>
          </div>
        </div>

        {/* Gráfico de Barras */}
        {aportesData.length > 0 ? (
          <div className="h-48 flex items-end justify-between gap-4 pt-4 pb-2 border-b border-white/5 px-4 relative">
            <div className="absolute left-0 top-1/2 w-full h-[1px] bg-white/10" />

            {aportesData.map((d) => {
              const buyHeight = maxVal > 0 ? (d.buy / maxVal) * 80 : 0;
              const sellHeight = maxVal > 0 ? (Math.abs(d.sell) / maxVal) * 80 : 0;

              return (
                <div
                  key={d.label}
                  className="flex-1 flex flex-col items-center h-full justify-center group cursor-pointer relative"
                >
                  <div className="h-20 flex items-end w-full max-w-[56px] justify-center">
                    {d.buy > 0 && (
                      <div
                        style={{ height: `${buyHeight}px` }}
                        className="w-full rounded-t bg-[#34D399] group-hover:bg-[#4ADE80] transition shadow"
                      />
                    )}
                  </div>

                  <div className="h-16 flex items-start w-full max-w-[56px] justify-center">
                    {d.sell < 0 && (
                      <div
                        style={{ height: `${sellHeight}px` }}
                        className="w-full rounded-b bg-[#F87171] group-hover:bg-[#EF4444] transition shadow"
                      />
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 font-semibold absolute bottom-0">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-slate-500 text-xs border border-dashed border-white/10 rounded-xl">
            Nenhum aporte registrado até o momento
          </div>
        )}
      </div>

      {/* 2. PAINEL INFERIOR: TABELA DE LANÇAMENTOS REAIS */}
      <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] overflow-hidden shadow-sm">
        {/* Header da Tabela com Barra de Busca e Recolher */}
        <div className="p-4 border-b border-[#212B3E] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-white">Extrato de Lançamentos</h3>
            <span className="text-xs text-slate-400 font-medium">({filteredTxs.length})</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-56">
              <input
                type="text"
                placeholder="Buscar por ticker, nome ou corretora"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#101520] border border-[#212B3E] rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-400"
              />
              <Search className="h-3.5 w-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            <button
              type="button"
              onClick={() => setIsTableOpen(!isTableOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              {isTableOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Linhas da Tabela */}
        {isTableOpen && (
          <div className="overflow-x-auto">
            {filteredTxs.length > 0 ? (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#101520] uppercase text-[10px] text-slate-400 font-bold border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4">Ativo</th>
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-3">Ordem</th>
                    <th className="py-3 px-3">Quantidade</th>
                    <th className="py-3 px-3">Preço Unitário</th>
                    <th className="py-3 px-3">Taxas</th>
                    <th className="py-3 px-3 font-bold text-white">Total</th>
                    <th className="py-3 px-3">Data</th>
                    <th className="py-3 px-3">Instituição</th>
                    {onDeleteTransaction && <th className="py-3 px-4 text-right">Ação</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium text-xs">
                  {filteredTxs.map((t) => {
                    const totalVal = t.quantity * t.price + (t.fees || 0);
                    return (
                      <tr key={t.id} className="hover:bg-white/5 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[10px] text-white">
                              {t.ticker.slice(0, 4)}
                            </div>
                            <div>
                              <span className="font-bold text-white text-xs block">{t.ticker}</span>
                              {t.name && <span className="text-[10px] text-slate-400">{t.name}</span>}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-400">{t.type}</td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              t.operation === 'BUY'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : t.operation === 'DIVIDEND'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {t.operation === 'BUY' ? 'Compra' : t.operation === 'DIVIDEND' ? 'Provento' : 'Venda'}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-bold text-slate-200">{t.quantity}</td>

                        <td className="py-3 px-3">{fmt(t.price)}</td>

                        <td className="py-3 px-3 text-slate-400">{fmt(t.fees || 0)}</td>

                        <td className="py-3 px-3 font-bold text-white">{fmt(totalVal)}</td>

                        <td className="py-3 px-3 text-slate-300">{t.date}</td>

                        <td className="py-3 px-3 text-slate-400">{t.broker || 'Custódia'}</td>

                        {onDeleteTransaction && (
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => onDeleteTransaction(t.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                              title="Excluir lançamento"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhum lançamento encontrado. Cadastre suas compras para preencher a carteira.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
