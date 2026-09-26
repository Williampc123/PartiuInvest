import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/features/auth/useAppStore';
import { auth } from '@/infrastructure/firebase/firebase';
import { signOut } from 'firebase/auth';
import { X, LogOut, Sparkles, PieChart } from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenOpenFinance?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  onOpenOpenFinance,
}) => {
  const { user, setUser, setIsInitialSetupOpen, setIsBudgetSetupOpen } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {}
    localStorage.removeItem('partiu_jwt_token');
    localStorage.removeItem('partiu_last_user');
    setUser(null);
    onClose?.();
    navigate('/');
  };

  const handleNavClick = () => {
    onClose?.();
  };

  const renderNavLinks = (isMobile = false) => (
    <nav aria-label="Seções">
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {/* 1. Visão Geral */}
        <li>
          <NavLink
            to="/dashboard"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `menu-link ${isActive ? 'active' : ''} ${isMobile ? '!justify-start !px-3.5' : ''}`
            }
          >
            <svg className="ico" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
              <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
              <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
              <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
            </svg>
            <span className={isMobile ? 'inline' : 'md:max-xl:hidden'}>Visão geral</span>
          </NavLink>
        </li>

        {/* 2. Caixinhas */}
        <li>
          <NavLink
            to="/boxes"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `menu-link ${isActive ? 'active' : ''} ${isMobile ? '!justify-start !px-3.5' : ''}`
            }
          >
            <svg className="ico" viewBox="0 0 24 24">
              <path d="M3 8l9-5 9 5v9l-9 5-9-5z" />
              <path d="M3 8l9 5 9-5M12 13v9" />
            </svg>
            <span className={isMobile ? 'inline' : 'md:max-xl:hidden'}>Caixinhas</span>
          </NavLink>
        </li>

        {/* 3. Movimentações (Extrato / Fluxo) */}
        <li>
          <NavLink
            to="/transactions"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `menu-link ${isActive ? 'active' : ''} ${isMobile ? '!justify-start !px-3.5' : ''}`
            }
          >
            <svg className="ico" viewBox="0 0 24 24">
              <path d="M7 20V4M7 4L3.5 7.5M7 4l3.5 3.5M17 4v16M17 20l-3.5-3.5M17 20l3.5-3.5" />
            </svg>
            <span className={isMobile ? 'inline' : 'md:max-xl:hidden'}>Movimentações</span>
          </NavLink>
        </li>

        {/* 4. Categorias Financeiras */}
        <li>
          <NavLink
            to="/categories"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `menu-link ${isActive ? 'active' : ''} ${isMobile ? '!justify-start !px-3.5' : ''}`
            }
          >
            <svg className="ico" viewBox="0 0 24 24">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            <span className={isMobile ? 'inline' : 'md:max-xl:hidden'}>Categorias</span>
          </NavLink>
        </li>

        {/* 5. Contas Bancárias */}
        <li>
          <NavLink
            to="/accounts"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `menu-link ${isActive ? 'active' : ''} ${isMobile ? '!justify-start !px-3.5' : ''}`
            }
          >
            <svg className="ico" viewBox="0 0 24 24">
              <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4" />
            </svg>
            <span className={isMobile ? 'inline' : 'md:max-xl:hidden'}>Contas Bancárias</span>
          </NavLink>
        </li>

        {/* 6. Família / Membros */}
        <li>
          <NavLink
            to="/family"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `menu-link ${isActive ? 'active' : ''} ${isMobile ? '!justify-start !px-3.5' : ''}`
            }
          >
            <svg className="ico" viewBox="0 0 24 24">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20c.5-4 3.3-6 6.5-6s6 2 6.5 6" />
              <circle cx="17" cy="9" r="2.5" />
              <path d="M17 14c2.5 0 4.2 1.6 4.5 5" />
            </svg>
            <span className={isMobile ? 'inline' : 'md:max-xl:hidden'}>Família / Membros</span>
          </NavLink>
        </li>

        {/* 7. Partiu Aprender */}
        <li>
          <NavLink
            to="/learning"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `menu-link ${isActive ? 'active' : ''} ${isMobile ? '!justify-start !px-3.5' : ''}`
            }
          >
            <svg className="ico" viewBox="0 0 24 24">
              <path d="M4 19.5V5a2 2 0 012-2h14v14H6a2 2 0 00-2 2.5z" />
              <path d="M8.5 7.5h7" />
            </svg>
            <span className={isMobile ? 'inline' : 'md:max-xl:hidden'}>Partiu aprender</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );

  return (
    <>
      {/* ========================================================= */}
      {/* 1. DRAWER MOBILE OVERLAY (Visível apenas quando aberto)   */}
      {/* ========================================================= */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Blur com Fade In */}
          <div
            className="fixed inset-0 bg-navy-deep/60 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Painel do Drawer */}
          <div className="relative z-10 flex h-full w-[290px] max-w-[85vw] flex-col justify-between overflow-y-auto bg-white/95 p-5 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-left duration-300 border-r border-white/80">
            {/* Topo do Drawer: Logo & Botão Fechar */}
            <div className="flex items-center justify-between pb-4 border-b border-navy/10">
              <NavLink to="/dashboard" onClick={handleNavClick} className="block focus-visible:outline-none">
                <img src="/logo-partiu-invest.png" alt="Partiu Invest" className="h-7 w-auto" />
              </NavLink>

              <button
                type="button"
                onClick={onClose}
                className="icon-btn text-muted hover:text-navy hover:bg-navy/5 -mr-1"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Informações do Usuário no Drawer Mobile */}
            <div className="my-3 space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-gold/15 to-gold/5 border border-gold/30">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-light to-[#E2A11B] text-xs font-black text-navy-deep shadow-sm">
                  {user?.displayName
                    ? user.displayName
                        .split(' ')
                        .map((w: string) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'PI'}
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block text-sm font-bold text-navy truncate">{user?.displayName || 'Investidor'}</b>
                  <span className="pill bg-gold/25 text-[#7A4F08] text-[10px] py-0 px-2 font-bold">
                    {user?.role === 'chefe-familia' ? '👑 Chefe de Família' : 'Membro'}
                  </span>
                </div>
              </div>

              {/* Botão de Configuração Inicial no Mobile */}
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  setIsInitialSetupOpen(true);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white border border-gold/40 text-left text-xs font-bold text-navy hover:bg-gold/10 transition shadow-sm active:scale-[0.98]"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-gold/20 flex items-center justify-center text-gold-deep">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <span>Configuração Inicial</span>
                </div>
                <span className="text-[10px] text-gold-deep font-extrabold uppercase tracking-wide">Abrir</span>
              </button>

              {/* Botão de Separação de Orçamento no Mobile */}
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  setIsBudgetSetupOpen(true);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-500/40 text-left text-xs font-bold text-navy hover:bg-emerald-50 transition shadow-sm active:scale-[0.98]"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-700">
                    <PieChart className="h-3.5 w-3.5" />
                  </div>
                  <span>Separação de Orçamento</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wide">Abrir</span>
              </button>
            </div>

            {/* Navegação Principal no Mobile */}
            <div className="flex-1 py-2">
              {renderNavLinks(true)}
            </div>

            {/* Card Aula Rápida Mobile */}
            <div className="relative my-3 overflow-hidden rounded-[20px] bg-gradient-to-br from-navy-soft to-navy p-3.5 text-white shadow-md">
              <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(245,184,46,.65),transparent_68%)]" />
              <small className="relative block text-[11px] text-[#C3CCE0]">Aula rápida · 6 min</small>
              <b className="relative mb-2 mt-0.5 block text-xs leading-tight">Para onde vai seu dinheiro?</b>
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  navigate('/learning');
                }}
                className="relative h-8 cursor-pointer rounded-lg border border-white/40 bg-white/20 px-3 text-[11px] font-bold text-white hover:bg-white/30"
              >
                Partiu aprender
              </button>
            </div>

            {/* Botão Sair Mobile */}
            <div className="pt-3 border-t border-navy/10">
              <button
                type="button"
                onClick={handleLogout}
                className="menu-link !justify-start !px-3.5 w-full text-left text-danger hover:bg-danger/10 hover:text-danger font-bold"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. ASIDE DESKTOP (Fixado / Sticky a partir de telas md)   */}
      {/* ========================================================= */}
      <aside
        aria-label="Menu principal"
        className="glass sticky top-5 hidden min-h-[calc(100vh-68px)] flex-col gap-[22px] self-start rounded-[28px] px-2.5 pb-3.5 pt-[18px] md:flex xl:px-3.5 xl:pt-[22px]"
      >
        {/* Logo Responsiva */}
        <div className="xl:px-2.5">
          <NavLink to="/dashboard" className="block focus-visible:outline-none">
            <img src="/logo-partiu-invest.png" alt="Partiu Invest" className="hidden h-auto w-[170px] xl:block" />
            <img src="/icone-partiu-invest.png" alt="Partiu Invest" className="mx-auto block h-auto w-[38px] xl:hidden" />
          </NavLink>
        </div>

        {/* Navegação Principal Desktop */}
        {renderNavLinks(false)}

        <div className="flex-1" />

        {/* Card Aula rápida */}
        <div className="relative hidden overflow-hidden rounded-[22px] bg-gradient-to-br from-navy-soft to-navy p-4 text-white shadow-[0_18px_30px_-18px_rgba(10,31,68,.7)] xl:block">
          <div className="pointer-events-none absolute -right-8 -top-8 h-[110px] w-[110px] rounded-full bg-[radial-gradient(circle,rgba(245,184,46,.65),transparent_68%)]" />
          <small className="relative block text-[.78rem] text-[#C3CCE0]">Aula rápida · 6 min</small>
          <b className="relative mb-3 mt-1 block text-base leading-tight">Para onde está indo o seu dinheiro?</b>
          <button
            type="button"
            onClick={() => navigate('/learning')}
            className="relative h-9 cursor-pointer rounded-xl border border-white/40 bg-white/20 px-3.5 text-[.86rem] font-bold text-white hover:bg-white/30 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Partiu aprender
          </button>
        </div>

        {/* Ações inferiores Desktop */}
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          <li>
            <button
              type="button"
              onClick={handleLogout}
              className="menu-link w-full text-left hover:text-danger"
            >
              <svg className="ico" viewBox="0 0 24 24">
                <path d="M9 4H5a2 2 0 00-2 2v12a2 2 0 002 2h4" />
                <path d="M16 8l4 4-4 4M20 12H9" />
              </svg>
              <span className="md:max-xl:hidden">Sair</span>
            </button>
          </li>
        </ul>
      </aside>
    </>
  );
};

