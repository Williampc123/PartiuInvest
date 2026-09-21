import React from 'react';
import { Compass, CheckCircle2 } from 'lucide-react';

export const JourneySteps: React.FC = () => {
  const steps = [
    { title: 'Controle', desc: 'Contas conectadas', done: true },
    { title: 'Consciência', desc: 'Gastos mapeados', done: true },
    { title: 'Planejamento', desc: 'Reserva em formação', done: true },
    { title: 'Investimento', desc: 'Rendimentos ativos', current: true },
    { title: 'Patrimônio', desc: 'Liberdade financeira', done: false },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gold/20 text-gold-deep font-bold">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h3 className="card-title">Jornada Financeira Familiar</h3>
            <p className="card-sub">Etapa atual: Investimento com propósito</p>
          </div>
        </div>
        <span className="pill bg-gold/20 text-gold-deep text-[11px] font-bold">Etapa 4 de 5</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2">
        {steps.map((step, idx) => (
          <div
            key={step.title}
            className={`p-3 rounded-2xl border transition ${
              step.done
                ? 'bg-ok/5 border-ok/30 text-navy'
                : step.current
                ? 'bg-gold/10 border-gold shadow-sm text-navy'
                : 'bg-white/40 border-navy/10 opacity-60 text-muted'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Fase 0{idx + 1}
              </span>
              {step.done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-ok" />
              ) : step.current ? (
                <span className="h-2 w-2 rounded-full bg-gold animate-ping" />
              ) : null}
            </div>
            <p className="text-xs font-bold text-navy">{step.title}</p>
            <p className="text-[11px] text-muted truncate">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
