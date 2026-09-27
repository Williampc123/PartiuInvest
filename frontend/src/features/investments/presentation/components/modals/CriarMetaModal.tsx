import React, { useState } from 'react';
import {
  X,
  ArrowLeft,
  PiggyBank,
  Wallet,
  Coins,
  ChevronDown,
  Check,
} from 'lucide-react';

export interface MetaItem {
  id: string;
  type: 'patrimonio' | 'ativos' | 'proventos';
  title: string;
  category?: string;
  targetAmount: number;
  monthlyDeposit?: number;
  annualRate?: number;
  currentAmount: number;
  assetType?: string;
  ticker?: string;
  selectedAssetTypes?: string[];
  progressPct: number;
}

interface CriarMetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeta: (meta: MetaItem) => void;
}

export const CriarMetaModal: React.FC<CriarMetaModalProps> = ({
  isOpen,
  onClose,
  onSaveMeta,
}) => {
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [metaType, setMetaType] = useState<'patrimonio' | 'ativos' | 'proventos'>('patrimonio');

  // Campos do formulário
  const [category, setCategory] = useState<string>('Total de patrimônio');
  const [totalTarget, setTotalTarget] = useState<number>(0);
  const [monthlyDeposit, setMonthlyDeposit] = useState<number>(0);
  const [annualVariation, setAnnualVariation] = useState<number>(10.0);
  const [assetType, setAssetType] = useState<string>('Ações');
  const [ticker, setTicker] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({
    acoes: true,
    fiis: true,
    stocks: true,
    bdrs: true,
    etfs: true,
  });

  if (!isOpen) return null;

  const handleSelectType = (type: 'patrimonio' | 'ativos' | 'proventos') => {
    setMetaType(type);
    setStep('form');
  };

  const handleBack = () => {
    setStep('select');
  };

  const toggleAssetType = (key: string) => {
    setSelectedTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let title = 'Meta de Patrimônio';
    if (metaType === 'proventos') {
      title = 'Média de Proventos Mensais recebidos em Ações, FIIs, Stocks e BDRs';
    } else if (metaType === 'ativos') {
      title = `Meta de Ativos - ${assetType} ${ticker ? `(${ticker})` : ''}`;
    }

    const newMeta: MetaItem = {
      id: `meta_${Date.now()}`,
      type: metaType,
      title,
      category,
      targetAmount: totalTarget > 0 ? totalTarget : 0,
      monthlyDeposit,
      annualRate: annualVariation,
      currentAmount: 0,
      assetType,
      ticker,
      progressPct: 0,
    };

    onSaveMeta(newMeta);
    onClose();
    setStep('select');
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#141A26] border border-[#27344D] p-6 shadow-2xl text-slate-200 animate-in zoom-in-95 duration-150">
        {/* ========================================================================= */}
        {/* PASSO 1: ESCOLHA DO TIPO DE META (Idêntico à Imagem 1)                     */}
        {/* ========================================================================= */}
        {step === 'select' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-base font-bold text-white">Criar Meta</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {/* Opção 1: Meta de Patrimônio */}
              <div
                onClick={() => handleSelectType('patrimonio')}
                className="p-4 rounded-xl bg-[#0D121B] border border-[#212B3E] hover:border-slate-400 transition cursor-pointer flex items-start gap-4 group"
              >
                <div className="h-10 w-10 rounded-xl bg-[#1A2234] border border-[#2B3852] flex items-center justify-center text-slate-300 shrink-0 group-hover:text-white">
                  <PiggyBank className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                    Meta de Patrimônio
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Defina uma meta de patrimônio que melhor se alinhe com seu perfil de investimento e seus objetivos pessoais.
                  </p>
                </div>
              </div>

              {/* Opção 2: Meta de Ativos */}
              <div
                onClick={() => handleSelectType('ativos')}
                className="p-4 rounded-xl bg-[#0D121B] border border-[#212B3E] hover:border-slate-400 transition cursor-pointer flex items-start gap-4 group"
              >
                <div className="h-10 w-10 rounded-xl bg-[#1A2234] border border-[#2B3852] flex items-center justify-center text-slate-300 shrink-0 group-hover:text-white">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                    Meta de Ativos
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Estabeleça metas por tipos de ativos de acordo com seu perfil.
                  </p>
                </div>
              </div>

              {/* Opção 3: Meta de Proventos */}
              <div
                onClick={() => handleSelectType('proventos')}
                className="p-4 rounded-xl bg-[#0D121B] border border-[#212B3E] hover:border-slate-400 transition cursor-pointer flex items-start gap-4 group"
              >
                <div className="h-10 w-10 rounded-xl bg-[#1A2234] border border-[#2B3852] flex items-center justify-center text-slate-300 shrink-0 group-hover:text-white">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                    Meta de Proventos
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Estabeleça a média de proventos que deseja receber mensalmente por tipo de ativo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* PASSO 2: FORMULÁRIOS ESPECÍFICOS POR TIPO DE META                         */
          /* ========================================================================= */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Topo com Botão Voltar */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h3 className="text-base font-bold text-white">Criar Meta</h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* FORMULÁRIO 1: META DE PATRIMÔNIO (Idêntico à Imagem 2) */}
            {metaType === 'patrimonio' && (
              <div className="space-y-4">
                <span className="inline-block px-2.5 py-1 rounded-md bg-[#182232] text-[11px] font-bold text-slate-300 border border-[#27344D]">
                  Meta de Patrimônio
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Escolha uma categoria para sua meta
                    </label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full appearance-none bg-[#0D121B] border border-[#212B3E] rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-slate-400"
                      >
                        <option value="Total de patrimônio">Total de patrimônio</option>
                        <option value="Reserva de Emergência">Reserva de Emergência</option>
                        <option value="Liberdade Financeira">Liberdade Financeira</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Valor total</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="number"
                        step="100"
                        required
                        value={totalTarget}
                        onChange={(e) => setTotalTarget(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0D121B] border border-[#212B3E] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-300 mb-2">Como você planeja alcançar essa meta?</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Aporte mensal</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                        <input
                          type="number"
                          step="50"
                          value={monthlyDeposit}
                          onChange={(e) => setMonthlyDeposit(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#0D121B] border border-[#212B3E] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Estimativa de variação anual</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          value={annualVariation}
                          onChange={(e) => setAnnualVariation(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#0D121B] border border-[#212B3E] rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-slate-400"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FORMULÁRIO 2: META DE ATIVOS (Idêntico à Imagem 3) */}
            {metaType === 'ativos' && (
              <div className="space-y-4">
                <span className="inline-block px-2.5 py-1 rounded-md bg-[#182232] text-[11px] font-bold text-slate-300 border border-[#27344D]">
                  Meta de ativos
                </span>

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
                        <option value="ETFs Internacionais">ETFs Internacionais</option>
                        <option value="Criptomoedas">Criptomoedas</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ativo</label>
                    <div className="relative">
                      <select
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value)}
                        className="w-full appearance-none bg-[#0D121B] border border-[#212B3E] rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-slate-400"
                      >
                        <option value="">Selecionar</option>
                        <option value="PETR4">PETR4 - Petrobras</option>
                        <option value="VALE3">VALE3 - Vale</option>
                        <option value="ITUB4">ITUB4 - Itaú</option>
                        <option value="HGLG11">HGLG11 - CSHG Logística</option>
                        <option value="MXRF11">MXRF11 - Maxi Renda</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-300 mb-2">Como você planeja alcançar essa meta?</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Aporte mensal</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                        <input
                          type="number"
                          step="50"
                          value={monthlyDeposit}
                          onChange={(e) => setMonthlyDeposit(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#0D121B] border border-[#212B3E] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Estimativa de variação anual</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          value={annualVariation}
                          onChange={(e) => setAnnualVariation(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#0D121B] border border-[#212B3E] rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-slate-400"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Valor final da meta (R$)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="number"
                        step="100"
                        required
                        value={totalTarget}
                        onChange={(e) => setTotalTarget(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0D121B] border border-[#212B3E] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FORMULÁRIO 3: META DE PROVENTOS (Idêntico à Imagem 4) */}
            {metaType === 'proventos' && (
              <div className="space-y-4">
                <span className="inline-block px-2.5 py-1 rounded-md bg-[#182232] text-[11px] font-bold text-slate-300 border border-[#27344D]">
                  Meta de proventos
                </span>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Selecione os tipos de ativos
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAssetType('acoes')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                        selectedTypes.acoes
                          ? 'bg-[#1A2538] text-white border border-slate-400 shadow'
                          : 'bg-[#0D121B] text-slate-500 border border-white/5'
                      }`}
                    >
                      <span>💲 Ações</span>
                      {selectedTypes.acoes && <Check className="h-3.5 w-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleAssetType('fiis')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                        selectedTypes.fiis
                          ? 'bg-[#1A2538] text-white border border-slate-400 shadow'
                          : 'bg-[#0D121B] text-slate-500 border border-white/5'
                      }`}
                    >
                      <span>🏢 FIIs</span>
                      {selectedTypes.fiis && <Check className="h-3.5 w-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleAssetType('stocks')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                        selectedTypes.stocks
                          ? 'bg-[#1A2538] text-white border border-slate-400 shadow'
                          : 'bg-[#0D121B] text-slate-500 border border-white/5'
                      }`}
                    >
                      <span>🌎 Stocks</span>
                      {selectedTypes.stocks && <Check className="h-3.5 w-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleAssetType('bdrs')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                        selectedTypes.bdrs
                          ? 'bg-[#1A2538] text-white border border-slate-400 shadow'
                          : 'bg-[#0D121B] text-slate-500 border border-white/5'
                      }`}
                    >
                      <span>📑 BDRs</span>
                      {selectedTypes.bdrs && <Check className="h-3.5 w-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleAssetType('etfs')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                        selectedTypes.etfs
                          ? 'bg-[#1A2538] text-white border border-slate-400 shadow'
                          : 'bg-[#0D121B] text-slate-500 border border-white/5'
                      }`}
                    >
                      <span>🌐 ETFs Internacionais</span>
                      {selectedTypes.etfs && <Check className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Média de proventos que deseja receber mensalmente
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="50"
                      required
                      value={totalTarget}
                      onChange={(e) => setTotalTarget(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0D121B] border border-[#212B3E] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-slate-400"
                    />
                  </div>
                  <span className="block text-[11px] text-slate-500 mt-1">
                    ⓘ Consideramos a média de proventos recebidos nos últimos 12 meses.
                  </span>
                </div>
              </div>
            )}

            {/* Rodapé de Ações */}
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
                className="px-5 py-2.5 rounded-xl bg-[#1A2234] hover:bg-[#222C42] border border-[#2D3A54] text-xs font-bold text-white transition active:scale-95 shadow"
              >
                Criar Meta
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
