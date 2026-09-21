# design-patterns.md — Guia de Estilo e Sistema Visual

> **Projeto:** Partiu Invest — plataforma de educação e organização financeira familiar.  
> **Slogan:** *Seu dinheiro também tem um destino.*  
> **Base de telas:** Pasta `\modelos` (`partiu-invest-login-tailwind.html`, `partiu-invest-painel-tailwind.html`, `logo-partiu-invest.png`, `icone-partiu-invest.png`).  
> **Público deste documento:** Desenvolvedores React, UI/UX Designers e o agente autônomo Gemini Antigravity.  
> **Leia junto:** `design-systems.md` (arquitetura e engenharia).

---

## 1. Princípios de Design e Identidade

1. **Acolhedor & Confiável:** Uma estética que combina a seriedade do azul marinho (*Navy*) com a prosperidade e calor do dourado (*Gold*).
2. **Liquid Glass & Profundidade:** Elementos semitransparentes com desfoque de fundo (`backdrop-blur`), bordas sutis com brilho superior (`inset 0 1px 0 rgba(255,255,255,0.9)`) e sombras suaves.
3. **Clareza Financeira para Toda a Família:** Números legíveis, hierarquia tipográfica forte, gráficos em SVG intuitivos e distinção clara entre gastos individuais e compartilhados.
4. **Respeito aos Modelos Prontos:** Toda nova interface deve seguir rigorosamente a anatomia e as classes Tailwind já implementadas nos arquivos da pasta `\modelos`.

---

## 2. Paleta de Cores e Tokens Tailwind

A paleta oficial está configurada no `tailwind.config.ts` compartilhado:

```ts
// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A1F44', // Texto principal, cabeçalhos e fundos nobres
          deep: '#061530',    // Fundo de alto contraste e textos sobre dourado
          soft: '#1B3F86',    // Destaques secundários e gradientes azuis
        },
        blue: {
          DEFAULT: '#3F6FD8', // Elementos interativos e links secundários
          light: '#8FB2F5',   // Variações de barras e badges
        },
        gold: {
          DEFAULT: '#F5B82E', // Cor de destaque principal (ouro / ação)
          light: '#FFE27A',   // Brilhos e gradientes superiores
          deep: '#9A6A12',    // Sombras douradas e estados hover/active
        },
        muted: '#5B6885',     // Textos de apoio, legendas e rótulos secundários
        ok: '#0F7B4B',        // Sucesso, saldos positivos e metas atingidas
        danger: '#B42318',    // Alertas, faturas atrasadas e erros
      },
      fontFamily: {
        sans: ['Outfit', 'Nunito Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-9px)' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out -3s infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### 2.1 Tabela de Cores de Referência

| Token | Hex | Uso Principal | Exemplo de Aplicação |
|---|---|---|---|
| `navy.DEFAULT` | `#0A1F44` | Cor primária de texto e elementos de marca | `text-navy`, `border-navy/10` |
| `navy.deep` | `#061530` | Contraste máximo, texto em botões dourados | `text-navy-deep` |
| `navy.soft` | `#1B3F86` | Gradientes e submenus | `from-blue-light to-navy-soft` |
| `gold.DEFAULT` | `#F5B82E` | Botões primários, marcadores ativos, barras | `bg-gold`, `decoration-gold` |
| `gold.light` | `#FFE27A` | Reflexo de luz e topo de gradientes | `from-gold-light to-gold` |
| `gold.deep` | `#9A6A12` | Bordas e sombras de botões dourados | `shadow-[0_12px_22px_-12px_rgba(154,106,18,.85)]` |
| `blue.DEFAULT` | `#3F6FD8` | Ações de suporte e tags bancárias | `text-blue` |
| `muted` | `#5B6885` | Legendas, datas, placeholders | `text-muted` |
| `ok` | `#0F7B4B` | Indicadores de saúde financeira positiva | `text-ok`, `bg-ok/10` |
| `danger` | `#B42318` | Despesas em alerta, exclusões | `text-danger`, `bg-danger/10` |

---

## 3. Tipografia

- **Família Tipográfica:** `Outfit` (Google Fonts), pesos 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold), 800 (Extra-bold).
- **Importação:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### 3.1 Escala e Hierarquia

| Nível | Classes Tailwind Recomendadas | Peso | Uso |
|---|---|---|---|
| Display / Hero | `text-3xl md:text-4xl font-extrabold tracking-tight` | 800 | Frase de impacto, login banner |
| Título 1 (H1) | `text-2xl md:text-[1.75rem] font-bold tracking-tight text-navy` | 700 | Título da página ou saudação |
| Título 2 (H2) | `text-[1.15rem] md:text-[1.3rem] font-bold text-navy` | 700 | Seções principais (Patrimônio, Caixinhas) |
| Título do Card | `text-[1.05rem] font-bold tracking-[-0.01em] text-navy` | 700 | Cabeçalho interno de blocos |
| Subtítulo / Apoio | `text-[0.85rem] text-muted` | 400 / 500 | Explicações abaixo dos títulos |
| Corpo Padrão | `text-[0.92rem] md:text-[1rem] leading-relaxed text-navy` | 400 | Textos corridos, dados e descrições |
| Micro / Badges | `text-[0.75rem] md:text-[0.78rem] font-bold` | 700 | Tags, pílulas de status, legendas |

---

## 4. Efeito Liquid Glass (Vidro Líquido) e Fundo Global

O fundo de tela utiliza um gradiente radial multicamadas e os cards flutuantes utilizam a classe `.glass`.

### 4.1 Fundo da Aplicação (`bg-page`)
```css
/* src/styles/tailwind.css */
.bg-page {
  background-color: #E9EFFB;
  background-image:
    radial-gradient(55% 50% at 4% 0%, rgba(245, 184, 46, 0.5), transparent 62%),
    radial-gradient(55% 55% at 100% 8%, rgba(120, 160, 240, 0.55), transparent 62%),
    radial-gradient(60% 55% at 92% 100%, rgba(70, 110, 200, 0.4), transparent 66%),
    radial-gradient(55% 55% at 0% 100%, rgba(150, 180, 240, 0.5), transparent 66%);
  background-attachment: fixed;
}
```

### 4.2 Componente Glass (.glass)
```css
.glass {
  @apply border border-white/90 bg-gradient-to-br from-white/90 to-white/60 
         backdrop-blur-[24px] backdrop-saturate-150
         shadow-[inset_0_1px_0_#fff,0_22px_44px_-32px_rgba(10,31,68,.35)];
}
```

---

## 5. Padrão de Componentes Visuais (Design Tokens em CSS)

Todos os componentes abaixo devem ser adicionados na camada `@layer components` em `src/styles/tailwind.css`:

```css
@layer components {
  /* Cartão Base */
  .card {
    @apply glass min-w-0 rounded-[22px] p-[18px] md:rounded-[26px] md:p-[22px];
  }
  .card-title {
    @apply m-0 text-[1.05rem] font-bold tracking-[-.01em] text-navy;
  }
  .card-sub {
    @apply mb-0 mt-0.5 text-[.85rem] text-muted;
  }

  /* Botão Primário Dourado (btn-gold) */
  .btn-gold {
    @apply relative inline-flex h-[42px] cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-[14px] border-0 px-4 text-[.92rem] font-bold text-navy-deep
           bg-[linear-gradient(120deg,#F5B82E_0%,#FFD65A_45%,#F5B82E_72%,#E2A11B_100%)]
           shadow-[0_12px_22px_-12px_rgba(154,106,18,.85),inset_0_-2px_0_rgba(154,106,18,.35),inset_0_1px_0_rgba(255,255,255,.7)]
           before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/50 before:to-transparent before:content-['']
           hover:brightness-105 active:scale-[0.98] transition
           focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-navy;
  }
  .btn-gold > * {
    @apply relative z-10;
  }

  /* Botão Secundário com Linha (btn-line) */
  .btn-line {
    @apply inline-flex h-[38px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-navy/10 bg-white/80 px-4 text-[.88rem] font-semibold text-navy
           hover:border-navy/30 hover:bg-white active:scale-[0.98] transition
           focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-gold;
  }

  /* Botão de Ícone Compacto (icon-btn) */
  .icon-btn {
    @apply grid h-9 w-9 cursor-pointer place-items-center rounded-[11px] border-0 bg-transparent text-navy hover:bg-navy/[.07]
           focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-gold;
  }

  /* Botão Redondo de Vidro (round) - Topo e Ações Rápidas */
  .round {
    @apply glass relative grid h-11 w-11 cursor-pointer place-items-center rounded-[14px] text-navy hover:bg-white
           focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-gold;
  }

  /* Link com Sublinhado Dourado */
  .link {
    @apply cursor-pointer border-0 bg-transparent p-0 text-[.86rem] font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4 hover:text-gold-deep
           focus-visible:rounded focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-gold;
  }

  /* Item do Menu Lateral (Sidebar Navigation) */
  .menu-link {
    @apply relative flex items-center gap-3 rounded-2xl px-3.5 py-[11px] font-medium text-[#3E4C6B] no-underline transition
           hover:bg-navy/5 hover:text-navy md:max-xl:justify-center md:max-xl:px-0
           focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-gold;
  }
  .menu-link[aria-current="page"] {
    @apply font-bold text-navy bg-gradient-to-br from-gold-light/55 to-gold/30
           shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_8px_18px_-12px_rgba(154,106,18,.6)]
           before:absolute before:-left-2.5 before:bottom-3 before:top-3 before:w-1 before:rounded-r before:bg-gold before:content-[''] xl:before:-left-3.5;
  }

  /* Pílulas / Badges */
  .pill {
    @apply inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[.78rem] font-bold;
  }

  /* Barra de Progresso / Metas */
  .bar {
    @apply mt-1.5 h-2 overflow-hidden rounded-full bg-navy/10;
  }
  .bar > i {
    @apply block h-full rounded-full bg-gradient-to-r from-gold-light to-gold;
  }
  .bar.navy > i {
    @apply from-blue-light to-navy-soft;
  }

  /* Ícones SVG em Linha */
  .ico {
    @apply h-5 w-5 flex-none fill-none stroke-current;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}
```

---

## 6. Iconografia e Ilustrações SVG

1. **Ícones de Ação:** Ícones lineares com `stroke-width: 1.8`, `stroke-linecap: round` e `stroke-linejoin: round` (Lucide React ou SVGs dos modelos).
2. **Ícones de Moedas e Troféus:** Gradientes dourados ricos com iluminação superior especular (conforme implementado na tela de login `partiu-invest-login-tailwind.html`).
3. **Logotipos:**
   - `logo-partiu-invest.png`: Logo horizontal com tipografia e ícone de investimento.
   - `icone-partiu-invest.png`: Símbolo quadrado "P" dourado com gradiente navy.

---

## 7. Gráficos em SVG Puro (Sem dependências pesadas)

Para manter o bundle ultraleve (PWA offline) e respeitar o design do modelo `partiu-invest-painel-tailwind.html`, os gráficos são componentes React SVG:

### 7.1 Indicador de Saúde Financeira (Gauge / Semi-Donut)
- Raio central com gradiente de progresso (`#F5B82E` a `#0F7B4B`).
- Ponteiro ou preenchimento dinâmico com valor central `0` a `100`.
- Rótulos: *Crítico (0–39)*, *Em atenção (40–69)*, *Equilibrado (70–84)*, *Excelente (85–100)*.

### 7.2 Gráfico de Evolução Patrimonial (Área com Gradiente)
- Curva Bezier suave (`path` com comando `C` / `S`).
- Preenchimento inferior com `linearGradient` de opacidade `0.35` para `0.0`.
- Tooltip flutuante em vidro (`.glass`) indicando data e valor formatado em reais.

### 7.3 Distribuição por Caixinhas (Donut / Barras)
- Segmentos coloridos correspondentes às caixinhas (Reserva, Sonhos, Aposentadoria, etc.).
- Legenda interativa com percentual e valor em `R$`.

---

## 8. Responsividade e Layout Familiar

### 8.1 Breakpoints Tailwind
- **Mobile (< 768px):** Menu inferior fixo (*TabBar*), cards com padding reduzido (`p-4`), visualização simplificada em coluna única.
- **Tablet (768px – 1024px / 1280px):** Sidebar compacta com ícones centralizados (`md:max-xl:justify-center`).
- **Desktop (≥ 1280px):** Sidebar completa com rótulos e status do usuário ativo, grid de 12 colunas para widgets e gráficos lado a lado.

### 8.2 Seletor de Visão Familiar vs. Individual
No topo do painel (`Header`), deve haver um seletor visual em formato de pílula:
- **Visão Familiar:** Mostra o consolidated da casa (soma do chefe, cônjuge e dependentes).
- **Visão Individual:** Filtra apenas as contas e caixinhas do membro selecionado (Chefe, Esposa, Filho 1).
- **Indicador de Papel:** Badges claras: `👑 Chefe de Família`, `💍 Cônjuge`, `🎒 Filho`.

---

## 9. Acessibilidade (A11y)

1. **Contraste Mínimo:** Todos os textos sobre vidro e gradientes devem respeitar no mínimo **4.5:1** (WCAG AA). Textos sobre botão dourado usam obrigatoriamente `text-navy-deep` (`#061530`).
2. **Foco Visível:** Todos os elementos clicáveis têm `focus-visible:outline` com offset e cor contrastante (`outline-gold` ou `outline-navy`).
3. **Estados de Formulário:** Erros de validação (Zod) exibem ícone e mensagem em `text-danger` com `aria-live="polite"` e `aria-invalid="true"`.
4. **Modo Offline:** Badge no topo com indicação de status de conexão:
   - 🟢 *Online e sincronizado*
   - 🟡 *Modo offline (suas alterações serão salvas localmente e sincronizadas ao reconectar)*

---

## 10. Mapeamento dos Arquivos em `\modelos` para Componentes React

| Arquivo em `\modelos` | Trecho / Bloco HTML | Componente React de Destino |
|---|---|---|
| `partiu-invest-login-tailwind.html` | Moldura externa e fundo | `src/features/auth/presentation/pages/LoginPage.tsx` |
| `partiu-invest-login-tailwind.html` | Painel esquerdo com Moedas SVG | `src/features/auth/presentation/components/LoginVisualBanner.tsx` |
| `partiu-invest-login-tailwind.html` | Formulário e botão de login | `src/features/auth/presentation/components/LoginForm.tsx` |
| `partiu-invest-painel-tailwind.html` | Sidebar e menu de navegação | `src/features/dashboard/presentation/components/Sidebar.tsx` |
| `partiu-invest-painel-tailwind.html` | Topo com saudação e perfil | `src/features/dashboard/presentation/components/Header.tsx` |
| `partiu-invest-painel-tailwind.html` | Card Patrimônio Total | `src/features/dashboard/presentation/components/NetWorthCard.tsx` |
| `partiu-invest-painel-tailwind.html` | Termômetro / Score Saúde | `src/features/dashboard/presentation/components/HealthGauge.tsx` |
| `partiu-invest-painel-tailwind.html` | Trilha da Jornada Financeira | `src/features/dashboard/presentation/components/JourneySteps.tsx` |
| `partiu-invest-painel-tailwind.html` | Cards de Caixinhas | `src/features/boxes/presentation/components/BoxCard.tsx` |
| `partiu-invest-painel-tailwind.html` | Gráficos (Evolução / Donut) | `src/features/dashboard/presentation/components/DashboardCharts.tsx` |
| `partiu-invest-painel-tailwind.html` | Lista de Contas Conectadas | `src/features/accounts/presentation/components/AccountList.tsx` |
| `logo-partiu-invest.png` & `icone-partiu-invest.png` | Imagens da marca | `apps/web/public/` e `apps/web/src/assets/` |
