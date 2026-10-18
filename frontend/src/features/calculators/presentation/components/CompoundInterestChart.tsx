import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { CompoundInterestResult } from '../../core/types';

Chart.register(...registerables);

interface CompoundInterestChartProps {
  result: CompoundInterestResult;
}

export const CompoundInterestChart: React.FC<CompoundInterestChartProps> = ({ result }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly');

  // Determina se deve exibir modo anual ou mensal
  const isLargePeriod = result.totalMonths > 36;
  const activeView = isLargePeriod ? viewMode : 'monthly';

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const isYearly = activeView === 'yearly' && result.annualData.length > 0;
    
    const labels = isYearly
      ? result.annualData.map((d) => `Ano ${d.year}`)
      : result.monthlyData.map((d) => `Mês ${d.month}`);

    const investedData = isYearly
      ? result.annualData.map((d) => d.totalInvested)
      : result.monthlyData.map((d) => d.totalInvested);

    const interestData = isYearly
      ? result.annualData.map((d) => d.totalInterest)
      : result.monthlyData.map((d) => d.totalInterest);

    const totalData = isYearly
      ? result.annualData.map((d) => d.totalAccumulated)
      : result.monthlyData.map((d) => d.totalAccumulated);

    const formatCurrency = (val: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Gradiente Dourado PartiuInvest
    const goldGradient = ctx.createLinearGradient(0, 0, 0, 360);
    goldGradient.addColorStop(0, 'rgba(245, 184, 46, 0.35)');
    goldGradient.addColorStop(1, 'rgba(245, 184, 46, 0.0)');

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Acumulado (Final)',
            data: totalData,
            borderColor: '#E2A11B',
            backgroundColor: goldGradient,
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#F5B82E',
            pointBorderColor: '#0A1F44',
            pointBorderWidth: 1.5,
            pointRadius: labels.length > 60 ? 1 : 3,
            pointHoverRadius: 6,
          },
          {
            label: 'Juros Ganhos',
            data: interestData,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2.5,
            fill: false,
            tension: 0.35,
            pointBackgroundColor: '#10B981',
            pointRadius: labels.length > 60 ? 1 : 2.5,
            pointHoverRadius: 5,
          },
          {
            label: 'Total Investido (Aportes)',
            data: investedData,
            borderColor: '#3F6FD8',
            backgroundColor: 'rgba(63, 111, 216, 0.08)',
            borderWidth: 2,
            borderDash: [5, 4],
            fill: false,
            tension: 0.2,
            pointBackgroundColor: '#3F6FD8',
            pointRadius: labels.length > 60 ? 0.5 : 2,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 14,
              font: {
                family: 'inherit',
                size: 12,
                weight: 'bold',
              },
              color: '#0A1F44',
              padding: 16,
            },
          },
          tooltip: {
            backgroundColor: '#0A1F44',
            titleColor: '#F5B82E',
            bodyColor: '#FFFFFF',
            padding: 12,
            cornerRadius: 12,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const val = (context.raw as number) || 0;
                return ` ${label}: ${formatCurrency(val)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#64748B',
              font: { size: 11 },
              maxTicksLimit: 14,
            },
          },
          y: {
            grid: {
              color: 'rgba(10, 31, 68, 0.06)',
            },
            ticks: {
              color: '#64748B',
              font: { size: 11 },
              callback: (value) => {
                const num = Number(value);
                if (num >= 1000000) return `R$ ${(num / 1000000).toFixed(1)}M`;
                if (num >= 1000) return `R$ ${(num / 1000).toFixed(0)}k`;
                return formatCurrency(num);
              },
            },
          },
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [result, activeView]);

  return (
    <div className="card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy/10 pb-3">
        <div>
          <h3 className="card-title text-navy">Curva de Crescimento Patrimonial</h3>
          <p className="card-sub text-xs text-muted">
            Veja a bola de neve dos juros compostos superando os aportes com o tempo
          </p>
        </div>

        {isLargePeriod && (
          <div className="inline-flex rounded-xl bg-navy/5 p-1">
            <button
              type="button"
              onClick={() => setViewMode('yearly')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                viewMode === 'yearly'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-muted hover:text-navy'
              }`}
            >
              Visão Anual
            </button>
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                viewMode === 'monthly'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-muted hover:text-navy'
              }`}
            >
              Visão Mensal ({result.totalMonths} meses)
            </button>
          </div>
        )}
      </div>

      <div className="relative h-[380px] w-full">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
