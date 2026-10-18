import React, { useState, useEffect } from 'react';
import { Target, Coins, PiggyBank, MoreVertical, Plus, Wallet, Trash2 } from 'lucide-react';
import { CriarMetaModal, MetaItem } from '../modals/CriarMetaModal';
import {
  getStoredGoals,
  saveGoal,
  deleteGoal,
  InvestmentGoal,
} from '../../../infrastructure/investmentsService';
import { PortfolioPosition } from '../../../domain/types';

interface MetasTabProps {
  familyId: string;
  positions: PortfolioPosition[];
  totalPortfolioValue: number;
}

export const MetasTab: React.FC<MetasTabProps> = ({
  familyId,
  positions,
  totalPortfolioValue,
}) => {
  const [metas, setMetas] = useState<InvestmentGoal[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGoals = async () => {
      setLoading(true);
      try {
        const list = await getStoredGoals(familyId);
        setMetas(list);
      } catch {}
      setLoading(false);
    };
    loadGoals();
  }, [familyId]);

  const handleSaveMeta = async (newMetaItem: MetaItem) => {
    const goal: InvestmentGoal = {
      id: newMetaItem.id,
      type: newMetaItem.type,
      title: newMetaItem.title,
      category: newMetaItem.category,
      targetAmount: newMetaItem.targetAmount,
      monthlyDeposit: newMetaItem.monthlyDeposit,
      annualRate: newMetaItem.annualRate,
      assetType: newMetaItem.assetType,
      ticker: newMetaItem.ticker,
      selectedAssetTypes: newMetaItem.selectedAssetTypes,
      createdAt: new Date().toISOString(),
    };

    await saveGoal(familyId, goal);
    setMetas((prev) => [goal, ...prev.filter((g) => g.id !== goal.id)]);
  };

  const handleDeleteMeta = async (id: string) => {
    await deleteGoal(familyId, id);
    setMetas((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6 text-navy">
      {/* Topo: Título da Seção & Botão Criar Nova Meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-black text-navy">Metas em Andamento</h3>
          <span className="text-xs text-muted font-bold">({metas.length})</span>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl btn-gold font-bold text-xs transition active:scale-95 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Criar nova meta</span>
        </button>
      </div>

      {/* Lista de Cards de Metas */}
      {metas.length > 0 ? (
        <div className="space-y-4">
          {metas.map((meta) => {
            // Calcula o progresso real com base na carteira atual
            let currentVal = 0;
            if (meta.type === 'patrimonio') {
              currentVal = totalPortfolioValue;
            } else if (meta.type === 'proventos') {
              // Média mensal dos proventos estimados
              const annualDiv = positions.reduce((acc, p) => acc + (p.annualEstimatedDividends || 0), 0);
              currentVal = annualDiv / 12;
            } else if (meta.type === 'ativos') {
              if (meta.ticker) {
                const found = positions.find((p) => p.ticker.toUpperCase() === meta.ticker?.toUpperCase());
                currentVal = found ? found.totalCurrentValue : 0;
              } else if (meta.assetType) {
                const filtered = positions.filter((p) => p.type === meta.assetType);
                currentVal = filtered.reduce((acc, p) => acc + p.totalCurrentValue, 0);
              }
            }

            const targetVal = meta.targetAmount || 1;
            const progressPct = Math.min(100, Math.max(0, (currentVal / targetVal) * 100));
            const remaining = Math.max(0, targetVal - currentVal);

            const formattedCurrent = currentVal.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            });
            const formattedTarget = targetVal.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            });
            const formattedRemaining = remaining.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            });
            const formattedMonthly = (meta.monthlyDeposit || 0).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            });

            return (
              <div
                key={meta.id}
                className="rounded-2xl bg-white/85 border border-white/95 p-5 shadow-[inset_0_1px_0_#fff,0_8px_20px_-10px_rgba(10,31,68,.12)] space-y-4 hover:border-navy/20 transition"
              >
                {/* Header do Card */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center text-navy shadow-xs">
                      {meta.type === 'proventos' ? (
                        <Coins className="h-4 w-4 text-gold-deep" />
                      ) : meta.type === 'ativos' ? (
                        <Wallet className="h-4 w-4 text-navy" />
                      ) : (
                        <PiggyBank className="h-4 w-4 text-ok" />
                      )}
                    </div>
                    <div>
                      <span className="font-black text-navy text-xs sm:text-sm block">
                        {meta.title}
                      </span>
                      {meta.category && (
                        <span className="text-[10px] text-muted font-bold">{meta.category}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDeleteMeta(meta.id)}
                      title="Excluir meta"
                      className="text-muted hover:text-danger p-1 rounded-xl hover:bg-danger/10 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs font-black text-navy">
                      {progressPct.toFixed(2).replace('.', ',')}%
                    </span>
                    <span className="text-[11px] text-muted font-semibold">
                      {formattedCurrent} de {formattedTarget}
                    </span>
                  </div>

                  <div className="h-3 w-full rounded-full bg-navy/10 overflow-hidden">
                    <div
                      style={{ width: `${progressPct}%` }}
                      className="h-full bg-ok rounded-full transition-all duration-500 shadow-xs"
                    />
                  </div>
                </div>

                {/* Sub-cards Informativos */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50/70 border border-navy/10">
                    <span className="text-[10px] text-muted block uppercase font-bold">Atual</span>
                    <b className="text-xs font-black text-navy mt-0.5 block">{formattedCurrent}</b>
                  </div>

                  {meta.monthlyDeposit ? (
                    <div className="p-3 rounded-xl bg-slate-50/70 border border-navy/10">
                      <span className="text-[10px] text-muted block uppercase font-bold">Aporte mensal</span>
                      <b className="text-xs font-black text-navy mt-0.5 block">{formattedMonthly}</b>
                    </div>
                  ) : null}

                  <div className="p-3 rounded-xl bg-slate-50/70 border border-navy/10">
                    <span className="text-[10px] text-muted block uppercase font-bold">Faltam</span>
                    <b className="text-xs font-black text-navy mt-0.5 block">{formattedRemaining}</b>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/70 border border-navy/10">
                    <span className="text-[10px] text-muted block uppercase font-bold">Objetivo</span>
                    <b className="text-xs font-black text-navy mt-0.5 block">{formattedTarget}</b>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-white/85 border border-white/95 p-10 text-center space-y-3 shadow-[inset_0_1px_0_#fff,0_8px_20px_-10px_rgba(10,31,68,.10)]">
          <Target className="h-10 w-10 text-navy/40 mx-auto" />
          <h4 className="text-base font-black text-navy">Nenhuma meta criada</h4>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Defina metas de patrimônio, ativos ou proventos mensais para acompanhar sua evolução financeira.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl btn-gold font-bold text-xs transition shadow-sm active:scale-95"
            >
              Criar primeira meta
            </button>
          </div>
        </div>
      )}

      {/* Modal Criar Meta */}
      <CriarMetaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSaveMeta={handleSaveMeta}
      />
    </div>
  );
};
