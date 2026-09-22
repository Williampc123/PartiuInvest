import React, { useState } from 'react';
import { X, Building2, Plus, Sparkles, Wallet } from 'lucide-react';
import { useAppStore } from '@/features/auth/useAppStore';
import { BankAccount, FamilyMember } from '@/core/types';
import { addBankAccountToFirestore } from '@/features/dashboard/infrastructure/firestoreDataService';

export const AVAILABLE_BANKS = [
  { name: 'Nubank', color: '#8A05BE' },
  { name: 'Itaú Unibanco', color: '#EC7000' },
  { name: 'Banco Inter', color: '#FF7A00' },
  { name: 'Bradesco', color: '#CC092F' },
  { name: 'Banco do Brasil', color: '#0038A8' },
  { name: 'Santander', color: '#E50000' },
  { name: 'C6 Bank', color: '#1B1B1B' },
  { name: 'BTG Pactual', color: '#001E62' },
  { name: 'Caixa Econômica', color: '#005CA9' },
  { name: 'XP Investimentos', color: '#0A1F44' },
  { name: 'Nomad', color: '#FFD700' },
  { name: 'Sofisa Direto', color: '#FF5000' },
  { name: 'Outro Banco', color: '#4B5563' },
];

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newAccount: BankAccount) => void;
}

export const NewAccountModal: React.FC<NewAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, familyMembers, addAccount } = useAppStore();

  const [name, setName] = useState('');
  const [bank, setBank] = useState('Nubank');
  const [balanceStr, setBalanceStr] = useState('');
  const [type, setType] = useState<'checking' | 'savings' | 'credit_card' | 'investment'>('checking');
  const [memberId, setMemberId] = useState(user?.memberId || '');
  const [visibility, setVisibility] = useState<'family' | 'private'>('family');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.,]/g, '');
    setBalanceStr(val);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const bankObj = AVAILABLE_BANKS.find((b) => b.name === bank) || AVAILABLE_BANKS[0];
    const cleanStr = balanceStr.replace(/\./g, '').replace(',', '.');
    const balanceCents = Math.round((parseFloat(cleanStr) || 0) * 100);
    const finalName = name.trim() || `Conta ${bankObj.name}`;

    setIsSaving(true);
    try {
      const accountPayload: Omit<BankAccount, 'id'> = {
        ownerMemberId: memberId || user?.memberId || 'head',
        visibility,
        name: finalName,
        type,
        source: 'manual',
        institutionName: bankObj.name,
        balanceCents,
        color: bankObj.color,
      };

      if (user?.familyId) {
        const created = await addBankAccountToFirestore(user.familyId, accountPayload);
        addAccount(created);
        onSuccess?.(created);
      } else {
        const localAccount: BankAccount = {
          ...accountPayload,
          id: 'acc_' + Date.now(),
        };
        addAccount(localAccount);
        onSuccess?.(localAccount);
      }

      // Resetar campos
      setName('');
      setBalanceStr('');
      onClose();
    } catch (err) {
      console.error('Erro ao cadastrar conta manual:', err);
      setErrorMsg('Ocorreu um erro ao salvar a conta bancária. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="card w-full max-w-md bg-white border-white/95 shadow-2xl p-6 rounded-[28px] relative max-h-[92vh] flex flex-col">
        {/* Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 icon-btn text-muted hover:text-navy z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cabeçalho */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-navy flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gold-deep" />
            Cadastrar Conta Bancária
          </h3>
          <p className="text-xs text-muted">
            Adicione uma conta corrente, poupança ou investimentos para gerenciar suas movimentações.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 overflow-y-auto pr-1">
          {/* Instituição Financeira */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1">
              Instituição Financeira
            </label>
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none font-medium"
            >
              {AVAILABLE_BANKS.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nome ou Apelido da Conta */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1">
              Nome ou Apelido da Conta
            </label>
            <input
              type="text"
              placeholder={`Ex: Conta Principal ${bank}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
            />
          </div>

          {/* Tipo e Saldo Inicial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Tipo de Conta
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
              >
                <option value="checking">Conta Corrente</option>
                <option value="savings">Poupança</option>
                <option value="investment">Investimentos</option>
                <option value="credit_card">Cartão de Crédito</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Saldo Inicial (R$)
              </label>
              <input
                type="text"
                placeholder="0,00"
                value={balanceStr}
                onChange={handleBalanceChange}
                className="w-full h-11 px-3 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Titular e Visibilidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Titular da Conta
              </label>
              <select
                value={memberId || user?.memberId || ''}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
              >
                {familyMembers.map((m: FamilyMember) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Visibilidade
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
              >
                <option value="family">👨‍👩‍👧 Compartilhada</option>
                <option value="private">🔒 Individual</option>
              </select>
            </div>
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
              disabled={isSaving}
              className="btn-gold text-xs h-10 px-5 gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isSaving ? 'Salvando...' : 'Cadastrar Conta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
