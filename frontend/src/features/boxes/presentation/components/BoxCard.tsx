import React from 'react';
import { BoxGoal } from '@/core/types';
import { Money } from '@/core/Money';
import { PlusCircle, ArrowDownCircle } from 'lucide-react';
import { getCategoryIconComponent } from '@/core/categories';

interface BoxCardProps {
  box: BoxGoal;
  onDeposit?: (box: BoxGoal) => void;
  onWithdraw?: (box: BoxGoal) => void;
  onDetails?: (box: BoxGoal) => void;
}

export const BoxCard: React.FC<BoxCardProps> = ({
  box,
  onDeposit,
  onWithdraw,
  onDetails,
}) => {
  const percentage = Math.min(
    100,
    Math.round((box.currentBalanceCents / (box.targetAmountCents || 1)) * 100)
  );

  const renderIcon = () => {
    const IconComp = getCategoryIconComponent(box.icon || box.category);
    return <IconComp className="h-5 w-5" style={{ color: box.color || undefined }} />;
  };

  return (
    <div className="card hover:shadow-lg transition flex flex-col justify-between group relative overflow-hidden border border-navy/10">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-2xl bg-white/90 border border-navy/10 shadow-sm"
            style={{ borderColor: box.color }}
          >
            {renderIcon()}
          </div>
          <span className="pill bg-navy/5 text-navy text-[11px] font-bold">
            {percentage}% concluído
          </span>
        </div>

        <h4 className="text-sm font-bold text-navy truncate" title={box.name}>
          {box.name}
        </h4>
        <p className="text-[11px] text-muted">
          Meta: {box.targetDate ? `Até ${box.targetDate}` : 'Longo prazo'}
        </p>

        {/* Valores */}
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-base font-extrabold text-navy">
            {Money.formatCents(box.currentBalanceCents)}
          </span>
          <span className="text-xs text-muted">
            de {Money.formatCents(box.targetAmountCents)}
          </span>
        </div>

        {/* Barra de Progresso */}
        <div className="bar mt-2">
          <i
            style={{
              width: `${percentage}%`,
              background: box.color || undefined,
            }}
          />
        </div>
      </div>

      {/* Ações */}
      <div className="mt-4 pt-3 border-t border-navy/10 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => onDeposit?.(box)}
          className="link text-xs font-bold text-gold-deep flex items-center gap-1 hover:underline"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Guardar</span>
        </button>

        <div className="flex items-center gap-1.5">
          {box.currentBalanceCents > 0 && onWithdraw && (
            <button
              type="button"
              onClick={() => onWithdraw(box)}
              title="Resgatar valor"
              className="btn-line text-[11px] h-[30px] px-2 rounded-lg text-blue hover:text-blue-deep border-blue/20"
            >
              <ArrowDownCircle className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onDetails?.(box)}
            className="btn-line text-[11px] h-[30px] px-2.5 rounded-lg"
          >
            Detalhes
          </button>
        </div>
      </div>
    </div>
  );
};
