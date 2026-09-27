import React, { useState, useEffect, useRef } from 'react';
import { AssetType, InvestmentTransaction } from '../../../domain/types';
import { X, ChevronDown, Plus, Search, Check, TrendingUp } from 'lucide-react';
import {
  searchMarketTickers,
  fetchLiveAssetQuote,
  POPULAR_TICKERS_CATALOG,
} from '../../../infrastructure/investmentsService';

interface AdicionarLancamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: InvestmentTransaction) => void;
}

export const AdicionarLancamentoModal: React.FC<AdicionarLancamentoModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [orderType, setOrderType] = useState<'BUY' | 'SELL' | 'DIVIDEND'>('BUY');
  const [assetType, setAssetType] = useState<string>('Ações');
  const [ticker, setTicker] = useState<string>('');
  const [assetName, setAssetName] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [fees, setFees] = useState<number>(0);

  // Estados de Autocomplete
  const [suggestions, setSuggestions] = useState<typeof POPULAR_TICKERS_CATALOG>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Busca reativa de sugestões ao digitar
  useEffect(() => {
    if (!ticker.trim()) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await searchMarketTickers(ticker, date);
      setSuggestions(results);
      setIsDropdownOpen(results.length > 0);
    }, 150);

    return () => clearTimeout(timer);
  }, [ticker, date]);

  // Atualização automática de preço quando a data ou ticker mudar
  useEffect(() => {
    if (!ticker || ticker.trim().length < 3 || !date || orderType === 'DIVIDEND') return;

    const timer = setTimeout(async () => {
      try {
        const live = await fetchLiveAssetQuote(ticker, date);
        if (live && live.price > 0) {
          setPrice(live.price);
          if (live.name && !assetName) setAssetName(live.name);
        }
      } catch {}
    }, 300);

    return () => clearTimeout(timer);
  }, [ticker, date, orderType]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const totalValue = quantity * price + fees;

  const handleSelectAsset = async (item: (typeof POPULAR_TICKERS_CATALOG)[0]) => {
    setTicker(item.ticker);
    setAssetName(item.name);
    setAssetType(item.category);
    if (orderType !== 'DIVIDEND' && item.defaultPrice > 0) {
      setPrice(item.defaultPrice);
    }
    setIsDropdownOpen(false);

    // Tenta atualizar com a cotação oficial da data selecionada
    if (orderType !== 'DIVIDEND') {
      try {
        const live = await fetchLiveAssetQuote(item.ticker, date);
        if (live && live.price > 0) {
          setPrice(live.price);
          if (live.name) setAssetName(live.name);
        }
      } catch {}
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) return;

    let mappedType: AssetType = 'STOCK';
    if (assetType === 'FIIs') mappedType = 'FII';
    else if (assetType === 'Criptomoedas') mappedType = 'CRYPTO';
    else if (assetType === 'Stocks' || assetType === 'Reits' || assetType === 'ETFs Intern.') {
      mappedType = 'BDR';
    } else if (assetType === 'Renda Fixa') {
      mappedType = 'FIXED_INCOME';
    }

    const tx: InvestmentTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ticker: ticker.trim().toUpperCase(),
      name: assetName || ticker.trim().toUpperCase(),
      type: mappedType,
      operation: orderType,
      date,
      quantity: Number(quantity),
      price: Number(price),
      fees: Number(fees),
      broker: 'Manual',
    };

    onSave(tx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#141A26] border border-[#27344D] p-6 shadow-2xl text-slate-200 animate-in zoom-in-95 duration-150">
        {/* Topo: Título & Fechar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <h3 className="text-base font-bold text-white">Adicionar Lançamento</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Toggle Compra / Venda / Provento */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-[#0D121B] border border-[#1E2638]">
            <button
              type="button"
              onClick={() => setOrderType('BUY')}
              className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                orderType === 'BUY'
                  ? 'bg-[#182232] text-emerald-400 border border-emerald-500/30 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🛒</span>
              <span>Compra</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderType('SELL')}
              className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                orderType === 'SELL'
                  ? 'bg-[#182232] text-rose-400 border border-rose-500/30 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏷️</span>
              <span>Venda</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderType('DIVIDEND')}
              className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                orderType === 'DIVIDEND'
                  ? 'bg-[#182232] text-amber-400 border border-amber-500/30 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>💰</span>
              <span>Provento</span>
            </button>
          </div>

          {/* Tipo de Ativo e Ativo com Autocomplete */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tipo de ativo</label>
              <div className="relative">
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full appearance-none bg-[#0D121B] border border-[#212B3E] rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-slate-400"
                >
                  <option value="Ações">Ações</option>
                  <option value="FIIs">FIIs</option>
                  <option value="Stocks">Stocks</option>
                  <option value="Reits">Reits</option>
                  <option value="ETFs Intern.">ETFs Intern.</option>
                  <option value="Renda Fixa">Renda Fixa</option>
                  <option value="Criptomoedas">Criptomoedas</option>
                  <option value="Outros">Outros</option>
                </select>
                <ChevronDown className="h-4 w-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Campo Ativo com Dropdown Reativo */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Ativo / Ticker
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ex: PETR4, VALE3, BTC"
                  value={ticker}
                  onChange={(e) => {
                    setTicker(e.target.value.toUpperCase());
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => {
                    if (ticker.trim().length > 0 && suggestions.length > 0) {
                      setIsDropdownOpen(true);
                    }
                  }}
                  className="w-full bg-[#0D121B] border border-[#212B3E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-bold"
                />
                <Search className="h-3.5 w-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Dropdown de Sugestões */}
              {isDropdownOpen && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto rounded-xl bg-[#0D121B] border border-[#27344D] shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-white/5">
                    Sugestões Encontradas
                  </div>
                  {suggestions.map((item) => (
                    <div
                      key={item.ticker}
                      onClick={() => handleSelectAsset(item)}
                      className="p-2 rounded-lg hover:bg-[#1A2538] cursor-pointer flex items-center justify-between transition text-xs group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black text-[11px]">
                          {item.ticker}
                        </span>
                        <div>
                          <span className="text-white font-medium block text-xs group-hover:text-amber-400 transition">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400">{item.category}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-white font-bold block text-xs">
                          R$ {item.defaultPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold">Cotação Atual</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Data da Transação e Quantidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Data da transação</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#0D121B] border border-[#212B3E] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Quantidade</label>
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0D121B] border border-[#212B3E] rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          {/* Preço e Outros Custos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Preço Unitário</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0D121B] border border-[#212B3E] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Taxas / Corretagem (Opcional)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={fees}
                  onChange={(e) => setFees(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0D121B] border border-[#212B3E] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Valor Total em Destaque */}
          <div className="p-3.5 rounded-xl bg-[#0D121B] border border-[#1E2638] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Valor Total da Ordem</span>
            <span className="text-sm font-black text-white">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Rodapé: Cancelar & Salvar */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95 shadow"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Salvar Lançamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
