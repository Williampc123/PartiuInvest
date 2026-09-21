import React from 'react';
import { HeartPulse } from 'lucide-react';

export const HealthGauge: React.FC = () => {
  const score = 84; // 0 a 100

  return (
    <div className="card flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="card-title">Saúde Financeira</h3>
          <p className="card-sub">Índice de estabilidade e segurança familiar</p>
        </div>
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-ok/15 text-ok">
          <HeartPulse className="h-4 w-4" />
        </div>
      </div>

      {/* Medidor Semi-circular SVG */}
      <div className="my-3 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <svg className="w-40 h-24 overflow-visible" viewBox="0 0 160 90">
            {/* Trilho de fundo */}
            <path
              d="M 15 80 A 65 65 0 0 1 145 80"
              fill="none"
              stroke="#0A1F44"
              strokeOpacity="0.1"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Arco preenchido */}
            <path
              d="M 15 80 A 65 65 0 0 1 145 80"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="14"
              strokeDasharray="204"
              strokeDashoffset={204 - (204 * score) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#F5B82E" />
                <stop offset="60%" stopColor="#3F6FD8" />
                <stop offset="100%" stopColor="#0F7B4B" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute bottom-0 text-center">
            <span className="text-3xl font-extrabold text-navy leading-none">{score}</span>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-ok">
              Equilibrado
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-navy/10 text-[11px] text-muted">
        <div>
          <span className="font-semibold text-navy">Reserva:</span> 4.5 meses
        </div>
        <div>
          <span className="font-semibold text-navy">Gastos/Renda:</span> 58%
        </div>
      </div>
    </div>
  );
};
