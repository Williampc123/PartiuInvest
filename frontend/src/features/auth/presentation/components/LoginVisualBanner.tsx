import React from 'react';

export const LoginVisualBanner: React.FC = () => {
  return (
    <section
      aria-label="Partiu Invest"
      className="relative isolate flex flex-col overflow-hidden rounded-[24px] bg-[linear-gradient(170deg,#A9C2F2_0%,#CFDDF9_38%,#EEF3FF_72%,#FFF5D6_100%)] text-navy shadow-[inset_0_1px_0_rgba(255,255,255,.9)] lg:rounded-[30px] p-6 lg:p-10 justify-between"
    >
      {/* Manchas de luz */}
      <div className="absolute -right-[22%] -top-[8%] -z-10 aspect-square w-[78%] rounded-full bg-[radial-gradient(circle,rgba(245,184,46,.7),rgba(245,184,46,0)_68%)] blur-[46px]" />
      <div className="absolute -bottom-[24%] -left-[32%] -z-10 aspect-square w-[90%] rounded-full bg-[radial-gradient(circle,rgba(110,150,250,.55),rgba(110,150,250,0)_68%)] blur-[46px]" />

      {/* Título grande estilizado */}
      <div className="relative z-10">
        <h1 className="text-4xl lg:text-6xl font-extrabold tracking-[-0.045em] leading-[0.9]">
          <span className="block text-navy">Partiu</span>
          <span className="block bg-[linear-gradient(180deg,#F9C63D_0%,#E9A511_55%,#A87008_100%)] bg-clip-text pb-1 text-transparent">
            Invest
          </span>
        </h1>
        <p className="mt-4 text-base lg:text-lg font-medium text-navy-soft max-w-sm">
          Seu dinheiro também tem um destino. Planejamento financeiro completo para você e sua família.
        </p>
      </div>

      {/* Arte SVG Moedas de Ouro Flutuantes */}
      <div className="relative z-20 my-4 flex justify-center animate-float">
        <svg viewBox="0 0 520 320" className="block h-auto w-full max-w-[380px] overflow-visible" focusable="false">
          <defs>
            <linearGradient id="face" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFF1A8" />
              <stop offset="0.35" stopColor="#F8C63C" />
              <stop offset="0.7" stopColor="#E2A11B" />
              <stop offset="1" stopColor="#A8730E" />
            </linearGradient>
            <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#C58A12" />
              <stop offset="1" stopColor="#6E4506" />
            </linearGradient>
            <radialGradient id="inner" cx="0.35" cy="0.3" r="0.95">
              <stop offset="0" stopColor="#FFE27A" />
              <stop offset="0.6" stopColor="#F2B32A" />
              <stop offset="1" stopColor="#C8890F" />
            </radialGradient>
          </defs>
          <g transform="translate(180, 160)">
            {/* Moeda Base */}
            <ellipse cx="0" cy="18" rx="110" ry="42" fill="url(#edge)" opacity="0.6" />
            <ellipse cx="0" cy="0" rx="110" ry="42" fill="url(#face)" stroke="#FFE27A" strokeWidth="3" />
            <ellipse cx="0" cy="0" rx="88" ry="32" fill="url(#inner)" stroke="#C58A12" strokeWidth="1.5" />
            <text x="0" y="8" textAnchor="middle" fill="#7A4F08" fontSize="28" fontWeight="800" fontFamily="Outfit">
              R$
            </text>
          </g>
          {/* Moeda Flutuante Superior */}
          <g transform="translate(320, 80) rotate(-15)">
            <ellipse cx="0" cy="12" rx="70" ry="26" fill="url(#edge)" opacity="0.6" />
            <ellipse cx="0" cy="0" rx="70" ry="26" fill="url(#face)" stroke="#FFE27A" strokeWidth="2" />
            <ellipse cx="0" cy="0" rx="54" ry="20" fill="url(#inner)" />
            <text x="0" y="6" textAnchor="middle" fill="#7A4F08" fontSize="18" fontWeight="800" fontFamily="Outfit">
              ★
            </text>
          </g>
        </svg>
      </div>

      {/* Cartão de Destaque Familiar */}
      <div className="relative z-10 rounded-2xl bg-white/70 p-4 border border-white/80 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/20 text-gold-deep font-bold">
            👨‍👩‍👧‍👦
          </div>
          <div>
            <p className="text-sm font-bold text-navy">Divisão Familiar Segura</p>
            <p className="text-xs text-muted">Contas individuais e visão conjunta para toda a família</p>
          </div>
        </div>
      </div>
    </section>
  );
};
