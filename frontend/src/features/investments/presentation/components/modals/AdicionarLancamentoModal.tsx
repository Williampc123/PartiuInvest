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
  const [dividendType, setDividendType] = useState<'Dividendo' | 'JCP' | 'Rendimento'>('Dividendo');
  const [dateCom, setDateCom] = useState<string>('');

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
    else if (assetType === 'ETFs' || assetType === 'ETFs Intern.') mappedType = 'ETF';
    else if (assetType === 'Stocks' || assetType === 'Reits' || assetType === 'BDRs') {
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
      dividendType: orderType === 'DIVIDEND' ? (dividendType as any) : undefined,
      dateCom: orderType === 'DIVIDEND' && dateCom ? dateCom : undefined,
      paymentDate: orderType === 'DIVIDEND' ? date : undefined,
    };

    onSave(tx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 p-6 shadow-2xl text-navy animate-in zoom-in-95 duration-150">
        {/* Topo: Título & Fechar */}
        <div className="flex items-center justify-between pb-4 border-b border-navy/10">
          <h3 className="text-base font-black text-navy">Adicionar Lançamento</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-muted hover:text-navy hover:bg-navy/5 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Toggle Compra / Venda / Provento */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-navy/[0.03] border border-navy/10">
            <button
              type="button"
              onClick={() => setOrderType('BUY')}
              className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                orderType === 'BUY'
                  ? 'bg-white text-ok border border-ok/30 shadow-xs'
                  : 'text-muted hover:text-navy'
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
                  ? 'bg-white text-danger border border-danger/30 shadow-xs'
                  : 'text-muted hover:text-navy'
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
                  ? 'bg-white text-gold-deep border border-gold/40 shadow-xs'
                  : 'text-muted hover:text-navy'
              }`}
            >
              <span>💰</span>
              <span>Provento</span>
            </button>
          </div>

          {/* Tipo de Ativo e Ativo com Autocomplete */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">Tipo de ativo</label>
              <div className="relative">
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-navy/15 rounded-xl px-3.5 py-2.5 text-xs text-navy font-bold focus:outline-none focus:border-navy/40 focus:bg-white"
                >
                  <option value="Ações">Ações</option>
                  <option value="FIIs">FIIs</option>
                  <option value="BDR">BDRs</option>
                  <option value="Stocks">Stocks</option>
                  <option value="Reits">Reits</option>
                  <option value="ETFs Intern.">ETFs Intern.</option>
                  <option value="Renda Fixa">Renda Fixa</option>
                  <option value="Criptomoedas">Criptomoedas</option>
                  <option value="Outros">Outros</option>
                </select>
                <ChevronDown className="h-4 w-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Campo Ativo com Dropdown Reativo */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-muted mb-1.5">
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
                  className="w-full bg-slate-50 border border-navy/15 rounded-xl px-3.5 py-2.5 text-xs text-navy placeholder-muted/60 focus:outline-none focus:border-gold-deep focus:bg-white font-bold"
                />
                <Search className="h-3.5 w-3.5 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Dropdown de Sugestões */}
              {isDropdownOpen && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto rounded-xl bg-white border border-navy/15 shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted border-b border-navy/10">
                    Sugestões Encontradas
                  </div>
                  {suggestions.map((item) => (
                    <div
                      key={item.ticker}
                      onClick={() => handleSelectAsset(item)}
                      className="p-2 rounded-lg hover:bg-navy/5 cursor-pointer flex items-center justify-between transition text-xs group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-ok/10 text-ok font-black text-[11px] border border-ok/20">
                          {item.ticker}
                        </span>
                        <div>
                          <span className="text-navy font-bold block text-xs group-hover:text-gold-deep transition">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-muted">{item.category}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-navy font-black block text-xs">
                          R$ {item.defaultPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-ok font-semibold">Cotação Atual</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Data da Transação e Quantidade */}
          {orderType === 'DIVIDEND' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3 rounded-xl bg-gold/10 border border-gold/30">
              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">Tipo de Provento</label>
                <div className="relative">
                  <select
                    value={dividendType}
                    onChange={(e: any) => setDividendType(e.target.value)}
                    className="w-full appearance-none bg-white border border-navy/15 rounded-xl px-3.5 py-2.5 text-xs text-navy font-bold focus:outline-none focus:border-gold-deep"
                  >
                    <option value="Dividendo">Dividendo</option>
                    <option value="JCP">Juros s/ Capital Próprio (JCP)</option>
                    <option value="Rendimento">Rendimento (FII)</option>
                  </select>
                  <ChevronDown className="h-4 w-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">Data COM (Direito)</label>
                <input
                  type="date"
                  value={dateCom}
                  onChange={(e) => setDateCom(e.target.value)}
                  placeholder="Data limite de custódia"
                  className="w-full bg-white border border-navy/15 rounded-xl px-3.5 py-2.5 text-xs text-navy font-semibold focus:outline-none focus:border-gold-deep"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">
                {orderType === 'DIVIDEND' ? 'Data de Pagamento (Crédito)' : 'Data da transação'}
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-navy/15 rounded-xl px-3.5 py-2.5 text-xs text-navy font-semibold focus:outline-none focus:border-navy/40 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">
                {orderType === 'DIVIDEND' ? 'Quantidade em Custódia na Data COM' : 'Quantidade'}
              </label>
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-navy/15 rounded-xl px-3.5 py-2.5 text-xs text-navy font-black focus:outline-none focus:border-navy/40 focus:bg-white"
              />
            </div>
          </div>

          {/* Preço e Outros Custos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">Preço Unitário</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-navy/15 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-navy font-black focus:outline-none focus:border-navy/40 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">Taxas / Corretagem (Opcional)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={fees}
                  onChange={(e) => setFees(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-navy/15 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-navy font-bold focus:outline-none focus:border-navy/40 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Valor Total em Destaque */}
          <div className="p-3.5 rounded-xl bg-navy/[0.03] border border-navy/10 flex items-center justify-between">
            <span className="text-xs font-bold text-muted">Valor Total da Ordem</span>
            <span className="text-base font-black text-navy">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Rodapé: Cancelar & Salvar */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-muted hover:text-navy transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl btn-gold text-xs font-bold transition active:scale-95 shadow-sm"
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
