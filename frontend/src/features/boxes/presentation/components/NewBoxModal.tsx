import React, { useState } from 'react';
import {
  X,
  Target,
  ShieldCheck,
  Plane,
  GraduationCap,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  Wallet,
} from 'lucide-react';
import { BoxGoal, FamilyMember, BankAccount } from '@/core/types';
import { useAppStore } from '@/features/auth/useAppStore';
import { addBoxToFirestore, updateBoxInFirestore } from '@/features/dashboard/infrastructure/firestoreDataService';
import { Money } from '@/core/Money';

interface NewBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBox?: BoxGoal | null;
  onSuccess?: (msg: string) => void;
}

export const NewBoxModal: React.FC<NewBoxModalProps> = ({
  isOpen,
  onClose,
  editingBox,
  onSuccess,
}) => {
  const { user, familyMembers, accounts, boxes, setBoxes } = useAppStore();

  const [name, setName] = useState(editingBox ? editingBox.name : '');
  const [category, setCategory] = useState<'emergency' | 'dream' | 'investment' | 'education'>(
    editingBox ? editingBox.category : 'emergency'
  );
  const [targetAmountStr, setTargetAmountStr] = useState(
    editingBox ? (editingBox.targetAmountCents / 100).toFixed(2).replace('.', ',') : ''
  );
  const [initialDepositStr, setInitialDepositStr] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('wallet');
  const [targetDate, setTargetDate] = useState(editingBox?.targetDate || '');
  const [ownerMemberId, setOwnerMemberId] = useState(
    editingBox?.ownerMemberId || user?.memberId || familyMembers[0]?.id || ''
  );
  const [visibility, setVisibility] = useState<'family' | 'private'>(
    editingBox?.visibility || 'family'
  );
  const [color, setColor] = useState(editingBox?.color || '#F5B82E');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const categoryPresets = [
    {
      type: 'emergency' as const,
      label: 'Reserva de Emergência',
      icon: ShieldCheck,
      color: '#F5B82E',
      defaultName: 'Reserva de Emergência',
    },
    {
      type: 'dream' as const,
      label: 'Sonho / Viagem / Bem',
      icon: Plane,
      color: '#3F6FD8',
      defaultName: 'Viagem dos Sonhos',
    },
    {
      type: 'investment' as const,
      label: 'Investimentos & Futuro',
      icon: TrendingUp,
      color: '#0A1F44',
      defaultName: 'Fundo de Liberdade Financeira',
    },
    {
      type: 'education' as const,
      label: 'Educação / Capacitação',
      icon: GraduationCap,
      color: '#22C55E',
      defaultName: 'Faculdade / Especialização',
    },
  ];

  const handleSelectCategory = (cat: typeof categoryPresets[0]) => {
    setCategory(cat.type);
    setColor(cat.color);
    if (!name || categoryPresets.some((p) => p.defaultName === name)) {
      setName(cat.defaultName);
    }
  };

  const parseAmountToCents = (valStr: string): number => {
    const cleanStr = valStr.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : Math.round(num * 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const targetCents = parseAmountToCents(targetAmountStr);
    const initialDepositCents = parseAmountToCents(initialDepositStr);

    if (!name.trim()) {
      setErrorMsg('Informe o nome da caixinha.');
      return;
    }

    if (targetCents <= 0) {
      setErrorMsg('Informe um valor de meta válido.');
      return;
    }

    // Se houver depósito inicial com débito em conta bancária, verificar saldo
    if (!editingBox && initialDepositCents > 0 && selectedAccountId !== 'wallet') {
      const sourceAcc = accounts.find((a) => a.id === selectedAccountId);
      if (sourceAcc && sourceAcc.balanceCents < initialDepositCents) {
        setErrorMsg(
          `Saldo insuficiente na conta ${sourceAcc.name} (${Money.formatCents(
            sourceAcc.balanceCents
          )} disponíveis).`
        );
        return;
      }
    }

    setLoading(true);

    try {
      if (editingBox) {
        // Atualização de Caixinha existente
        if (user?.familyId) {
          await updateBoxInFirestore(user.familyId, editingBox.id, {
            name: name.trim(),
            category,
            targetAmountCents: targetCents,
            targetDate: targetDate || undefined,
            ownerMemberId,
            visibility,
            color,
          });
        }

        const updated = boxes.map((b) =>
          b.id === editingBox.id
            ? {
                ...b,
                name: name.trim(),
                category,
                targetAmountCents: targetCents,
                targetDate: targetDate || undefined,
                ownerMemberId,
                visibility,
                color,
              }
            : b
        );
        setBoxes(updated);
        onSuccess?.('Caixinha atualizada com sucesso!');
      } else {
        // Criação de Nova Caixinha
        const newBoxData: Omit<BoxGoal, 'id'> = {
          ownerMemberId: ownerMemberId || user?.memberId || 'head',
          visibility,
          name: name.trim(),
          category,
          targetAmountCents: targetCents,
          currentBalanceCents: initialDepositCents,
          targetDate: targetDate || undefined,
          color,
          icon: category,
        };

        if (user?.familyId) {
          const created = await addBoxToFirestore(user.familyId, newBoxData, {
            accountId: selectedAccountId,
            memberId: ownerMemberId,
          });
          setBoxes([...boxes, created]);
        } else {
          // Local fallback
          const localBox: BoxGoal = {
            ...newBoxData,
            id: 'box_' + Date.now(),
          };
          setBoxes([...boxes, localBox]);
        }

        onSuccess?.('Nova caixinha criada com sucesso!');
      }

      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar caixinha:', err);
      setErrorMsg('Ocorreu um erro ao salvar a caixinha. Tente novamente.');
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
            <h3 className="text-lg font-bold text-navy flex items-center gap-2">
              <Target className="h-5 w-5 text-gold-deep" />
              {editingBox ? 'Editar Caixinha' : 'Criar Nova Caixinha'}
            </h3>
            <p className="text-xs text-muted">
              Defina seu objetivo financeiro, valor alvo e guarde seu dinheiro com segurança.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Categoria do Objetivo */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1.5">
              Tipo de Objetivo / Categoria
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categoryPresets.map((preset) => {
                const Icon = preset.icon;
                const isSelected = category === preset.type;
                return (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => handleSelectCategory(preset)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                      isSelected
                        ? 'border-gold bg-gold/10 font-bold text-navy shadow-sm'
                        : 'border-navy/10 bg-white/70 hover:bg-navy/5 text-muted'
                    }`}
                  >
                    <div
                      className="h-7 w-7 rounded-lg grid place-items-center shrink-0"
                      style={{
                        backgroundColor: `${preset.color}20`,
                        color: preset.color,
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs leading-tight">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nome da Caixinha */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1">
              Nome da Caixinha
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Reserva de Emergência, Viagem para Praia, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none font-medium"
            />
          </div>

          {/* Valor da Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Meta Financeira Alvo (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">
                  R$
                </span>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={targetAmountStr}
                  onChange={(e) =>
                    setTargetAmountStr(e.target.value.replace(/[^0-9.,]/g, ''))
                  }
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-navy/15 bg-white text-sm font-bold text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted" /> Prazo Estimado (Opcional)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Aporte Inicial (somente no cadastro novo) */}
          {!editingBox && (
            <div className="p-3.5 rounded-2xl bg-gold/10 border border-gold/30 space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gold-deep" />
                <span className="text-xs font-bold text-navy">
                  Deseja fazer um aporte inicial agora? (Opcional)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    Valor Inicial (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={initialDepositStr}
                    onChange={(e) =>
                      setInitialDepositStr(e.target.value.replace(/[^0-9.,]/g, ''))
                    }
                    className="w-full h-10 px-3 rounded-xl border border-navy/15 bg-white text-xs font-bold text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1 flex items-center gap-1">
                    <Wallet className="h-3 w-3" /> Origem do Valor
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-navy/15 bg-white text-xs font-semibold text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                  >
                    <option value="wallet">💵 Dinheiro Livre / Já guardado</option>
                    {accounts.map((acc: BankAccount) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({Money.formatCents(acc.balanceCents)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Titular e Visibilidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy mb-1 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-muted" /> Responsável / Titular
              </label>
              <select
                value={ownerMemberId}
                onChange={(e) => setOwnerMemberId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
              >
                {familyMembers.map((m: FamilyMember) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName} ({m.role === 'chefe-familia' ? 'Chefe' : m.role})
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
                <option value="family">👨‍👩‍👧 Compartilhada na Família</option>
                <option value="private">🔒 Individual / Privada</option>
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
              disabled={loading}
              className="btn-gold text-xs h-10 px-5"
            >
              {loading ? 'Salvando...' : editingBox ? 'Salvar Alterações' : 'Criar Caixinha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
