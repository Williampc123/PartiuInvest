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
    <div className="space-y-6 text-slate-200">
      {/* Topo: Título da Seção & Botão Criar Nova Meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-black text-white">Metas em Andamento</h3>
          <span className="text-xs text-slate-400 font-medium">({metas.length})</span>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95 shadow"
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
                className="rounded-2xl bg-[#141A26] border border-[#212B3E] p-5 shadow-sm space-y-4 hover:border-slate-700 transition"
              >
                {/* Header do Card */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#1C2538] border border-[#2B3852] flex items-center justify-center text-slate-300">
                      {meta.type === 'proventos' ? (
                        <Coins className="h-4 w-4 text-slate-400" />
                      ) : meta.type === 'ativos' ? (
                        <Wallet className="h-4 w-4 text-slate-400" />
                      ) : (
                        <PiggyBank className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs sm:text-sm block">
                        {meta.title}
                      </span>
                      {meta.category && (
                        <span className="text-[10px] text-slate-400">{meta.category}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDeleteMeta(meta.id)}
                      title="Excluir meta"
                      className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs font-black text-white">
                      {progressPct.toFixed(2).replace('.', ',')}%
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formattedCurrent} de {formattedTarget}
                    </span>
                  </div>

                  <div className="h-3 w-full rounded-full bg-[#0D121B] overflow-hidden">
                    <div
                      style={{ width: `${progressPct}%` }}
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Sub-cards Informativos */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-[#0F141E] border border-[#1E2638]">
                    <span className="text-[10px] text-slate-400 block uppercase">Atual</span>
                    <b className="text-xs font-bold text-white mt-0.5 block">{formattedCurrent}</b>
                  </div>

                  {meta.monthlyDeposit ? (
                    <div className="p-3 rounded-xl bg-[#0F141E] border border-[#1E2638]">
                      <span className="text-[10px] text-slate-400 block uppercase">Aporte mensal</span>
                      <b className="text-xs font-bold text-white mt-0.5 block">{formattedMonthly}</b>
                    </div>
                  ) : null}

                  <div className="p-3 rounded-xl bg-[#0F141E] border border-[#1E2638]">
                    <span className="text-[10px] text-slate-400 block uppercase">Faltam</span>
                    <b className="text-xs font-bold text-white mt-0.5 block">{formattedRemaining}</b>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0F141E] border border-[#1E2638]">
                    <span className="text-[10px] text-slate-400 block uppercase">Objetivo</span>
                    <b className="text-xs font-bold text-white mt-0.5 block">{formattedTarget}</b>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#141A26] border border-[#212B3E] p-10 text-center space-y-3">
          <Target className="h-10 w-10 text-slate-500 mx-auto" />
          <h4 className="text-base font-bold text-white">Nenhuma meta criada</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Defina metas de patrimônio, ativos ou proventos mensais para acompanhar sua evolução financeira.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
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
