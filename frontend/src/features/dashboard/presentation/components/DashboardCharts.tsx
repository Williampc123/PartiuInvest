import React from 'react';
import { TrendingUp, PieChart as PieIcon } from 'lucide-react';

export const DashboardCharts: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Gráfico de Evolução Patrimonial */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="card-title">Evolução do Patrimônio</h3>
            <p className="card-sub">Histórico dos últimos 6 meses</p>
          </div>
          <span className="pill bg-navy/5 text-navy text-[11px]">
            <TrendingUp className="h-3 w-3 text-ok" /> +R$ 14.800
          </span>
        </div>

        {/* Gráfico SVG de Área com Gradiente */}
        <div className="h-44 w-full flex items-end pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3F6FD8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3F6FD8" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Linhas de Grade */}
            <line x1="0" y1="30" x2="400" y2="30" stroke="#0A1F44" strokeOpacity="0.06" />
            <line x1="0" y1="75" x2="400" y2="75" stroke="#0A1F44" strokeOpacity="0.06" />
            <line x1="0" y1="120" x2="400" y2="120" stroke="#0A1F44" strokeOpacity="0.06" />

            {/* Área Preenchida */}
            <path
              d="M 0 130 C 70 120, 120 95, 180 80 C 240 65, 310 45, 400 20 L 400 150 L 0 150 Z"
              fill="url(#chartGrad)"
            />
            {/* Linha da Curva */}
            <path
              d="M 0 130 C 70 120, 120 95, 180 80 C 240 65, 310 45, 400 20"
              fill="none"
              stroke="#3F6FD8"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Ponto Atual */}
            <circle cx="400" cy="20" r="5" fill="#F5B82E" stroke="#0A1F44" strokeWidth="2" />
          </svg>
        </div>

        <div className="flex justify-between text-[11px] text-muted pt-2 border-t border-navy/10">
          <span>Abr</span>
          <span>Mai</span>
          <span>Jun</span>
          <span>Jul</span>
          <span>Ago</span>
          <span className="font-bold text-navy">Set (Atual)</span>
        </div>
      </div>

      {/* Gráfico de Distribuição por Destino */}
      <div className="card flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="card-title">Distribuição do Dinheiro</h3>
            <p className="card-sub">Para onde o patrimônio está alocado</p>
          </div>
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-navy/5 text-navy">
            <PieIcon className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-center justify-around my-2">
          {/* Donut SVG */}
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
              {/* Segmento Reserva (46%) */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke="#F5B82E"
                strokeWidth="4"
                strokeDasharray="46 54"
                strokeDashoffset="0"
              />
              {/* Segmento Viagem / Sonhos (26%) */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke="#3F6FD8"
                strokeWidth="4"
                strokeDasharray="26 74"
                strokeDashoffset="-46"
              />
              {/* Segmento Educação (28%) */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke="#0F7B4B"
                strokeWidth="4"
                strokeDasharray="28 72"
                strokeDashoffset="-72"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-muted">Total</span>
              <span className="text-sm font-extrabold text-navy leading-none">100%</span>
            </div>
          </div>

          {/* Legendas */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-gold shrink-0" />
              <span className="font-semibold text-navy">Reserva: 46%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue shrink-0" />
              <span className="font-semibold text-navy">Sonhos/Férias: 26%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-ok shrink-0" />
              <span className="font-semibold text-navy">Educação Filhos: 28%</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-navy/10 text-center">
          <p className="text-[11px] text-muted">Nenhum centavo está "sem destino". Tudo planejado!</p>
        </div>
      </div>
    </div>
  );
};
