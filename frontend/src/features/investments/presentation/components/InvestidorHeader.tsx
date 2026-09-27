import React, { useState } from 'react';
import { Eye, EyeOff, HelpCircle, Menu, Settings, Plus, Sparkles, ChevronDown, Check } from 'lucide-react';

interface InvestidorHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenNewTransaction: () => void;
  onOpenB3Integration: () => void;
  onClose: () => void;
  hideValues: boolean;
  onToggleHideValues: () => void;
}

export const InvestidorHeader: React.FC<InvestidorHeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenNewTransaction,
  onOpenB3Integration,
  onClose,
  hideValues,
  onToggleHideValues,
}) => {
  const tabs = [
    { id: 'resumo', label: 'Resumo', icon: 'check' },
    { id: 'posicoes', label: 'Posições', icon: 'layout-grid' },
    { id: 'proventos', label: 'Proventos', icon: 'file-text' },
    { id: 'patrimonio', label: 'Patrimônio', icon: 'pie-chart' },
    { id: 'rentabilidade', label: 'Rentabilidade', icon: 'trending-up' },
    { id: 'analise', label: 'Análise', icon: 'clipboard-list' },
    { id: 'lancamentos', label: 'Lançamentos', icon: 'edit' },
    { id: 'darfs', label: 'DARFs', icon: 'file' },
    { id: 'irpf', label: 'IRPF', icon: 'award' },
    { id: 'metas', label: 'Metas', icon: 'target' },
    { id: 'pro', label: 'PRO', icon: 'star', isProBadge: true },
  ];

  return (
    <header className="flex-shrink-0 bg-[#0F141C] border-b border-[#1E2638] text-white">
      {/* Topo: Logo, Seletor de Carteira e Ações Globais */}
      <div className="flex items-center justify-between px-6 py-2.5">
        {/* Lado Esquerdo: Logo & Carteira */}
        <div className="flex items-center gap-5">
          {/* Logo Investidor10 estilizado */}
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onTabChange('resumo')}>
            <span className="text-xl font-black tracking-tight text-white">Investidor</span>
            <span className="text-xl font-black text-amber-400">10</span>
          </div>

          {/* Dropdown Carteira Padrão */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161D2B] border border-[#232E44] text-xs font-semibold text-slate-200 hover:border-slate-500 transition cursor-pointer">
            <span>Carteira Padrão</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>

          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1A2234] transition"
            title="Configurações da Carteira"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Lado Direito: Ocultar Valores, Ajuda, Perfil e Fechar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleHideValues}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#1A2234] transition"
            title={hideValues ? 'Mostrar Valores' : 'Ocultar Valores'}
          >
            {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>

          <button
            type="button"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#1A2234] transition"
          >
            <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
            <span>Ajuda</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-[#1F293D] hover:bg-rose-900/40 text-xs font-bold text-slate-300 hover:text-rose-400 transition"
          >
            ✕ Fechar
          </button>
        </div>
      </div>

      {/* Faixa de Abas & Botões de Ação */}
      <div className="flex items-center justify-between px-6 pt-1 overflow-x-auto no-scrollbar gap-4">
        {/* Abas idênticas ao Investidor10 */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition border-b-2 relative ${
                  isActive
                    ? 'border-white text-white font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && <Check className="h-3 w-3 text-emerald-400" />}
                <span>{tab.label}</span>
                {tab.isProBadge && (
                  <span className="flex items-center gap-0.5 rounded bg-amber-400/20 text-amber-300 px-1 py-0.2 text-[9px] font-black border border-amber-400/30">
                    <Sparkles className="h-2 w-2" />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Botões do Topo Direito */}
        <div className="flex items-center gap-2.5 shrink-0 pb-1.5">
          <button
            type="button"
            onClick={onOpenB3Integration}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161D2B] hover:bg-[#1E273A] border border-[#27344D] text-xs font-semibold text-slate-200 transition"
          >
            <span className="font-black text-amber-400 text-xs">[B]³</span>
            <span>Integração B3</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1A2234] hover:bg-[#232E44] border border-[#2E3C56] text-xs font-bold text-white transition active:scale-95 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 text-slate-300" />
            <span>Adicionar Lançamento</span>
          </button>
        </div>
      </div>
    </header>
  );
};
