import React, { useState } from 'react';
import { PortfolioPosition, AIAdvisorDiagnosis } from '../../../domain/types';
import { runAIPortfolioDiagnosis } from '../../../infrastructure/investmentsService';
import { Bot, Sparkles, CheckCircle2, AlertTriangle, ArrowUpRight, RefreshCw, Zap } from 'lucide-react';

interface AIAdvisorTabProps {
  positions: PortfolioPosition[];
  totalPortfolioValue: number;
}

export const AIAdvisorTab: React.FC<AIAdvisorTabProps> = ({ positions, totalPortfolioValue }) => {
  const [diagnosis, setDiagnosis] = useState<AIAdvisorDiagnosis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDiagnosis = async () => {
    setIsLoading(true);
    try {
      const data = await runAIPortfolioDiagnosis(positions, totalPortfolioValue);
      setDiagnosis(data);
    } catch {}
    setIsLoading(false);
  };

  React.useEffect(() => {
    fetchDiagnosis();
  }, [positions, totalPortfolioValue]);

  return (
    <div className="space-y-6 text-navy">
      {/* Banner PRO com IA */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-100/80 via-white/85 to-white/95 border border-purple-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 text-2xl shrink-0 shadow-sm">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-navy">Assistente de Inteligência Financeira (IA)</h3>
              <span className="rounded bg-gradient-to-r from-purple-600 to-indigo-600 px-1.5 py-0.2 text-[9px] font-black text-white uppercase">IA PRO</span>
            </div>
            <p className="text-xs text-muted">Análise de risco, concentração de capital, consistência de proventos e rebalanceamento inteligente</p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchDiagnosis}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md hover:opacity-90 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Analisando Carteira...' : 'Gerar Novo Diagnóstico'}</span>
        </button>
      </div>

      {/* 1. Score de Saúde da Carteira */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white/85 border border-white/95 shadow-[inset_0_1px_0_#fff,0_8px_20px_-10px_rgba(10,31,68,.12)] p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted">Score de Saúde da Carteira</span>
          <div className="my-3 flex items-baseline gap-3">
            <span className="text-5xl font-black text-navy tracking-tight">{diagnosis?.score || 88}</span>
            <span className="text-sm font-bold text-muted">/ 100</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-ok/10 text-ok border border-ok/20">
              Classificação: {diagnosis?.rating || 'Excelente'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white/85 border border-white/95 shadow-[inset_0_1px_0_#fff,0_8px_20px_-10px_rgba(10,31,68,.12)] p-5 col-span-1 md:col-span-2">
          <span className="text-xs font-semibold text-muted block mb-2">Parecer Executivo da IA</span>
          <div className="p-4 rounded-xl bg-slate-50/80 border border-navy/10 text-xs text-navy leading-relaxed space-y-2">
            <p>{diagnosis?.summary || 'Carregando análise aprofundada da carteira...'}</p>
          </div>
        </div>
      </div>

      {/* 2. Pontos Fortes e Riscos Identificados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pontos Fortes */}
        <div className="rounded-2xl bg-white/85 border border-ok/30 shadow-[inset_0_1px_0_#fff,0_8px_20px_-10px_rgba(10,31,68,.12)] p-5 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-ok flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Pontos Fortes da Carteira</span>
          </h4>
          <ul className="space-y-2 text-xs text-navy font-medium">
            {diagnosis?.strengths.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-ok/5 p-2.5 rounded-xl border border-ok/15">
                <span className="text-ok font-bold">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Riscos e Alertas */}
        <div className="rounded-2xl bg-white/85 border border-gold/30 shadow-[inset_0_1px_0_#fff,0_8px_20px_-10px_rgba(10,31,68,.12)] p-5 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-gold-deep flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Riscos & Alertas de Atenção</span>
          </h4>
          <ul className="space-y-2 text-xs text-navy font-medium">
            {diagnosis?.risks.map((r, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-gold/10 p-2.5 rounded-xl border border-gold/20">
                <span className="text-gold-deep font-bold">!</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 3. Sugestões de Rebalanceamento Inteligente */}
      <div className="rounded-2xl bg-white/85 border border-white/95 shadow-[inset_0_1px_0_#fff,0_8px_20px_-10px_rgba(10,31,68,.12)] p-5 space-y-3">
        <h4 className="text-sm font-bold text-navy flex items-center gap-2">
          <Zap className="h-4 w-4 text-gold-deep" />
          <span>Onde Aportar o Próximo Dinheiro? (Rebalanceamento Automático)</span>
        </h4>
        <p className="text-xs text-muted">
          Recomendações geradas com base na alocação ideal para manter sua carteira balanceada e reduzir a volatilidade.
        </p>

        <div className="space-y-2 pt-2">
          {diagnosis?.rebalanceSuggestions.map((sug, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-50/80 border border-navy/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-navy text-sm">{sug.ticker}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${sug.action === 'BUY' ? 'bg-ok/10 text-ok border border-ok/20' : 'bg-gold/10 text-gold-deep border border-gold/20'}`}>
                    {sug.action === 'BUY' ? 'APORTE RECOMENDADO' : 'AGUARDAR (HOLD)'}
                  </span>
                </div>
                <p className="text-xs text-muted mt-1">{sug.reason}</p>
              </div>

              {sug.recommendedAmountBrl > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-muted block uppercase">Sugestão de Aporte</span>
                  <b className="text-sm font-black text-ok">
                    R$ {sug.recommendedAmountBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </b>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
