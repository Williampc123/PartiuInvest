import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/features/auth/useAppStore';
import { formatPeriodLabel } from '@/core/dateUtils';
import { PeriodSelectorModal } from './PeriodSelectorModal';
import { Calendar, Menu, Sparkles, ChevronDown, Users, PieChart } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface HeaderProps {
  onOpenNewTransaction?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewTransaction,
  onToggleMobileMenu,
}) => {
  const {
    user,
    familyName,
    familyMembers,
    selectedMemberId,
    setSelectedMemberId,
    periodFilter,
    goToPreviousMonth,
    goToNextMonth,
    setIsInitialSetupOpen,
    setIsBudgetSetupOpen,
  } = useAppStore();

  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu de usuário ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAll = selectedMemberId === 'all';
  const currentMember = familyMembers.find((m) => m.id === selectedMemberId);

  const activeName = isAll
    ? familyName || `Família de ${user?.displayName?.split(' ')[0] || 'Silva'}`
    : currentMember?.name || currentMember?.displayName || 'Membro';

  const activeRoleLabel = isAll
    ? 'Visão Consolidada Familiar'
    : currentMember?.role === 'chefe-familia'
    ? 'Chefe de Família (Individual)'
    : currentMember?.role === 'conjuge'
    ? 'Cônjuge (Individual)'
    : 'Filho (Individual)';

  // Iniciais do usuário para o avatar
  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'PI';

  return (
    <header className="flex flex-col gap-3">
      {/* Linha 1: Boas-vindas, Hambúrguer e Ações Globais */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 md:gap-3.5">
        
        {/* Bloco de Saudação com Botão Hambúrguer Mobile */}
        <div className="flex items-center gap-2.5 mr-auto min-w-full sm:min-w-0 sm:flex-1">
          {/* Botão Hambúrguer (Visível exclusivamente no Mobile) */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Abrir menu de navegação"
            title="Abrir menu"
            className="round !h-10 !w-10 md:hidden shrink-0 shadow-sm border border-gold/40 hover:bg-gold/15 active:scale-95 transition"
          >
            <Menu className="h-5 w-5 text-navy" />
          </button>

          {/* Logo Mobile Compacta */}
          <NavLink to="/dashboard" className="md:hidden block shrink-0">
            <img src="/icone-partiu-invest.png" alt="Partiu Invest" className="h-8 w-auto" />
          </NavLink>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 id="hello" className="m-0 text-[1.35rem] sm:text-[1.55rem] font-extrabold leading-[1.15] tracking-[-.025em] md:text-[1.85rem] truncate">
                Bom dia, {user?.displayName?.split(' ')[0] || 'Investidor'}
              </h1>
              {user?.role === 'chefe-familia' && (
                <span className="pill bg-gold/25 text-[#7A4F08] border border-gold/40 text-[10px] sm:text-[11px] font-bold">
                  👑 Chefe
                </span>
              )}
            </div>
            <p className="mb-0 mt-0.5 text-xs sm:text-sm text-muted truncate">
              Exibindo: <strong className="text-navy">{activeName}</strong> ({activeRoleLabel})
            </p>
          </div>
        </div>


        {/* Seletor de Período Interativo */}
        <div role="group" aria-label="Período" className="glass order-3 flex h-11 items-center gap-1 rounded-[14px] p-1 md:order-none shadow-sm">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="icon-btn hover:text-navy active:scale-95 transition"
            title="Mês anterior"
            aria-label="Mês anterior"
          >
            <svg className="ico !h-[18px] !w-[18px]" viewBox="0 0 24 24">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setIsPeriodModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl hover:bg-navy/5 active:scale-95 transition text-left group"
            title="Clique para escolher mês, atalho ou período personalizado"
          >
            <Calendar className="h-4 w-4 text-gold-deep shrink-0 group-hover:scale-110 transition" />
            <b className="min-w-[110px] text-center font-bold text-sm text-navy truncate select-none">
              {formatPeriodLabel(periodFilter)}
            </b>
          </button>

          <button
            type="button"
            onClick={goToNextMonth}
            className="icon-btn hover:text-navy active:scale-95 transition"
            title="Próximo mês"
            aria-label="Próximo mês"
          >
            <svg className="ico !h-[18px] !w-[18px]" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Botão de Busca */}
        <button type="button" className="round" aria-label="Buscar">
          <svg className="ico" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
        </button>

        {/* Botão de Notificações */}
        <button type="button" className="round" aria-label="Notificações, 1 nova">
          <svg className="ico" viewBox="0 0 24 24">
            <path d="M6 16v-5a6 6 0 1112 0v5l1.5 2h-15z" />
            <path d="M10 21h4" />
          </svg>
          <span className="absolute right-3 top-[11px] h-[9px] w-[9px] rounded-full border-2 border-white bg-gold" />
        </button>

        {/* Card do Usuário com Menu Dropdown (Hover Desktop + Touch/Click Mobile) */}
        <div
          ref={userMenuRef}
          onMouseEnter={() => setIsUserMenuOpen(true)}
          onMouseLeave={() => setIsUserMenuOpen(false)}
          className="relative"
        >
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            aria-expanded={isUserMenuOpen}
            aria-label="Menu do usuário"
            title="Clique ou passe o mouse para abrir as configurações"
            className={`glass flex h-11 items-center gap-2 rounded-2xl p-1 lg:pr-3 transition cursor-pointer select-none text-left border ${
              isUserMenuOpen
                ? 'border-gold bg-white shadow-md ring-2 ring-gold/40'
                : 'border-white/80 hover:bg-white/90 hover:border-gold/50'
            }`}
          >
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-light to-[#E2A11B] text-[.85rem] font-extrabold text-navy-deep shadow-sm"
            >
              {initials}
            </span>
            <div className="hidden lg:block min-w-0 pr-1">
              <b className="block text-[.9rem] leading-[1.1] truncate max-w-[130px]">
                {user?.displayName || 'Investidor'}
              </b>
              <small className="block text-[.74rem] leading-tight text-muted">
                {user?.role === 'chefe-familia' ? 'Chefe de Família' : 'Membro'}
              </small>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 text-navy/50 transition-transform duration-200 hidden lg:block shrink-0 ${
                isUserMenuOpen ? 'rotate-180 text-gold-deep' : ''
              }`}
            />
          </button>

          {/* Menu Dropdown */}
          {isUserMenuOpen && (
            <div
              className="absolute right-0 top-full mt-0.5 w-64 rounded-2xl bg-white/95 border border-white/90 shadow-[0_20px_45px_-12px_rgba(10,31,68,.3)] backdrop-blur-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 before:content-[''] before:absolute before:-top-3 before:inset-x-0 before:h-3"
            >
              {/* Header do Menu com Nome e Papel */}
              <div className="p-2 pb-2.5 mb-1.5 border-b border-navy/10 flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-light to-[#E2A11B] text-xs font-black text-navy-deep shadow-sm">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="block text-xs font-bold text-navy truncate">
                    {user?.displayName || 'Investidor'}
                  </strong>
                  <span className="pill bg-gold/20 text-gold-deep text-[10px] font-bold py-0.5 px-2 mt-0.5 inline-block">
                    {user?.role === 'chefe-familia' ? '👑 Chefe de Família' : 'Membro'}
                  </span>
                </div>
              </div>

              {/* Ações do Menu */}
              <div className="space-y-1">
                {/* Botão de Configuração Inicial */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsInitialSetupOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left text-xs font-bold text-navy bg-gradient-to-r from-gold/15 to-gold/5 hover:from-gold/25 hover:to-gold/15 transition border border-gold/35 group shadow-sm active:scale-[0.98]"
                >
                  <div className="h-7 w-7 rounded-lg bg-gold/30 flex items-center justify-center text-gold-deep group-hover:scale-110 transition shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block leading-tight text-navy-deep font-black">
                      Configuração Inicial
                    </span>
                    <span className="block text-[10px] text-muted font-normal truncate">
                      Família & Rendas Mensais
                    </span>
                  </div>
                </button>

                {/* Botão de Separação de Orçamento */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsBudgetSetupOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left text-xs font-bold text-navy bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 hover:from-emerald-500/25 hover:to-emerald-500/15 transition border border-emerald-500/35 group shadow-sm active:scale-[0.98]"
                >
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition shrink-0">
                    <PieChart className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block leading-tight text-navy-deep font-black">
                      Separação de Orçamento
                    </span>
                    <span className="block text-[10px] text-muted font-normal truncate">
                      Planejamento Mês a Mês (% e R$)
                    </span>
                  </div>
                </button>

                {/* Atalho para Gestão da Família */}
                <NavLink
                  to="/family"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-navy hover:bg-navy/5 transition"
                >
                  <Users className="h-4 w-4 text-navy-soft shrink-0" />
                  <span className="truncate">Minha Família / Membros</span>
                </NavLink>
              </div>
            </div>
          )}
        </div>

        {/* Botão de Nova Movimentação */}
        <button
          type="button"
          onClick={onOpenNewTransaction}
          className="btn-gold order-4 ml-auto md:order-none md:ml-0"
        >
          <svg className="ico" style={{ strokeWidth: 2.6 }} viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Nova movimentação</span>
        </button>
      </div>

      {/* Linha 2: Barra Seletora de Membros da Família */}
      {user?.role === 'chefe-familia' && familyMembers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white/80 border border-white shadow-sm backdrop-blur-md">
          <span className="text-xs font-bold text-navy px-2 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gold" />
            Filtrar Visão:
          </span>

          <button
            type="button"
            onClick={() => setSelectedMemberId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedMemberId === 'all'
                ? 'bg-navy text-white shadow-md'
                : 'text-navy hover:bg-navy/5'
            }`}
          >
            <span>👨‍👩‍👧‍👦 Toda a Família</span>
            <span className="text-[10px] opacity-75">(Consolidado)</span>
          </button>

          {familyMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => setSelectedMemberId(member.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                selectedMemberId === member.id
                  ? 'bg-gradient-to-r from-gold-light to-gold text-navy-deep font-bold shadow-md'
                  : 'text-muted hover:text-navy hover:bg-navy/5'
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: member.color || '#F5B82E' }}
              />
              <span>{member.displayName}</span>
              <span className="text-[10px] opacity-75">
                ({member.role === 'chefe-familia' ? 'Chefe' : member.role === 'conjuge' ? 'Cônjuge' : 'Filho'})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Modal de Seleção de Período (Mês / Atalhos / Personalizado) */}
      <PeriodSelectorModal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
      />
    </header>
  );
};
