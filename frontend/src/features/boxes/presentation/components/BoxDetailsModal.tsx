import React from 'react';
import {
  X,
  Calendar,
  User,
  PlusCircle,
  ArrowDownCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { BoxGoal, FamilyMember } from '@/core/types';
import { useAppStore } from '@/features/auth/useAppStore';
import { Money } from '@/core/Money';
import { deleteBoxFromFirestore } from '@/features/dashboard/infrastructure/firestoreDataService';
import { getCategoryIconComponent } from '@/core/categories';

interface BoxDetailsModalProps {
  isOpen: boolean;
  box: BoxGoal | null;
  onClose: () => void;
  onDeposit: (box: BoxGoal) => void;
  onWithdraw: (box: BoxGoal) => void;
  onEdit: (box: BoxGoal) => void;
  onSuccess?: (msg: string) => void;
}

export const BoxDetailsModal: React.FC<BoxDetailsModalProps> = ({
  isOpen,
  box,
  onClose,
  onDeposit,
  onWithdraw,
  onEdit,
  onSuccess,
}) => {
  const { user, familyMembers, boxes, setBoxes } = useAppStore();

  if (!isOpen || !box) return null;

  const percentage = Math.min(
    100,
    Math.round((box.currentBalanceCents / (box.targetAmountCents || 1)) * 100)
  );

  const remainingCents = Math.max(0, box.targetAmountCents - box.currentBalanceCents);
  const owner = familyMembers.find((m: FamilyMember) => m.id === box.ownerMemberId);

  const renderIcon = () => {
    const IconComp = getCategoryIconComponent(box.icon || box.category);
    return <IconComp className="h-6 w-6" style={{ color: box.color || undefined }} />;
  };

  const handleDelete = async () => {
    if (confirm(`Deseja realmente excluir a caixinha "${box.name}"?`)) {
      try {
        if (user?.familyId) {
          await deleteBoxFromFirestore(user.familyId, box.id);
        }
        setBoxes(boxes.filter((b) => b.id !== box.id));
        onSuccess?.(`Caixinha "${box.name}" excluída.`);
        onClose();
      } catch (err) {
        console.error('Erro ao excluir caixinha:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="card w-full max-w-md bg-white border-white/95 shadow-2xl p-6 rounded-[28px] relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 icon-btn text-muted hover:text-navy"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-4">
          {/* Topo do Modal */}
          <div className="flex items-center gap-3">
            <div
              className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 border border-navy/10 shadow-sm shrink-0"
              style={{ borderColor: box.color }}
            >
              {renderIcon()}
            </div>
            <div className="min-w-0 pr-6">
              <h3 className="text-lg font-bold text-navy truncate">{box.name}</h3>
              <p className="text-xs text-muted flex items-center gap-1.5">
                <span className="pill bg-navy/5 text-navy text-[10px] font-bold">
                  {box.visibility === 'family' ? '👨‍👩‍👧 Compartilhada' : '🔒 Individual'}
                </span>
                <span>• {owner?.displayName || 'Família'}</span>
              </p>
            </div>
          </div>

          {/* Card de Progresso Financeiro */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-navy/5 to-navy/[0.02] border border-navy/10 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <small className="text-[11px] text-muted block">Acumulado</small>
                <b className="text-2xl font-extrabold text-navy">
                  {Money.formatCents(box.currentBalanceCents)}
                </b>
              </div>
              <div className="text-right">
                <small className="text-[11px] text-muted block">Meta Total</small>
                <span className="text-sm font-bold text-muted">
                  {Money.formatCents(box.targetAmountCents)}
                </span>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="w-full bg-navy/10 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-gold to-gold-deep rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-bold text-navy">{percentage}% Concluído</span>
              <span>Faltam {Money.formatCents(remainingCents)}</span>
            </div>
          </div>

          {/* Detalhes de Informações */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-navy/5 border border-navy/10">
              <span className="text-muted block text-[10px] flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Prazo Alvo
              </span>
              <strong className="text-navy font-semibold mt-0.5 block">
                {box.targetDate ? `Até ${box.targetDate}` : 'Sem prazo definido'}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-navy/5 border border-navy/10">
              <span className="text-muted block text-[10px] flex items-center gap-1">
                <User className="h-3 w-3" /> Titular Responsável
              </span>
              <strong className="text-navy font-semibold mt-0.5 block truncate">
                {owner?.displayName || 'Todos os membros'}
              </strong>
            </div>
          </div>

          {/* Ações Principais: Guardar e Resgatar */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onDeposit(box);
              }}
              className="btn-gold text-xs h-11 px-3 gap-1.5 justify-center shadow-md"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Guardar Dinheiro</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onWithdraw(box);
              }}
              disabled={box.currentBalanceCents <= 0}
              className="btn-line text-xs h-11 px-3 gap-1.5 justify-center border-navy/20 hover:border-navy/40 disabled:opacity-50"
            >
              <ArrowDownCircle className="h-4 w-4 text-blue" />
              <span>Resgatar Valor</span>
            </button>
          </div>

          {/* Ações Secundárias: Editar e Excluir */}
          <div className="flex items-center justify-between pt-3 border-t border-navy/10 text-xs">
            <button
              type="button"
              onClick={handleDelete}
              className="text-danger hover:underline flex items-center gap-1 font-medium"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Excluir Caixinha</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(box);
              }}
              className="btn-line text-xs h-8 px-3 gap-1 rounded-lg"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Editar Meta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
