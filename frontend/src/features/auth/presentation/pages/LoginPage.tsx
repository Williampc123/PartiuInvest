import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../useAppStore';
import {
  registerFamilyAndHead,
  loginUser,
  loginWithGoogle,
  getFirebaseErrorMessage,
} from '@/features/auth/infrastructure/firebaseAuthService';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setFamilyMembers, setBoxes, setAccounts, setIsOffline } = useAppStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailErr, setEmailErr] = useState('');
  const [senhaErr, setSenhaErr] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const validateEmail = (v: string) => {
    if (!v.trim()) return 'Digite seu e-mail para entrar.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      return 'Digite um e-mail válido, como nome@email.com.';
    }
    return '';
  };

  const validateSenha = (v: string) => {
    if (!v) return 'Digite sua senha.';
    if (v.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
    return '';
  };

  const validateName = (v: string) => {
    if (mode === 'register' && !v.trim()) return 'Digite seu nome completo.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

    const eErr = validateEmail(email);
    const sErr = validateSenha(senha);
    const nErr = validateName(name);

    setEmailErr(eErr);
    setSenhaErr(sErr);
    setNameErr(nErr);

    if (eErr || sErr || nErr) return;

    setLoading(true);

    try {
      if (mode === 'register') {
        setStatusMsg('Criando conta e configurando família no Firebase...');
        const result = await registerFamilyAndHead({
          name,
          email: email.trim(),
          password: senha,
          familyName: familyName.trim() || `Família ${name.trim().split(' ').slice(-1)[0] || 'Silva'}`,
        });

        setUser(result.user);
        setFamilyMembers(result.familyMembers);
        setBoxes(result.boxes);
        setAccounts(result.accounts);
        setIsOffline(false);

        setStatusMsg('Conta criada com sucesso! Acessando painel...');
        setTimeout(() => navigate('/dashboard'), 500);
      } else {
        setStatusMsg('Validando credenciais com o Firebase...');
        const result = await loginUser(email.trim(), senha);

        setUser(result.user);
        if (result.familyMembers.length > 0) setFamilyMembers(result.familyMembers);
        if (result.boxes.length > 0) setBoxes(result.boxes);
        if (result.accounts.length > 0) setAccounts(result.accounts);
        setIsOffline(false);

        setStatusMsg('Login efetuado com sucesso! Redirecionando...');
        setTimeout(() => navigate('/dashboard'), 400);
      }
    } catch (err: any) {
      console.error('Erro de autenticação Firebase:', err);
      setErrorMsg(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setStatusMsg('Conectando ao Google...');
    setLoading(true);

    try {
      const result = await loginWithGoogle();
      setUser(result.user);
      if (result.familyMembers.length > 0) setFamilyMembers(result.familyMembers);
      if (result.boxes.length > 0) setBoxes(result.boxes);
      if (result.accounts.length > 0) setAccounts(result.accounts);
      setIsOffline(false);

      setStatusMsg('Login com Google concluído! Abrindo painel...');
      setTimeout(() => navigate('/dashboard'), 400);
    } catch (err: any) {
      console.error('Erro Auth Google:', err);
      setErrorMsg(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full p-3 font-sans text-[16px] leading-normal text-navy antialiased lg:p-6 [color-scheme:light]">
      {/* Moldura de vidro */}
      <div className="mx-auto grid max-w-[1200px] gap-3 rounded-[32px] border border-white/75 bg-white/70 p-3 shadow-[0_40px_80px_-40px_rgba(10,31,68,.28),inset_0_1px_0_rgba(255,255,255,.95)] backdrop-blur-[30px] backdrop-saturate-150 lg:min-h-[min(780px,calc(100vh-48px))] lg:grid-cols-[1.08fr_1fr] lg:rounded-[40px]">
        
        {/* Painel visual com as Moedas em SVG */}
        <section
          aria-label="Partiu Invest"
          className="relative isolate flex flex-col overflow-hidden rounded-[24px] bg-[linear-gradient(170deg,#A9C2F2_0%,#CFDDF9_38%,#EEF3FF_72%,#FFF5D6_100%)] text-navy shadow-[inset_0_1px_0_rgba(255,255,255,.9)] [container-type:inline-size] lg:rounded-[30px]"
        >
          {/* manchas de luz */}
          <div className="absolute -right-[22%] -top-[8%] -z-10 aspect-square w-[78%] rounded-full bg-[radial-gradient(circle,rgba(245,184,46,.7),rgba(245,184,46,0)_68%)] blur-[46px]" />
          <div className="absolute -bottom-[24%] -left-[32%] -z-10 aspect-square w-[90%] rounded-full bg-[radial-gradient(circle,rgba(110,150,250,.55),rgba(110,150,250,0)_68%)] blur-[46px]" />

          {/* título grande */}
          <p
            aria-hidden="true"
            className="relative z-10 m-0 px-[8cqw] pt-[7cqw] text-[21cqw] font-extrabold leading-[.88] tracking-[-.045em]"
          >
            <span className="block text-navy">Partiu</span>
            <span className="block bg-[linear-gradient(180deg,#F9C63D_0%,#E9A511_55%,#A87008_100%)] bg-clip-text pb-[.04em] text-transparent">
              Invest
            </span>
          </p>

          {/* arte: moedas de ouro idêntica ao modelo */}
          <div aria-hidden="true" className="relative z-20 -mt-[11cqw]">
            <svg viewBox="0 0 520 360" className="block h-auto w-full overflow-visible" focusable="false">
              <defs>
                <linearGradient id="face" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#FFF1A8" />
                  <stop offset=".35" stopColor="#F8C63C" />
                  <stop offset=".7" stopColor="#E2A11B" />
                  <stop offset="1" stopColor="#A8730E" />
                </linearGradient>
                <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#C58A12" />
                  <stop offset="1" stopColor="#6E4506" />
                </linearGradient>
                <linearGradient id="rim" x1="1" y1="1" x2="0" y2="0">
                  <stop offset="0" stopColor="#A8730E" />
                  <stop offset="1" stopColor="#FFE27A" />
                </linearGradient>
                <radialGradient id="inner" cx=".35" cy=".3" r=".95">
                  <stop offset="0" stopColor="#FFE27A" />
                  <stop offset=".6" stopColor="#F2B32A" />
                  <stop offset="1" stopColor="#C8890F" />
                </radialGradient>
                <linearGradient id="arrowDark" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#7A4F08" />
                  <stop offset="1" stopColor="#C08411" />
                </linearGradient>
                <linearGradient id="hl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity=".8" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="glow">
                  <stop offset="0" stopColor="#FFD65A" stopOpacity=".4" />
                  <stop offset="1" stopColor="#FFD65A" stopOpacity="0" />
                </radialGradient>
                <clipPath id="clipface"><circle r="138" /></clipPath>
                <filter id="b2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2" /></filter>
                <filter id="b5" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4.5" /></filter>
                <path id="sparkle" d="M0,-10 C1,-3 3,-1 10,0 C3,1 1,3 0,10 C-1,3 -3,1 -10,0 C-3,-1 -1,-3 0,-10 Z" />
                <g id="coin">
                  <circle cx="5" cy="4" r="50" fill="url(#edge)" />
                  <circle r="50" fill="url(#face)" />
                  <circle r="41" fill="none" stroke="url(#rim)" strokeWidth="3" />
                  <circle r="37" fill="url(#inner)" />
                  <g transform="rotate(-45) scale(.3) translate(-10 0)">
                    <path d="M-66,-20 L26,-20 L26,-54 L88,0 L26,54 L26,20 L-66,20 Z" fill="url(#arrowDark)" />
                  </g>
                  <ellipse cx="-14" cy="-28" rx="26" ry="11" transform="rotate(-28 -14 -28)" fill="url(#hl)" opacity=".8" />
                </g>
              </defs>

              {/* moedas secundárias */}
              <g transform="translate(468 72) rotate(20) scale(.62)">
                <g className="animate-float-slow motion-reduce:animate-none">
                  <use href="#coin" />
                </g>
              </g>
              <g transform="translate(50 122) rotate(-18) scale(.5)" filter="url(#b2)">
                <use href="#coin" />
              </g>
              <g transform="translate(486 272) rotate(30) scale(.42)" filter="url(#b5)">
                <use href="#coin" />
              </g>

              {/* moeda principal */}
              <g transform="translate(316 166) rotate(-8)">
                <g className="animate-float motion-reduce:animate-none">
                  <circle r="185" fill="url(#glow)" />
                  <circle cx="14" cy="10" r="138" fill="url(#edge)" />
                  <circle r="138" fill="url(#face)" />
                  <circle r="130" fill="none" stroke="#8A5A0B" strokeOpacity=".38" strokeWidth="7" strokeDasharray="1.6 5.2" />
                  <circle r="121" fill="none" stroke="url(#rim)" strokeWidth="6" />
                  <circle r="113" fill="url(#inner)" />
                  <g transform="rotate(-45) translate(-10 0)">
                    <path transform="translate(2.5 2.5)" d="M-66,-20 L26,-20 L26,-54 L88,0 L26,54 L26,20 L-66,20 Z" fill="#FFF3B0" opacity=".85" />
                    <path d="M-66,-20 L26,-20 L26,-54 L88,0 L26,54 L26,20 L-66,20 Z" fill="url(#arrowDark)" />
                  </g>
                  <g clipPath="url(#clipface)">
                    <rect x="-40" y="-220" width="46" height="440" transform="rotate(38)" fill="#fff" opacity=".16" />
                    <rect x="30" y="-220" width="14" height="440" transform="rotate(38)" fill="#fff" opacity=".12" />
                  </g>
                  <ellipse cx="-42" cy="-82" rx="82" ry="34" transform="rotate(-28 -42 -82)" fill="url(#hl)" />
                </g>
              </g>

              {/* brilhos */}
              <use href="#sparkle" x="392" y="26" fill="#FFF3B0" />
              <use href="#sparkle" fill="#FFE27A" transform="translate(120 250) scale(.7)" />
              <use href="#sparkle" fill="#FFF3B0" transform="translate(512 170) scale(.6)" />
            </svg>

            {/* cartão flutuante */}
            <div className="absolute bottom-[3cqw] left-[7cqw] flex items-center gap-3 rounded-[20px] border border-white/95 bg-gradient-to-br from-white/80 to-white/40 py-3 pl-3 pr-4 shadow-[0_18px_36px_-20px_rgba(10,31,68,.35),inset_0_1px_0_#fff] backdrop-blur-[16px] backdrop-saturate-150">
              <span className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-gradient-to-br from-gold-light to-gold shadow-[inset_0_-2px_0_rgba(154,106,18,.4)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#061530" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 18L12 10l3 3 5-6" />
                  <path d="M15 7h5v5" />
                </svg>
              </span>
              <div>
                <small className="block text-[.74rem] leading-tight text-muted">Patrimônio</small>
                <b className="block text-[1.08rem] font-bold leading-tight">R$ 48.320,00</b>
              </div>
              <em className="whitespace-nowrap rounded-full bg-gold/30 px-[9px] py-[3px] text-[.78rem] font-bold not-italic text-[#7A4F08]">
                +12,4%
              </em>
            </div>
          </div>

          {/* texto inferior */}
          <div className="relative z-30 mt-auto px-[8cqw] pb-[7cqw] pt-[2cqw]">
            <h2 className="m-0 max-w-[17ch] text-[max(1.35rem,5.4cqw)] font-bold leading-[1.12] tracking-[-.015em]">
              Seu dinheiro também tem um destino.
            </h2>
            <p className="mt-3 hidden max-w-[38ch] text-[max(.95rem,2.9cqw)] leading-normal text-[#3E4C6B] lg:block">
              Aprenda a organizar, planejar e investir. Um passo de cada vez, junto com a Comunidade Partiu.
            </p>
          </div>
        </section>

        {/* Coluna de acesso: Formulário de Login / Cadastro */}
        <div className="flex min-w-0 flex-col gap-3">
          {/* Cartão principal */}
          <main className="flex flex-1 items-center justify-center rounded-[24px] border border-white/85 bg-gradient-to-br from-white/85 to-white/55 px-5 pb-8 pt-7 shadow-[inset_0_1px_0_#fff,0_24px_50px_-30px_rgba(10,31,68,.35)] backdrop-blur-[24px] backdrop-saturate-150 sm:p-[clamp(24px,4.2vw,52px)] lg:rounded-[30px]">
            <div className="w-full max-w-[380px]">
              <img
                src="/logo-partiu-invest.png"
                alt="Partiu Invest. Seu dinheiro também tem um destino."
                className="mb-6 block h-auto w-[min(100%,220px)] lg:mb-[24px] lg:w-[min(100%,240px)]"
              />

              {/* Título dinâmico */}
              <h1 className="m-0 text-[1.85rem] lg:text-[2rem] font-extrabold leading-[1.1] tracking-[-.025em]">
                {mode === 'login' ? 'Bem-vindo de volta' : 'Criar nova Família'}
              </h1>
              <p className="mb-[20px] mt-2 text-[.95rem] text-muted">
                {mode === 'login'
                  ? 'Acesse sua conta para continuar sua jornada.'
                  : 'Cadastre-se como Chefe de Família e organize o futuro.'}
              </p>

              {/* Mensagem de status */}
              {statusMsg && (
                <p role="status" aria-live="polite" className="mb-4 rounded-[14px] bg-ok/10 px-3.5 py-3 text-[.88rem] font-semibold text-ok border border-ok/20">
                  {statusMsg}
                </p>
              )}

              {/* Mensagem de erro */}
              {errorMsg && (
                <p role="alert" className="mb-4 rounded-[14px] bg-danger/10 px-3.5 py-3 text-[.88rem] font-semibold text-danger border border-danger/20">
                  {errorMsg}
                </p>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Campos adicionais em caso de Cadastro */}
                {mode === 'register' && (
                  <>
                    {/* Nome Completo */}
                    <div className="mb-3.5">
                      <label htmlFor="name" className="mb-[6px] block text-[.88rem] font-semibold">
                        Seu nome completo
                      </label>
                      <div className="relative">
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
                          fill="none"
                          stroke="#7683A3"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="8" r="4" />
                          <path d="M6 20v-1a6 6 0 0112 0v1" />
                        </svg>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          placeholder="Ex: Lucas Martins"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (nameErr) setNameErr(validateName(e.target.value));
                          }}
                          aria-invalid={!!nameErr}
                          required
                          className="h-[52px] w-full rounded-2xl border border-navy/10 bg-white/75 pl-[46px] pr-4 text-base text-navy shadow-[inset_0_2px_4px_rgba(10,31,68,.05)] transition placeholder:text-[#94A0BB] hover:border-navy/25 focus:border-navy focus:bg-white focus:outline-none focus:ring-4 focus:ring-gold/40 aria-[invalid=true]:border-danger"
                        />
                      </div>
                      {nameErr && <p role="alert" className="mt-1 text-[.84rem] text-danger">{nameErr}</p>}
                    </div>

                    {/* Nome da Família */}
                    <div className="mb-3.5">
                      <label htmlFor="familyName" className="mb-[6px] block text-[.88rem] font-semibold">
                        Nome do grupo familiar
                      </label>
                      <div className="relative">
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
                          fill="none"
                          stroke="#7683A3"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <input
                          id="familyName"
                          name="familyName"
                          type="text"
                          placeholder="Ex: Família Martins"
                          value={familyName}
                          onChange={(e) => setFamilyName(e.target.value)}
                          className="h-[52px] w-full rounded-2xl border border-navy/10 bg-white/75 pl-[46px] pr-4 text-base text-navy shadow-[inset_0_2px_4px_rgba(10,31,68,.05)] transition placeholder:text-[#94A0BB] hover:border-navy/25 focus:border-navy focus:bg-white focus:outline-none focus:ring-4 focus:ring-gold/40"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* E-mail */}
                <div className="mb-3.5">
                  <label htmlFor="email" className="mb-[6px] block text-[.88rem] font-semibold">
                    E-mail
                  </label>
                  <div className="relative">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
                      fill="none"
                      stroke="#7683A3"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="3" />
                      <path d="M4 7.5l8 5.5 8-5.5" />
                    </svg>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="nome@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailErr) setEmailErr(validateEmail(e.target.value));
                      }}
                      onBlur={() => {
                        if (email) setEmailErr(validateEmail(email));
                      }}
                      aria-invalid={!!emailErr}
                      required
                      className="h-[52px] w-full rounded-2xl border border-navy/10 bg-white/75 pl-[46px] pr-4 text-base text-navy shadow-[inset_0_2px_4px_rgba(10,31,68,.05)] transition placeholder:text-[#94A0BB] hover:border-navy/25 focus:border-navy focus:bg-white focus:outline-none focus:ring-4 focus:ring-gold/40 aria-[invalid=true]:border-danger"
                    />
                  </div>
                  {emailErr && <p role="alert" className="mt-1 text-[.84rem] text-danger">{emailErr}</p>}
                </div>

                {/* Senha */}
                <div className="mb-3.5">
                  <label htmlFor="senha" className="mb-[6px] block text-[.88rem] font-semibold">
                    Senha
                  </label>
                  <div className="relative">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
                      fill="none"
                      stroke="#7683A3"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="4.5" y="10.5" width="15" height="10" rx="3" />
                      <path d="M8 10.5V8a4 4 0 018 0v2.5" />
                    </svg>
                    <input
                      id="senha"
                      name="senha"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      placeholder={mode === 'login' ? 'Digite sua senha' : 'Mínimo 6 caracteres'}
                      value={senha}
                      onChange={(e) => {
                        setSenha(e.target.value);
                        if (senhaErr) setSenhaErr(validateSenha(e.target.value));
                      }}
                      aria-invalid={!!senhaErr}
                      required
                      className="h-[52px] w-full rounded-2xl border border-navy/10 bg-white/75 pl-[46px] pr-[54px] text-base text-navy shadow-[inset_0_2px_4px_rgba(10,31,68,.05)] transition placeholder:text-[#94A0BB] hover:border-navy/25 focus:border-navy focus:bg-white focus:outline-none focus:ring-4 focus:ring-gold/40 aria-[invalid=true]:border-danger"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-[7px] top-[7px] grid h-10 w-10 place-items-center rounded-xl hover:bg-navy/5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-gold"
                    >
                      {!showPassword ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="#5B6885" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="#5B6885" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 3l18 18" />
                          <path d="M10.6 5.1A10 10 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4M6.3 6.3A17 17 0 002 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1" />
                          <path d="M9.9 9.9a3 3 0 004.2 4.2" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {senhaErr && <p role="alert" className="mt-1 text-[.84rem] text-danger">{senhaErr}</p>}
                </div>

                {/* Opções de Login */}
                {mode === 'login' && (
                  <div className="mb-[20px] mt-1 flex flex-wrap items-center justify-between gap-3">
                    <label className="flex cursor-pointer select-none items-center gap-2.5 text-[.88rem]">
                      <input type="checkbox" name="lembrar" defaultChecked className="peer sr-only" />
                      <span
                        aria-hidden="true"
                        className="grid h-[22px] w-[22px] place-items-center rounded-[7px] border-[1.5px] border-navy/30 bg-white/80 transition peer-checked:border-gold-deep peer-checked:bg-gold peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold peer-checked:[&>svg]:opacity-100"
                      >
                        <svg viewBox="0 0 14 14" className="h-[13px] w-[13px] opacity-0" fill="none" stroke="#0A1F44" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.5 7.5l3 3 6-7" />
                        </svg>
                      </span>
                      Manter conectado
                    </label>
                    <a
                      href="#recuperar"
                      className="text-[.88rem] font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4 hover:text-gold-deep focus-visible:rounded focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-gold"
                    >
                      Esqueci minha senha
                    </a>
                  </div>
                )}

                {/* Botão principal */}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative flex h-14 w-full items-center justify-center gap-2.5 overflow-hidden rounded-[18px] bg-[linear-gradient(120deg,#F5B82E_0%,#FFD65A_45%,#F5B82E_72%,#E2A11B_100%)] text-[1.05rem] font-bold text-navy-deep shadow-[0_14px_26px_-12px_rgba(154,106,18,.85),inset_0_-3px_0_rgba(154,106,18,.35),inset_0_1px_0_rgba(255,255,255,.7)] transition before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[52%] before:bg-gradient-to-b before:from-white/55 before:to-white/0 before:content-[''] hover:brightness-105 active:translate-y-px disabled:cursor-progress disabled:saturate-[.85] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-navy mt-2"
                >
                  {loading && (
                    <span aria-hidden="true" className="relative h-[18px] w-[18px] animate-spin rounded-full border-[3px] border-navy-deep/25 border-t-navy-deep" />
                  )}
                  <span className="relative">
                    {loading
                      ? mode === 'login' ? 'Entrando...' : 'Criando família...'
                      : mode === 'login' ? 'Partiu entrar' : 'Cadastrar e começar'}
                  </span>
                </button>
              </form>

              {/* Divisor */}
              <div className="my-4 flex items-center gap-3.5 text-[.84rem] text-muted before:h-px before:flex-1 before:bg-navy/10 before:content-[''] after:h-px after:flex-1 after:bg-navy/10 after:content-['']">
                ou continue com
              </div>

              {/* Google Auth */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex h-13 py-3 w-full items-center justify-center gap-2.5 rounded-[18px] border border-navy/10 bg-white/80 text-sm font-semibold text-navy shadow-[inset_0_1px_0_#fff,0_8px_18px_-12px_rgba(10,31,68,.35)] transition hover:border-navy/30 hover:bg-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-navy"
              >
                <svg viewBox="0 0 18 18" aria-hidden="true" className="h-[18px] w-[18px]">
                  <path fill="#4285F4" d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" />
                  <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2823-1.71V4.9582H.9573A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71z" />
                  <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z" />
                </svg>
                Google
              </button>

              {/* Alternador de Modo (Login vs Cadastro) */}
              <p className="mt-5 text-center text-[.92rem] text-muted">
                {mode === 'login' ? 'Ainda não faz parte da Comunidade? ' : 'Já possui uma família cadastrada? '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setErrorMsg('');
                    setStatusMsg('');
                  }}
                  className="font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4 hover:text-gold-deep focus-visible:rounded focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-gold"
                >
                  {mode === 'login' ? 'Partiu começar' : 'Partiu entrar'}
                </button>
              </p>
            </div>
          </main>

          {/* Faixa da comunidade */}
          <aside className="flex items-center gap-4 rounded-3xl border border-white/85 bg-gradient-to-br from-white/85 to-white/55 px-[22px] py-3.5 shadow-[inset_0_1px_0_#fff,0_24px_50px_-30px_rgba(10,31,68,.35)] backdrop-blur-[24px] backdrop-saturate-150">
            <div className="flex" aria-hidden="true">
              <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border-[2.5px] border-white bg-gradient-to-br from-[#2A55B0] to-navy">
                <svg viewBox="0 0 40 40" className="h-full w-full">
                  <circle cx="20" cy="15" r="7" fill="#fff" />
                  <path d="M6 40c1-9 7-13 14-13s13 4 14 13z" fill="#fff" />
                </svg>
              </span>
              <span className="-ml-[11px] grid h-10 w-10 place-items-center overflow-hidden rounded-full border-[2.5px] border-white bg-gradient-to-br from-gold-light to-[#E2A11B]">
                <svg viewBox="0 0 40 40" className="h-full w-full">
                  <circle cx="20" cy="15" r="7" fill="#0A1F44" />
                  <path d="M6 40c1-9 7-13 14-13s13 4 14 13z" fill="#0A1F44" />
                </svg>
              </span>
              <span className="-ml-[11px] grid h-10 w-10 place-items-center overflow-hidden rounded-full border-[2.5px] border-white bg-gradient-to-br from-[#8FB2F5] to-[#3F6FD8]">
                <svg viewBox="0 0 40 40" className="h-full w-full">
                  <circle cx="20" cy="15" r="7" fill="#fff" />
                  <path d="M6 40c1-9 7-13 14-13s13 4 14 13z" fill="#fff" />
                </svg>
              </span>
            </div>
            <div>
              <b className="block font-bold leading-tight">Comunidade Partiu</b>
              <small className="block text-[.85rem] leading-snug text-muted">Bora aprender isso juntos.</small>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
