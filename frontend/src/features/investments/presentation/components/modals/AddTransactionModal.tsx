import React, { useState } from 'react';
import { AssetType, InvestmentTransaction } from '../../../domain/types';
import { X, Plus, DollarSign, Calendar, Tag, ShieldCheck } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: InvestmentTransaction) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState<AssetType>('STOCK');
  const [operation, setOperation] = useState<'BUY' | 'SELL'>('BUY');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState<number>(100);
  const [price, setPrice] = useState<number>(35.00);
  const [fees, setFees] = useState<number>(0);
  const [broker, setBroker] = useState('XP Investimentos');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) return;

    const tx: InvestmentTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ticker: ticker.trim().toUpperCase(),
      type,
      operation,
      date,
      quantity: Number(quantity),
      price: Number(price),
      fees: Number(fees),
      broker,
    };

    onSave(tx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-navy-deep/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-3xl bg-navy-deep border border-white/20 p-6 shadow-2xl backdrop-blur-2xl text-white animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black">Adicionar Transação</h3>
              <p className="text-xs text-slate-400">Cadastre suas compras e vendas para atualizar o preço médio</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Operação: Compra ou Venda */}
          <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => setOperation('BUY')}
              className={`py-2 rounded-xl text-xs font-black transition ${
                operation === 'BUY'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              COMPRA (Aporte)
            </button>
            <button
              type="button"
              onClick={() => setOperation('SELL')}
              className={`py-2 rounded-xl text-xs font-black transition ${
                operation === 'SELL'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              VENDA (Desinvestimento)
            </button>
          </div>

          {/* Ticker & Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Ticker / Código:</label>
              <input
                type="text"
                required
                placeholder="Ex: PETR4, HGLG11, BTC"
                value={ticker}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setTicker(val);
                  if (['BTC', 'ETH', 'SOL', 'BNB'].includes(val)) setType('CRYPTO');
                  else if (val.endsWith('11') && !['TAEE11', 'KLBN11'].includes(val)) setType('FII');
                  else if (val.endsWith('34')) setType('BDR');
                  else setType('STOCK');
                }}
                className="w-full bg-navy-soft/60 border border-white/10 rounded-xl px-4 py-2.5 text-white font-black text-sm uppercase focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Classe do Ativo:</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AssetType)}
                className="w-full bg-navy-soft/60 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-xs focus:outline-none focus:border-gold"
              >
                <option value="STOCK" className="bg-navy-deep">Ação (B3 / Stock)</option>
                <option value="FII" className="bg-navy-deep">Fundo Imobiliário (FII)</option>
                <option value="CRYPTO" className="bg-navy-deep">Criptomoeda (Binance)</option>
                <option value="BDR" className="bg-navy-deep">BDR / Internacional</option>
                <option value="ETF" className="bg-navy-deep">ETF</option>
                <option value="FIXED_INCOME" className="bg-navy-deep">Renda Fixa / Tesouro</option>
              </select>
            </div>
          </div>

          {/* Quantidade e Preço Unitário */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Quantidade:</label>
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full bg-navy-soft/60 border border-white/10 rounded-xl px-4 py-2 text-white font-bold text-sm focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Preço Unitário (R$):</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-navy-soft/60 border border-white/10 rounded-xl px-4 py-2 text-white font-bold text-sm focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          {/* Data e Corretora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Data da Operação:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-navy-soft/60 border border-white/10 rounded-xl px-4 py-2 text-white font-bold text-xs focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Instituição / Corretora:</label>
              <input
                type="text"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                placeholder="Ex: XP, NuInvest, Binance"
                className="w-full bg-navy-soft/60 border border-white/10 rounded-xl px-4 py-2 text-white font-medium text-xs focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          {/* Resumo do Total */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Valor Total da Operação:</span>
            <b className="text-base font-black text-gold">
              R$ {(quantity * price + fees).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </b>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold to-[#E2A11B] hover:from-gold-light hover:to-gold text-navy-deep font-black text-xs shadow-lg shadow-gold/20"
            >
              Salvar Operação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
