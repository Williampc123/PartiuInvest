import React, { useState } from 'react';
import { BoxCard } from '../components/BoxCard';
import { NewBoxModal } from '../components/NewBoxModal';
import { DepositBoxModal } from '../components/DepositBoxModal';
import { WithdrawBoxModal } from '../components/WithdrawBoxModal';
import { BoxDetailsModal } from '../components/BoxDetailsModal';
import { useAppStore } from '@/features/auth/useAppStore';
import {
  Target,
  Plus,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Plane,
  GraduationCap,
  Wallet,
} from 'lucide-react';
import { Money } from '@/core/Money';
import { BoxGoal } from '@/core/types';

export const BoxesPage: React.FC = () => {
  const { boxes, selectedMemberId } = useAppStore();

  // Estados dos Modais
  const [isNewBoxModalOpen, setIsNewBoxModalOpen] = useState(false);
  const [editingBox, setEditingBox] = useState<BoxGoal | null>(null);
  const [depositTargetBox, setDepositTargetBox] = useState<BoxGoal | null>(null);
  const [withdrawTargetBox, setWithdrawTargetBox] = useState<BoxGoal | null>(null);
  const [detailsTargetBox, setDetailsTargetBox] = useState<BoxGoal | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const filteredBoxes =
    selectedMemberId === 'all'
      ? boxes
      : boxes.filter((b: BoxGoal) => b.ownerMemberId === selectedMemberId);

  const totalSavedCents = filteredBoxes.reduce(
    (acc: number, curr: BoxGoal) => acc + (curr.currentBalanceCents || 0),
    0
  );
  const totalTargetCents = filteredBoxes.reduce(
    (acc: number, curr: BoxGoal) => acc + (curr.targetAmountCents || 0),
    0
  );
  const globalProgress =
    totalTargetCents > 0 ? Math.min(100, Math.round((totalSavedCents / totalTargetCents) * 100)) : 0;

  const emergencyBoxes = filteredBoxes.filter((b) => b.category === 'emergency');
  const dreamBoxes = filteredBoxes.filter((b) => b.category === 'dream');
  const investmentBoxes = filteredBoxes.filter((b) => b.category === 'investment');
  const educationBoxes = filteredBoxes.filter((b) => b.category === 'education');

  const handleOpenEdit = (box: BoxGoal) => {
    setEditingBox(box);
    setIsNewBoxModalOpen(true);
  };

  const handleCloseNewBoxModal = () => {
    setIsNewBoxModalOpen(false);
    setEditingBox(null);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-navy text-white px-4 py-3 shadow-2xl flex items-center gap-2.5 text-sm animate-in fade-in slide-in-from-bottom-3 border border-gold/40">
          <Sparkles className="h-4 w-4 text-gold shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Cabeçalho da Página */}
      <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-gold-light to-gold text-navy-deep shadow-md">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy">Caixinhas & Metas Financeiras</h2>
            <p className="text-xs text-muted">
              Organize suas metas por objetivos, aportes automáticos de contas bancárias e sonhos da
              família.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingBox(null);
            setIsNewBoxModalOpen(true);
          }}
          className="btn-gold text-xs h-[38px] px-4 gap-1.5 shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>Criar Nova Caixinha</span>
        </button>
      </div>

      {/* Cards de Métricas Resumidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="card !p-4 bg-gradient-to-br from-white/90 to-white/60">
          <small className="text-xs text-muted block">Total Guardado em Caixinhas</small>
          <b className="text-2xl font-extrabold text-navy tracking-tight mt-0.5 block">
            {Money.formatCents(totalSavedCents)}
          </b>
          <span className="text-[11px] text-muted mt-1 block">
            Meta global de {Money.formatCents(totalTargetCents)} ({globalProgress}%)
          </span>
        </div>

        <div className="card !p-4 bg-gradient-to-br from-white/90 to-white/60">
          <small className="text-xs text-muted block">Progresso Médio das Metas</small>
          <div className="flex items-center gap-2 mt-0.5">
            <b className="text-2xl font-extrabold text-gold-deep tracking-tight">
              {globalProgress}%
            </b>
            <span className="pill bg-gold/10 text-gold-deep text-[11px] font-bold">
              {filteredBoxes.length} Caixinha{filteredBoxes.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="bar mt-2">
            <i style={{ width: `${globalProgress}%` }} />
          </div>
        </div>

        <div className="card !p-4 bg-gradient-to-br from-white/90 to-white/60">
          <small className="text-xs text-muted block">Categorias Ativas</small>
          <div className="flex items-center gap-2 mt-1">
            <span className="pill bg-gold/15 text-gold-deep text-[10px] font-semibold">
              🛡️ {emergencyBoxes.length} Reserva
            </span>
            <span className="pill bg-blue/15 text-blue text-[10px] font-semibold">
              ✈️ {dreamBoxes.length} Sonhos
            </span>
            <span className="pill bg-navy/10 text-navy text-[10px] font-semibold">
              📈 {investmentBoxes.length + educationBoxes.length} Futuro
            </span>
          </div>
          <span className="text-[11px] text-muted mt-1.5 block">
            Foco equilibrado entre segurança e projetos
          </span>
        </div>
      </div>

      {/* Grid de Caixinhas */}
      {filteredBoxes.length === 0 ? (
        <div className="card text-center py-12 space-y-3">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold/15 text-gold-deep">
            <Wallet className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-navy">Nenhuma caixinha cadastrada</h3>
          <p className="text-xs text-muted max-w-md mx-auto">
            Crie caixinhas para sua reserva de emergência, viagens, projetos futuros ou educação dos filhos.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setEditingBox(null);
                setIsNewBoxModalOpen(true);
              }}
              className="btn-gold text-xs h-9 px-4 gap-1.5 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Minha Primeira Caixinha</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBoxes.map((box: BoxGoal) => (
            <BoxCard
              key={box.id}
              box={box}
              onDeposit={(target) => setDepositTargetBox(target)}
              onWithdraw={(target) => setWithdrawTargetBox(target)}
              onDetails={(target) => setDetailsTargetBox(target)}
            />
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição de Caixinha */}
      <NewBoxModal
        isOpen={isNewBoxModalOpen}
        editingBox={editingBox}
        onClose={handleCloseNewBoxModal}
        onSuccess={showToast}
      />

      {/* Modal de Depósito / Aporte */}
      <DepositBoxModal
        isOpen={!!depositTargetBox}
        box={depositTargetBox}
        onClose={() => setDepositTargetBox(null)}
        onSuccess={showToast}
      />

      {/* Modal de Resgate */}
      <WithdrawBoxModal
        isOpen={!!withdrawTargetBox}
        box={withdrawTargetBox}
        onClose={() => setWithdrawTargetBox(null)}
        onSuccess={showToast}
      />

      {/* Modal de Detalhes da Caixinha */}
      <BoxDetailsModal
        isOpen={!!detailsTargetBox}
        box={detailsTargetBox}
        onClose={() => setDetailsTargetBox(null)}
        onDeposit={(target) => setDepositTargetBox(target)}
        onWithdraw={(target) => setWithdrawTargetBox(target)}
        onEdit={(target) => handleOpenEdit(target)}
        onSuccess={showToast}
      />
    </div>
  );
};
