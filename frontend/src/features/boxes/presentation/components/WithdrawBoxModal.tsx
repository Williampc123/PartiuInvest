import React, { useState } from 'react';
import {
  X,
  ArrowDownCircle,
  Building2,
  Wallet,
  AlertCircle,
  User,
} from 'lucide-react';
import { BoxGoal, BankAccount, FamilyMember } from '@/core/types';
import { useAppStore } from '@/features/auth/useAppStore';
import { Money } from '@/core/Money';
import { withdrawFromBoxInFirestore } from '@/features/dashboard/infrastructure/firestoreDataService';

interface WithdrawBoxModalProps {
  isOpen: boolean;
  box: BoxGoal | null;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const WithdrawBoxModal: React.FC<WithdrawBoxModalProps> = ({
  isOpen,
  box,
  onClose,
  onSuccess,
}) => {
  const { user, familyMembers, accounts, boxes, setBoxes, setAccounts } = useAppStore();

  const [amountStr, setAmountStr] = useState('');
  const [destAccountId, setDestAccountId] = useState(accounts[0]?.id || 'wallet');
  const [memberId, setMemberId] = useState(user?.memberId || familyMembers[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !box) return null;

  const parseAmountToCents = (valStr: string): number => {
    const cleanStr = valStr.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : Math.round(num * 100);
  };

  const handleAllBalance = () => {
    setAmountStr((box.currentBalanceCents / 100).toFixed(2).replace('.', ','));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const amountCents = parseAmountToCents(amountStr);

    if (amountCents <= 0) {
      setErrorMsg('Informe um valor válido maior que zero.');
      return;
    }

    if (amountCents > box.currentBalanceCents) {
      setErrorMsg(
        `O valor solicitado (${Money.formatCents(
          amountCents
        )}) é maior que o saldo guardado nesta caixinha (${Money.formatCents(
          box.currentBalanceCents
        )}).`
      );
      return;
    }

    setLoading(true);

    try {
      if (user?.familyId) {
        await withdrawFromBoxInFirestore(
          user.familyId,
          box.id,
          box.currentBalanceCents,
          amountCents,
          destAccountId,
          memberId,
          box.name
        );
      }

      // Atualização otimista
      const updatedBoxes = boxes.map((b) =>
        b.id === box.id
          ? { ...b, currentBalanceCents: Math.max(0, b.currentBalanceCents - amountCents) }
          : b
      );
      setBoxes(updatedBoxes);

      if (destAccountId !== 'wallet') {
        const updatedAccounts = accounts.map((a) =>
          a.id === destAccountId ? { ...a, balanceCents: a.balanceCents + amountCents } : a
        );
        setAccounts(updatedAccounts);
      }

      onSuccess?.(
        `Resgate de ${Money.formatCents(amountCents)} realizado com sucesso!`
      );
      setAmountStr('');
      onClose();
    } catch (err) {
      console.error('Erro ao resgatar valor da caixinha:', err);
      setErrorMsg('Ocorreu um erro ao processar o resgate. Tente novamente.');
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="pill bg-navy/5 text-navy text-[11px] font-bold mb-1 inline-block">
              {box.name}
            </span>
            <h3 className="text-lg font-bold text-navy flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-blue" />
              Resgatar / Retirar Dinheiro
            </h3>
            <p className="text-xs text-muted">
              Transfira o valor acumulado para uma conta bancária ou utilize para seu objetivo.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Saldo Disponível na Caixinha */}
          <div className="p-3.5 rounded-2xl bg-blue/10 border border-blue/20 flex items-center justify-between text-xs">
            <div>
              <span className="text-muted block text-[11px]">Saldo Disponível na Caixinha</span>
              <strong className="text-base text-navy font-bold">
                {Money.formatCents(box.currentBalanceCents)}
              </strong>
            </div>
            <button
              type="button"
              onClick={handleAllBalance}
              className="btn-line text-[11px] h-7 px-2.5 rounded-lg text-blue font-bold border-blue/30"
            >
              Resgatar Tudo
            </button>
          </div>

          {/* Valor a Resgatar */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1">
              Valor do Resgate (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-extrabold text-muted">
                R$
              </span>
              <input
                type="text"
                required
                placeholder="0,00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.,]/g, ''))}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-navy/15 bg-white text-xl font-extrabold text-navy focus:ring-2 focus:ring-gold focus:outline-none placeholder:text-muted/40"
              />
            </div>
          </div>

          {/* Destino do Resgate */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1.5 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-blue" />
              Destino do Dinheiro
            </label>
            <select
              value={destAccountId}
              onChange={(e) => setDestAccountId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none font-medium"
            >
              <option value="wallet">💵 Dinheiro em Espécie / Uso Direto</option>
              {accounts.map((acc: BankAccount) => (
                <option key={acc.id} value={acc.id}>
                  🏦 Creditar em: {acc.name} ({acc.institutionName})
                </option>
              ))}
            </select>
          </div>

          {/* Membro */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1 flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-muted" /> Responsável pelo resgate
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
              className="btn-gold text-xs h-10 px-5 !bg-blue hover:!bg-blue-soft text-white"
            >
              {loading ? 'Processando...' : 'Confirmar Resgate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
