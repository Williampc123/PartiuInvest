import React, { useState } from 'react';
import { useAppStore } from '@/features/auth/useAppStore';
import { formatPeriodLabel } from '@/core/dateUtils';
import { PeriodSelectorModal } from './PeriodSelectorModal';
import { Calendar } from 'lucide-react';

interface HeaderProps {
  onOpenNewTransaction?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewTransaction }) => {
  const {
    user,
    familyName,
    familyMembers,
    selectedMemberId,
    setSelectedMemberId,
    periodFilter,
    goToPreviousMonth,
    goToNextMonth,
  } = useAppStore();

  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);

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
      {/* Linha 1: Boas-vindas e Ações Globais */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 md:gap-3.5">
        <div className="mr-auto min-w-full sm:min-w-[220px]">
          <div className="flex items-center gap-2">
            <h1 id="hello" className="m-0 text-[1.55rem] font-extrabold leading-[1.15] tracking-[-.025em] md:text-[1.85rem]">
              Bom dia, {user?.displayName?.split(' ')[0] || 'Investidor'}
            </h1>
            {user?.role === 'chefe-familia' && (
              <span className="pill bg-gold/25 text-[#7A4F08] border border-gold/40 text-[11px] font-bold">
                👑 Painel do Chefe
              </span>
            )}
          </div>
          <p className="mb-0 mt-0.5 text-muted">
            Exibindo: <strong className="text-navy">{activeName}</strong> ({activeRoleLabel})
          </p>
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

        {/* Card do Usuário */}
        <div className="glass flex h-11 items-center gap-2.5 rounded-2xl p-1 lg:pr-3.5">
          <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-gold-light to-[#E2A11B] text-[.85rem] font-extrabold text-navy-deep">
            {initials}
          </span>
          <div className="hidden lg:block">
            <b className="block text-[.9rem] leading-[1.1]">{user?.displayName || 'Investidor'}</b>
            <small className="block text-[.74rem] leading-tight text-muted">
              {user?.role === 'chefe-familia' ? 'Chefe de Família' : 'Membro'}
            </small>
          </div>
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
