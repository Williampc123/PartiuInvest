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
    <header className="flex-shrink-0 bg-white/85 backdrop-blur-md border-b border-navy/10 text-navy shadow-sm">
      {/* Topo: Logo, Seletor de Carteira e Ações Globais */}
      <div className="flex items-center justify-between px-6 py-2.5">
        {/* Lado Esquerdo: Logo & Carteira */}
        <div className="flex items-center gap-4">
          {/* Logo PartiuInvest oficial */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none group"
            onClick={() => onTabChange('resumo')}
          >
            <img
              src="/icone-partiu-invest.png"
              alt="PartiuInvest"
              className="h-7 w-7 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <div className="flex items-baseline">
              <span className="text-xl font-black tracking-tight text-navy">Partiu</span>
              <span className="text-xl font-black text-gold-deep">Invest</span>
            </div>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-navy/5 text-[10px] font-bold text-navy/70 border border-navy/10">
              Investimentos
            </span>
          </div>

          {/* Dropdown Carteira Padrão */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-navy/10 text-xs font-bold text-navy hover:border-navy/30 transition shadow-xs cursor-pointer">
            <span className="h-2 w-2 rounded-full bg-ok animate-pulse" />
            <span>Carteira Padrão</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted" />
          </div>

          <button
            type="button"
            className="p-1.5 rounded-xl text-muted hover:text-navy hover:bg-navy/5 transition"
            title="Configurações da Carteira"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Lado Direito: Ocultar Valores, Ajuda, Perfil e Fechar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleHideValues}
            className="p-2 text-muted hover:text-navy rounded-xl hover:bg-navy/5 border border-navy/10 transition"
            title={hideValues ? 'Mostrar Valores' : 'Ocultar Valores'}
          >
            {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>

          <button
            type="button"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-muted hover:text-navy hover:bg-navy/5 border border-navy/10 transition"
          >
            <HelpCircle className="h-3.5 w-3.5 text-muted" />
            <span>Ajuda</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-danger/10 hover:bg-danger/20 border border-danger/20 text-xs font-bold text-danger transition active:scale-95"
          >
            ✕ Fechar
          </button>
        </div>
      </div>

      {/* Faixa de Abas & Botões de Ação */}
      <div className="flex items-center justify-between px-6 pt-1 overflow-x-auto no-scrollbar gap-4 border-t border-navy/5 bg-navy/[0.015]">
        {/* Abas estilizadas no padrão PartiuInvest */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-navy text-white shadow-sm'
                    : 'text-muted hover:text-navy hover:bg-navy/5'
                }`}
              >
                {isActive && <Check className="h-3 w-3 text-gold" />}
                <span>{tab.label}</span>
                {tab.isProBadge && (
                  <span className="flex items-center gap-0.5 rounded-full bg-gold/20 text-gold-deep px-1.5 py-0.2 text-[9px] font-black border border-gold/30">
                    <Sparkles className="h-2 w-2" />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Botões do Topo Direito */}
        <div className="flex items-center gap-2 shrink-0 py-1">
          <button
            type="button"
            onClick={onOpenB3Integration}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-navy/5 border border-navy/15 text-xs font-bold text-navy transition shadow-xs active:scale-95"
          >
            <span className="font-black text-gold-deep text-xs">[B]³</span>
            <span>Integração B3</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl btn-gold text-xs font-bold transition active:scale-95 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Adicionar Lançamento</span>
          </button>
        </div>
      </div>
    </header>
  );
};
