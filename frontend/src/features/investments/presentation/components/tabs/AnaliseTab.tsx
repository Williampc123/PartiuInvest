import React, { useState } from 'react';
import { Bot, ChevronDown, ChevronUp, Lock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const AnaliseTab: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true); // Ativado por padrão para experiência PRO
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const insights = [
    {
      id: 1,
      icon: '🍏',
      ticker: 'AAPL',
      title: 'O Stock AAPL não apresentou um bom crescimento de receita nos últimos anos, tendo um CAGR Receita abaixo de 5% (Atual 4,29%).',
      details: 'A desaceleração nas vendas globais de hardware é compensada pelo crescimento contínuo do segmento de Serviços (Apple Services) e recompra agressiva de ações.',
    },
    {
      id: 2,
      icon: '🟡',
      ticker: 'BBAS3',
      title: 'A Empresa BBAS3 está com P/L de 4,6x e ROE de 21,5%, mantendo excelente desconto em relação à média histórica do setor bancário.',
      details: 'A carteira de crédito do agronegócio segue sólida com índice de inadimplência controlado abaixo da média do Sistema Financeiro Nacional.',
    },
    {
      id: 3,
      icon: '🏢',
      ticker: 'HGLG11',
      title: 'O Fundo Imobiliário HGLG11 mantém vacância física baixa (2,3%) e dividendos regulares com Yield médio de 8,9% a.a.',
      details: 'Galpões logísticos de alto padrão (Classe A+) localizados no raio de 30km de São Paulo continuam com alta demanda por contratos atípicos.',
    },
    {
      id: 4,
      icon: '🟡',
      ticker: 'PETR4',
      title: 'A Empresa PETR4 pagou 14,8% em dividendos nos últimos 12 meses com forte geração de fluxo de caixa livre.',
      details: 'A política de remuneração aos acionistas permanece sustentável desde que o barril de petróleo tipo Brent se mantenha acima de US$ 65.',
    },
    {
      id: 5,
      icon: '🟣',
      ticker: 'BTC',
      title: 'A alocação em Bitcoin confere assimetria positiva à carteira perante cenários de inflação global e desvalorização cambial.',
      details: 'Manter a exposição entre 5% e 10% do patrimônio maximiza o Índice de Sharpe da carteira sem adicionar risco de ruína.',
    },
  ];

  return (
    <div className="space-y-6 text-slate-200">
      {/* 1. BANNER SUPERIOR DE ANÁLISE INTELIGENTE (Idêntico à Imagem 2) */}
      <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] p-5 shadow-sm flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-[#1C2538] border border-[#2B3852] flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white">Análise inteligente de carteira</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Nossa análise inteligente da carteira consiste em trazer os melhores insights fundamentalistas para te auxiliar na gestão de seu portfólio de ativos. Tenha acesso rápido e fácil aos principais pontos de atenção para que possa fazer a melhor gestão possível de seus ativos.
          </p>
        </div>
      </div>

      {/* 2. CARD PRINCIPAL: PONTOS DE ATENÇÃO (Faixa Marrom / Dourada no Topo) */}
      <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] overflow-hidden shadow-sm">
        {/* Faixa Marrom Superior */}
        <div className="bg-[#3D260F] border-b border-[#5C3A17] px-5 py-3">
          <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">Pontos de atenção</h4>
        </div>

        {/* Lista de Itens de Análise */}
        <div className="p-5 space-y-3 relative">
          {insights.map((it, idx) => {
            const isBlur = !isUnlocked && idx > 0;
            const isExpanded = expandedIndex === idx;

            return (
              <div
                key={it.id}
                className={`rounded-xl bg-[#0F141E] border border-[#1E2638] overflow-hidden transition ${
                  isBlur ? 'filter blur-[3px] select-none opacity-50' : 'hover:border-[#2D3A54]'
                }`}
              >
                <div
                  onClick={() => !isBlur && setExpandedIndex(isExpanded ? null : idx)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg shrink-0">{it.icon}</span>
                    <p className="text-xs font-semibold text-slate-200 leading-snug">{it.title}</p>
                  </div>
                  <div className="text-slate-400 shrink-0">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {isExpanded && !isBlur && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-400 border-t border-white/5 bg-[#0A0E17]">
                    <p className="leading-relaxed">{it.details}</p>
                  </div>
                )}
              </div>
            );
          })}

          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <button
                type="button"
                onClick={() => setIsUnlocked(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#00D084] hover:bg-[#00B875] text-slate-950 font-black text-xs shadow-2xl transition active:scale-95"
              >
                <Lock className="h-4 w-4" />
                <span>Desbloquear análise completa</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. RODAPÉ / DISCLAIMER LEGAL */}
      <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] p-4 text-slate-400 text-xs flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          *Os insights acima não devem ser considerados como recomendações e também não existe qualquer análise humana em sua carteira, nosso sistema somente analisa os indicadores das empresas lhe trazendo pontos de alertas que o investidores Buy And Hold consideram importantes em suas análises.
        </p>
      </div>
    </div>
  );
};
