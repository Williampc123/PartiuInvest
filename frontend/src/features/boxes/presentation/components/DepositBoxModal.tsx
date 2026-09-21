import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Building2,
  Wallet,
  ArrowRight,
  User,
  AlertCircle,
  Layers,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { BoxGoal, BankAccount, FamilyMember } from '@/core/types';
import { useAppStore } from '@/features/auth/useAppStore';
import { Money } from '@/core/Money';
import {
  depositToBoxInFirestore,
  AccountDepositSource,
} from '@/features/dashboard/infrastructure/firestoreDataService';

interface DepositBoxModalProps {
  isOpen: boolean;
  box: BoxGoal | null;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const DepositBoxModal: React.FC<DepositBoxModalProps> = ({
  isOpen,
  box,
  onClose,
  onSuccess,
}) => {
  const { user, familyMembers, accounts, boxes, setBoxes, setAccounts } = useAppStore();

  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [totalAmountStr, setTotalAmountStr] = useState('');
  const [singleAccountId, setSingleAccountId] = useState(accounts[0]?.id || 'wallet');
  const [memberId, setMemberId] = useState(user?.memberId || familyMembers[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estado para alocações por conta no modo múltiplo: { [accountId]: amountStr }
  const [accountAllocations, setAccountAllocations] = useState<Record<string, string>>({});
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  useEffect(() => {
    if (accounts.length > 0 && selectedAccountIds.length === 0) {
      setSelectedAccountIds(accounts.slice(0, 2).map((a) => a.id));
    }
  }, [accounts]);

  if (!isOpen || !box) return null;

  const parseAmountToCents = (valStr: string): number => {
    const cleanStr = valStr.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : Math.round(num * 100);
  };

  const remainingToTargetCents = Math.max(0, box.targetAmountCents - box.currentBalanceCents);

  const handleQuickPercent = (pct: number) => {
    let targetCents = 0;
    if (pct === 100) {
      targetCents = remainingToTargetCents;
    } else {
      targetCents = Math.round((remainingToTargetCents * pct) / 100);
    }
    const str = (targetCents / 100).toFixed(2).replace('.', ',');
    setTotalAmountStr(str);

    if (mode === 'multi' && selectedAccountIds.length > 0) {
      distributeEqually(targetCents, selectedAccountIds);
    }
  };

  const distributeEqually = (totalCents: number, activeIds: string[]) => {
    if (activeIds.length === 0 || totalCents <= 0) return;
    const shareCents = Math.floor(totalCents / activeIds.length);
    let remainder = totalCents - shareCents * activeIds.length;

    const newAlloc: Record<string, string> = {};
    activeIds.forEach((id, idx) => {
      const amount = shareCents + (idx === 0 ? remainder : 0);
      newAlloc[id] = (amount / 100).toFixed(2).replace('.', ',');
    });
    setAccountAllocations(newAlloc);
  };

  const handleToggleAccountSelection = (accId: string) => {
    let newSelected: string[];
    if (selectedAccountIds.includes(accId)) {
      newSelected = selectedAccountIds.filter((id) => id !== accId);
    } else {
      newSelected = [...selectedAccountIds, accId];
    }
    setSelectedAccountIds(newSelected);

    const targetCents = parseAmountToCents(totalAmountStr);
    if (targetCents > 0) {
      distributeEqually(targetCents, newSelected);
    }
  };

  const handleAllocationChange = (accId: string, val: string) => {
    const clean = val.replace(/[^0-9.,]/g, '');
    const newAlloc = { ...accountAllocations, [accId]: clean };
    setAccountAllocations(newAlloc);

    // Recalcular o total a partir da soma
    let sumCents = 0;
    Object.entries(newAlloc).forEach(([id, amtStr]) => {
      if (selectedAccountIds.includes(id)) {
        sumCents += parseAmountToCents(amtStr);
      }
    });
    setTotalAmountStr((sumCents / 100).toFixed(2).replace('.', ','));
  };

  // Soma atual no modo múltiplo
  const currentMultiSumCents = selectedAccountIds.reduce((acc, id) => {
    return acc + parseAmountToCents(accountAllocations[id] || '0');
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let finalTotalCents = 0;
    let sources: AccountDepositSource[] = [];

    if (mode === 'single') {
      finalTotalCents = parseAmountToCents(totalAmountStr);
      if (finalTotalCents <= 0) {
        setErrorMsg('Informe um valor válido maior que zero.');
        return;
      }

      if (singleAccountId !== 'wallet') {
        const acc = accounts.find((a) => a.id === singleAccountId);
        if (acc && acc.balanceCents < finalTotalCents) {
          setErrorMsg(
            `Saldo insuficiente na conta ${acc.name} (${Money.formatCents(
              acc.balanceCents
            )} disponíveis).`
          );
          return;
        }
      }
      sources = [{ accountId: singleAccountId, amountCents: finalTotalCents }];
    } else {
      // Modo Multi-Contas
      if (selectedAccountIds.length === 0) {
        setErrorMsg('Selecione ao menos uma conta bancária ou dinheiro para aportar.');
        return;
      }

      finalTotalCents = currentMultiSumCents;
      if (finalTotalCents <= 0) {
        setErrorMsg('O valor total distribuído entre as contas deve ser maior que zero.');
        return;
      }

      for (const id of selectedAccountIds) {
        const amt = parseAmountToCents(accountAllocations[id] || '0');
        if (amt > 0) {
          if (id !== 'wallet') {
            const acc = accounts.find((a) => a.id === id);
            if (acc && acc.balanceCents < amt) {
              setErrorMsg(
                `Saldo insuficiente na conta ${acc.name}. Solicitado: ${Money.formatCents(
                  amt
                )}, Disponível: ${Money.formatCents(acc.balanceCents)}.`
              );
              return;
            }
          }
          sources.push({ accountId: id, amountCents: amt });
        }
      }

      if (sources.length === 0) {
        setErrorMsg('Preencha um valor maior que zero para as contas selecionadas.');
        return;
      }
    }

    setLoading(true);

    try {
      if (user?.familyId) {
        await depositToBoxInFirestore(
          user.familyId,
          box.id,
          box.currentBalanceCents,
          finalTotalCents,
          sources,
          memberId,
          box.name
        );
      }

      // Atualização otimista do estado local
      const updatedBoxes = boxes.map((b) =>
        b.id === box.id ? { ...b, currentBalanceCents: b.currentBalanceCents + finalTotalCents } : b
      );
      setBoxes(updatedBoxes);

      // Atualizar contas no estado local
      const updatedAccounts = accounts.map((a) => {
        const found = sources.find((s) => s.accountId === a.id);
        if (found) {
          return { ...a, balanceCents: Math.max(0, a.balanceCents - found.amountCents) };
        }
        return a;
      });
      setAccounts(updatedAccounts);

      onSuccess?.(
        `Guardado ${Money.formatCents(finalTotalCents)} na caixinha "${box.name}" através de ${
          sources.length > 1 ? `${sources.length} contas` : '1 conta'
        }!`
      );
      setTotalAmountStr('');
      onClose();
    } catch (err) {
      console.error('Erro ao guardar dinheiro na caixinha:', err);
      setErrorMsg('Ocorreu um erro ao processar o aporte. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="card w-full max-w-lg bg-white border-white/95 shadow-2xl p-6 rounded-[28px] relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 icon-btn text-muted hover:text-navy"
        >
          <X className="h-5 w-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="pill bg-gold/15 text-gold-deep text-[11px] font-bold mb-1 inline-block">
              {box.name}
            </span>
            <h3 className="text-lg font-bold text-navy flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-gold-deep" />
              Guardar Dinheiro / Aporte
            </h3>
            <p className="text-xs text-muted">
              Transfira de uma ou mais contas bancárias diretamente para sua caixinha.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Resumo da Caixinha */}
          <div className="p-3.5 rounded-2xl bg-navy/5 border border-navy/10 flex items-center justify-between text-xs">
            <div>
              <span className="text-muted block text-[11px]">Saldo Guardado</span>
              <strong className="text-sm text-navy font-bold">
                {Money.formatCents(box.currentBalanceCents)}
              </strong>
            </div>
            <ArrowRight className="h-4 w-4 text-muted" />
            <div className="text-right">
              <span className="text-muted block text-[11px]">Meta Total</span>
              <strong className="text-sm text-navy font-bold">
                {Money.formatCents(box.targetAmountCents)}
              </strong>
            </div>
          </div>

          {/* Alternador de Modo: Conta Única vs Múltiplas Contas */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-navy/5 border border-navy/10">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                mode === 'single'
                  ? 'bg-white text-navy shadow-sm border border-navy/10'
                  : 'text-muted hover:text-navy'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Conta Única</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('multi');
                const targetCents = parseAmountToCents(totalAmountStr);
                if (targetCents > 0 && selectedAccountIds.length > 0) {
                  distributeEqually(targetCents, selectedAccountIds);
                }
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                mode === 'multi'
                  ? 'bg-white text-navy shadow-sm border border-navy/10'
                  : 'text-muted hover:text-navy'
              }`}
            >
              <Layers className="h-4 w-4 text-gold-deep" />
              <span>Múltiplas Contas</span>
            </button>
          </div>

          {/* MODO 1: CONTA ÚNICA */}
          {mode === 'single' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-navy mb-1.5 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-gold-deep" />
                  Origem do Dinheiro / Conta Bancária
                </label>
                <select
                  value={singleAccountId}
                  onChange={(e) => setSingleAccountId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none font-medium"
                >
                  <option value="wallet">💵 Dinheiro Livre / Depósito Externo</option>
                  {accounts.map((acc: BankAccount) => (
                    <option key={acc.id} value={acc.id}>
                      🏦 {acc.name} — Saldo: {Money.formatCents(acc.balanceCents)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Quanto deseja guardar? (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-extrabold text-muted">
                    R$
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="0,00"
                    value={totalAmountStr}
                    onChange={(e) =>
                      setTotalAmountStr(e.target.value.replace(/[^0-9.,]/g, ''))
                    }
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-navy/15 bg-white text-xl font-extrabold text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* MODO 2: MÚLTIPLAS CONTAS */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-navy">
                  Selecione as Contas e os Valores
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const targetCents = parseAmountToCents(totalAmountStr) || remainingToTargetCents;
                    distributeEqually(targetCents, selectedAccountIds);
                  }}
                  className="text-[11px] text-gold-deep font-bold hover:underline flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" /> Dividir igualmente
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {/* Opção Dinheiro Livre */}
                <div
                  className={`p-2.5 rounded-2xl border transition flex items-center justify-between gap-2 ${
                    selectedAccountIds.includes('wallet')
                      ? 'bg-gold/10 border-gold/40'
                      : 'bg-navy/5 border-navy/10 opacity-70'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleAccountSelection('wallet')}
                    className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                  >
                    {selectedAccountIds.includes('wallet') ? (
                      <CheckSquare className="h-4 w-4 text-gold-deep shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-muted shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-navy block">
                        💵 Dinheiro Livre / Carteira
                      </span>
                      <small className="text-[10px] text-muted">Saldo manual</small>
                    </div>
                  </button>

                  {selectedAccountIds.includes('wallet') && (
                    <div className="w-32 shrink-0">
                      <input
                        type="text"
                        placeholder="R$ 0,00"
                        value={accountAllocations['wallet'] || ''}
                        onChange={(e) => handleAllocationChange('wallet', e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg border border-navy/15 bg-white text-xs font-bold text-navy focus:ring-1 focus:ring-gold focus:outline-none text-right"
                      />
                    </div>
                  )}
                </div>

                {/* Contas Bancárias Cadastradas */}
                {accounts.map((acc: BankAccount) => {
                  const isSelected = selectedAccountIds.includes(acc.id);
                  return (
                    <div
                      key={acc.id}
                      className={`p-2.5 rounded-2xl border transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-gold/10 border-gold/40'
                          : 'bg-navy/5 border-navy/10 opacity-70'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleAccountSelection(acc.id)}
                        className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-gold-deep shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-muted shrink-0" />
                        )}
                        <div className="min-w-0 truncate">
                          <span className="text-xs font-bold text-navy block truncate">
                            🏦 {acc.name}
                          </span>
                          <small className="text-[10px] text-muted block">
                            Disp: <strong className="text-navy">{Money.formatCents(acc.balanceCents)}</strong>
                          </small>
                        </div>
                      </button>

                      {isSelected && (
                        <div className="w-32 shrink-0">
                          <input
                            type="text"
                            placeholder="R$ 0,00"
                            value={accountAllocations[acc.id] || ''}
                            onChange={(e) => handleAllocationChange(acc.id, e.target.value)}
                            className="w-full h-8 px-2.5 rounded-lg border border-navy/15 bg-white text-xs font-bold text-navy focus:ring-1 focus:ring-gold focus:outline-none text-right"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Totalizador do Modo Multi */}
              <div className="p-3 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-between text-xs">
                <span className="font-semibold text-muted">Total a Guardar somando as contas:</span>
                <b className="text-sm font-extrabold text-navy">
                  {Money.formatCents(currentMultiSumCents)}
                </b>
              </div>
            </div>
          )}

          {/* Botões de Aporte Rápido */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] text-muted font-bold mr-1">Rápido:</span>
            <button
              type="button"
              onClick={() => handleQuickPercent(25)}
              className="btn-line text-[10px] h-6 px-2 rounded-lg"
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => handleQuickPercent(50)}
              className="btn-line text-[10px] h-6 px-2 rounded-lg"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => handleQuickPercent(100)}
              className="btn-line text-[10px] h-6 px-2 rounded-lg text-gold-deep border-gold/40"
            >
              Completar Meta ({Money.formatCents(remainingToTargetCents)})
            </button>
          </div>

          {/* Membro Responsável */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1 flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-muted" /> Quem está guardando este valor?
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-navy/15 bg-white text-xs font-semibold text-navy focus:ring-2 focus:ring-gold focus:outline-none"
            >
              {familyMembers.map((m: FamilyMember) => (
                <option key={m.id} value={m.id}>
                  {m.displayName} ({m.role === 'chefe-familia' ? 'Chefe' : m.role})
                </option>
              ))}
            </select>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-navy/10">
            <button
              type="button"
              onClick={onClose}
              className="btn-line text-xs h-10 px-4"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-gold text-xs h-10 px-5"
            >
              {loading ? 'Processando...' : 'Confirmar Aporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
