import React, { useState, useEffect } from 'react';
import { X, Building2, CheckCircle2, DollarSign, Sparkles, Plus, Minus, ArrowRightLeft } from 'lucide-react';
import { BankAccount } from '@/core/types';
import { Money } from '@/core/Money';
import { useAppStore } from '@/features/auth/useAppStore';
import { adjustAccountBalanceInFirestore } from '@/features/dashboard/infrastructure/firestoreDataService';

interface AdjustAccountBalanceModalProps {
  isOpen: boolean;
  account: BankAccount | null;
  onClose: () => void;
  onSuccess?: (newBalanceCents: number) => void;
}

export const AdjustAccountBalanceModal: React.FC<AdjustAccountBalanceModalProps> = ({
  isOpen,
  account,
  onClose,
  onSuccess,
}) => {
  const { user } = useAppStore();
  const [balanceInput, setBalanceInput] = useState('');
  const [mode, setMode] = useState<'set_exact' | 'add' | 'subtract'>('set_exact');
  const [adjustAmountInput, setAdjustAmountInput] = useState('');
  const [createTransaction, setCreateTransaction] = useState(true);
  const [customNote, setCustomNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (account && isOpen) {
      setBalanceInput((account.balanceCents / 100).toFixed(2).replace('.', ','));
      setAdjustAmountInput('');
      setMode('set_exact');
      setCustomNote('');
      setErrorMsg(null);
    }
  }, [account, isOpen]);

  if (!isOpen || !account) return null;

  const parseToCents = (valStr: string): number => {
    const cleanStr = valStr.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : Math.round(num * 100);
  };

  const currentBalCents = account.balanceCents || 0;

  // Cálculo do saldo final simulado
  let calculatedNewBalanceCents = currentBalCents;
  if (mode === 'set_exact') {
    calculatedNewBalanceCents = parseToCents(balanceInput);
  } else if (mode === 'add') {
    calculatedNewBalanceCents = currentBalCents + parseToCents(adjustAmountInput);
  } else if (mode === 'subtract') {
    calculatedNewBalanceCents = Math.max(0, currentBalCents - parseToCents(adjustAmountInput));
  }

  const diffCents = calculatedNewBalanceCents - currentBalCents;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.familyId) return;

    if (calculatedNewBalanceCents < 0) {
      setErrorMsg('O saldo não pode ser negativo.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await adjustAccountBalanceInFirestore(
        user.familyId,
        account.id,
        calculatedNewBalanceCents,
        createTransaction,
        account.ownerMemberId || user.memberId || 'head',
        customNote.trim() || undefined
      );

      onSuccess?.(calculatedNewBalanceCents);
      onClose();
    } catch (err) {
      console.error('Erro ao ajustar saldo da conta:', err);
      setErrorMsg('Ocorreu um erro ao atualizar o saldo. Tente novamente.');
    } finally {
      setLoading(false);
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

        <div className="flex items-center gap-3 mb-4">
          <div
            className="h-11 w-11 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-sm shrink-0"
            style={{ backgroundColor: account.color || '#0A1F44' }}
          >
            {account.institutionName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-bold text-navy">Ajustar Saldo da Conta</h3>
            <p className="text-xs text-muted">
              {account.name} • {account.institutionName}
            </p>
          </div>
        </div>

        {/* Saldo Atual */}
        <div className="p-3.5 rounded-2xl bg-navy/5 border border-navy/10 mb-4 flex items-center justify-between">
          <div>
            <small className="text-[11px] font-semibold text-muted block">Saldo Atual Registrado</small>
            <b className="text-lg font-extrabold text-navy">{Money.formatCents(currentBalCents)}</b>
          </div>
          <span className="pill text-[11px] bg-white border border-navy/10 font-bold text-navy">
            {account.visibility === 'family' ? '👨‍👩‍👧 Compartilhada' : '🔒 Individual'}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Modos de Ajuste */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-navy/5 border border-navy/10 text-xs">
            <button
              type="button"
              onClick={() => setMode('set_exact')}
              className={`py-2 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                mode === 'set_exact' ? 'bg-navy text-white shadow-sm' : 'text-muted hover:text-navy'
              }`}
            >
              <span>Definir Saldo</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('add')}
              className={`py-2 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                mode === 'add' ? 'bg-ok text-white shadow-sm' : 'text-muted hover:text-navy'
              }`}
            >
              <Plus className="h-3 w-3" />
              <span>Adicionar</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('subtract')}
              className={`py-2 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                mode === 'subtract' ? 'bg-danger text-white shadow-sm' : 'text-muted hover:text-navy'
              }`}
            >
              <Minus className="h-3 w-3" />
              <span>Subtrair</span>
            </button>
          </div>

          {/* Campo de Entrada de Valor */}
          {mode === 'set_exact' ? (
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Novo Saldo Disponível na Conta (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">
                  R$
                </span>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={balanceInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, '');
                    setBalanceInput(val);
                  }}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-navy/15 bg-white text-lg font-extrabold text-navy focus:ring-2 focus:ring-gold focus:outline-none placeholder:text-muted/50"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                {mode === 'add' ? 'Valor a Adicionar (R$)' : 'Valor a Subtrair (R$)'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">
                  R$
                </span>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={adjustAmountInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, '');
                    setAdjustAmountInput(val);
                  }}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-navy/15 bg-white text-lg font-extrabold text-navy focus:ring-2 focus:ring-gold focus:outline-none placeholder:text-muted/50"
                />
              </div>
            </div>
          )}

          {/* Prévia do Novo Saldo */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/30 flex items-center justify-between">
            <span className="text-xs font-semibold text-navy">Novo Saldo Final:</span>
            <div className="text-right">
              <b className="text-base font-extrabold text-navy">
                {Money.formatCents(calculatedNewBalanceCents)}
              </b>
              {diffCents !== 0 && (
                <small className={`block text-[11px] font-bold ${diffCents > 0 ? 'text-ok' : 'text-danger'}`}>
                  {diffCents > 0 ? `+ ${Money.formatCents(diffCents)}` : `- ${Money.formatCents(Math.abs(diffCents))}`}
                </small>
              )}
            </div>
          </div>

          {/* Opção de Registrar Lançamento de Ajuste */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-navy/5 border border-navy/10">
            <input
              type="checkbox"
              id="createTransCheckbox"
              checked={createTransaction}
              onChange={(e) => setCreateTransaction(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-navy/20 text-gold focus:ring-gold"
            />
            <label htmlFor="createTransCheckbox" className="text-xs text-navy cursor-pointer">
              <b className="block">Registrar lançamento no Extrato de Movimentações</b>
              <span className="text-muted text-[11px]">
                Gera um lançamento automático de ajuste para manter o histórico financeiro consistente.
              </span>
            </label>
          </div>

          {createTransaction && (
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Motivo / Descrição do Ajuste (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Aporte avulso para investimento, Acerto de saldo..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-navy/15 bg-white text-xs text-navy focus:ring-2 focus:ring-gold focus:outline-none"
              />
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-danger font-medium">{errorMsg}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-line flex-1 text-xs h-11"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-gold flex-1 text-xs h-11 font-bold gap-1.5 shadow-md"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{loading ? 'Salvando...' : 'Confirmar Ajuste'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
