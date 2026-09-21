import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/features/auth/useAppStore';

interface SidebarProps {
  onOpenOpenFinance?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenOpenFinance }) => {
  const { setUser } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('partiu_jwt_token');
    localStorage.removeItem('partiu_last_user');
    setUser(null);
    navigate('/');
  };

  return (
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

      {/* Navegação Principal com Todos os Módulos Especializados */}
      <nav aria-label="Seções">
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {/* 1. Visão Geral */}
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
            >
              <svg className="ico" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
                <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
                <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
                <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
              </svg>
              <span className="md:max-xl:hidden">Visão geral</span>
            </NavLink>
          </li>

          {/* 2. Caixinhas */}
          <li>
            <NavLink
              to="/boxes"
              className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
            >
              <svg className="ico" viewBox="0 0 24 24">
                <path d="M3 8l9-5 9 5v9l-9 5-9-5z" />
                <path d="M3 8l9 5 9-5M12 13v9" />
              </svg>
              <span className="md:max-xl:hidden">Caixinhas</span>
            </NavLink>
          </li>

          {/* 3. Movimentações (Extrato / Fluxo) */}
          <li>
            <NavLink
              to="/transactions"
              className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
            >
              <svg className="ico" viewBox="0 0 24 24">
                <path d="M7 20V4M7 4L3.5 7.5M7 4l3.5 3.5M17 4v16M17 20l-3.5-3.5M17 20l3.5-3.5" />
              </svg>
              <span className="md:max-xl:hidden">Movimentações</span>
            </NavLink>
          </li>

          {/* 4. Contas Bancárias & Open Finance (Módulo Exclusivo) */}
          <li>
            <NavLink
              to="/accounts"
              className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
            >
              <svg className="ico" viewBox="0 0 24 24">
                <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4" />
              </svg>
              <span className="md:max-xl:hidden">Contas & Open Finance</span>
            </NavLink>
          </li>

          {/* 5. Família / Membros */}
          <li>
            <NavLink
              to="/family"
              className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
            >
              <svg className="ico" viewBox="0 0 24 24">
                <circle cx="9" cy="8" r="3.5" />
                <path d="M2.5 20c.5-4 3.3-6 6.5-6s6 2 6.5 6" />
                <circle cx="17" cy="9" r="2.5" />
                <path d="M17 14c2.5 0 4.2 1.6 4.5 5" />
              </svg>
              <span className="md:max-xl:hidden">Família / Membros</span>
            </NavLink>
          </li>

          {/* 6. Partiu Aprender */}
          <li>
            <NavLink
              to="/learning"
              className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
            >
              <svg className="ico" viewBox="0 0 24 24">
                <path d="M4 19.5V5a2 2 0 012-2h14v14H6a2 2 0 00-2 2.5z" />
                <path d="M8.5 7.5h7" />
              </svg>
              <span className="md:max-xl:hidden">Partiu aprender</span>
            </NavLink>
          </li>
        </ul>
      </nav>

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

      {/* Ações inferiores */}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        <li>
          <button
            type="button"
            onClick={onOpenOpenFinance}
            className="menu-link w-full text-left"
          >
            <svg className="ico" viewBox="0 0 24 24">
              <circle cx="16" cy="6" r="2" />
              <circle cx="8" cy="12" r="2" />
              <circle cx="14" cy="18" r="2" />
              <path d="M3 6h11M18 6h3M3 12h3M10 12h11M3 18h9M16 18h5" />
            </svg>
            <span className="md:max-xl:hidden">Open Finance</span>
          </button>
        </li>
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
  );
};
