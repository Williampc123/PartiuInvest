import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  DollarSign,
  Calendar,
  User,
  Wallet,
  Plus,
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  TrendingUp,
  Plane,
  Car,
  Home,
  HeartPulse,
  GraduationCap,
  Briefcase,
  PiggyBank,
  Gift,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import { BoxGoal, FamilyMember, BankAccount, BoxCategory } from '@/core/types';
import { useAppStore } from '@/features/auth/useAppStore';
import {
  addBoxToFirestore,
  updateBoxInFirestore,
  addBoxCategoryToFirestore,
} from '@/features/dashboard/infrastructure/firestoreDataService';
import { Money } from '@/core/Money';
import {
  DEFAULT_BOX_CATEGORIES,
  CATEGORY_COLORS,
  getCategoryIconComponent,
} from '@/core/categories';

interface NewBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBox?: BoxGoal | null;
  onSuccess?: (msg: string) => void;
}

// Catálogo de ícones rápidos para caixinhas
const QUICK_BOX_ICONS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: 'ShieldCheck', label: 'Reserva / Proteção', icon: ShieldCheck },
  { name: 'Zap', label: 'Oportunidade / Rápido', icon: Zap },
  { name: 'Sparkles', label: 'Sonho / Especial', icon: Sparkles },
  { name: 'TrendingUp', label: 'Investimentos', icon: TrendingUp },
  { name: 'Plane', label: 'Viagem / Férias', icon: Plane },
  { name: 'Car', label: 'Carro / Veículo', icon: Car },
  { name: 'Home', label: 'Casa / Reforma', icon: Home },
  { name: 'GraduationCap', label: 'Educação / Estudos', icon: GraduationCap },
  { name: 'PiggyBank', label: 'Poupança / Cofrinho', icon: PiggyBank },
  { name: 'Briefcase', label: 'Negócio / Carreira', icon: Briefcase },
  { name: 'HeartPulse', label: 'Saúde / Bem-estar', icon: HeartPulse },
  { name: 'Gift', label: 'Presentes / Festa', icon: Gift },
  { name: 'ShoppingBag', label: 'Compras / Bens', icon: ShoppingBag },
  { name: 'Target', label: 'Objetivo Geral', icon: Target },
];

export const NewBoxModal: React.FC<NewBoxModalProps> = ({
  isOpen,
  onClose,
  editingBox,
  onSuccess,
}) => {
  const {
    user,
    familyMembers,
    accounts,
    boxes,
    setBoxes,
    boxCategories,
    addBoxCategory,
  } = useAppStore();

  const availableCategories: BoxCategory[] =
    boxCategories && boxCategories.length > 0
      ? boxCategories
      : DEFAULT_BOX_CATEGORIES;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('emergency');
  const [icon, setIcon] = useState<string>('ShieldCheck');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [initialDepositStr, setInitialDepositStr] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('wallet');
  const [targetDate, setTargetDate] = useState('');
  const [ownerMemberId, setOwnerMemberId] = useState('');
  const [visibility, setVisibility] = useState<'family' | 'private'>('family');
  const [color, setColor] = useState('#F5B82E');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estado para criação inline de nova categoria de caixinha
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Zap');
  const [newCatColor, setNewCatColor] = useState('#F97316');
  const [catErrorMsg, setCatErrorMsg] = useState<string | null>(null);
  const [savingCat, setSavingCat] = useState(false);

  // Inicializar estado quando o modal abre ou editingBox muda
  useEffect(() => {
    if (isOpen) {
      if (editingBox) {
        setName(editingBox.name);
        setCategory(editingBox.category || 'emergency');
        setIcon(editingBox.icon || editingBox.category || 'ShieldCheck');
        setTargetAmountStr(
          (editingBox.targetAmountCents / 100).toFixed(2).replace('.', ',')
        );
        setTargetDate(editingBox.targetDate || '');
        setOwnerMemberId(
          editingBox.ownerMemberId ||
            user?.memberId ||
            familyMembers[0]?.id ||
            ''
        );
        setVisibility(editingBox.visibility || 'family');
        setColor(editingBox.color || '#F5B82E');
      } else {
        const defaultCat = availableCategories[0] || DEFAULT_BOX_CATEGORIES[0];
        setName(defaultCat.defaultName || defaultCat.label || '');
        setCategory(defaultCat.id);
        setIcon(defaultCat.icon);
        setColor(defaultCat.color);
        setTargetAmountStr('');
        setInitialDepositStr('');
        setSelectedAccountId('wallet');
        setTargetDate('');
        setOwnerMemberId(user?.memberId || familyMembers[0]?.id || '');
        setVisibility('family');
      }
      setErrorMsg(null);
      setIsCreatingCategory(false);
      setNewCatName('');
    }
  }, [isOpen, editingBox]);

  if (!isOpen) return null;

  const handleSelectCategory = (cat: BoxCategory) => {
    setCategory(cat.id);
    setIcon(cat.icon);
    setColor(cat.color);

    // Se o nome estiver vazio ou coincidir com o default de alguma categoria, atualizar nome
    const isMatchingDefault =
      !name.trim() ||
      availableCategories.some(
        (c) => c.defaultName === name || c.label === name || c.name === name
      );

    if (isMatchingDefault) {
      setName(cat.defaultName || cat.label || cat.name);
    }
  };

  const handleSaveNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatErrorMsg(null);

    const trimmed = newCatName.trim();
    if (!trimmed) {
      setCatErrorMsg('Informe o nome da categoria.');
      return;
    }

    setSavingCat(true);

    try {
      const slugId =
        'box_cat_' +
        trimmed
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '_') +
        '_' +
        Date.now();

      const newCategoryData: BoxCategory = {
        id: slugId,
        name: trimmed,
        label: trimmed,
        icon: newCatIcon,
        color: newCatColor,
        defaultName: trimmed,
        isCustom: true,
      };

      if (user?.familyId) {
        await addBoxCategoryToFirestore(user.familyId, newCategoryData);
      }

      addBoxCategory(newCategoryData);

      // Já seleciona a nova categoria criada
      handleSelectCategory(newCategoryData);
      setIsCreatingCategory(false);
      setNewCatName('');
    } catch (err) {
      console.error('Erro ao criar categoria de caixinha:', err);
      setCatErrorMsg('Erro ao salvar categoria. Tente novamente.');
    } finally {
      setSavingCat(false);
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
        const updates: Partial<BoxGoal> = {
          name: name.trim(),
          category,
          icon,
          targetAmountCents: targetCents,
          ownerMemberId,
          visibility,
          color,
        };

        if (targetDate && targetDate.trim()) {
          updates.targetDate = targetDate.trim();
        }

        if (user?.familyId) {
          await updateBoxInFirestore(user.familyId, editingBox.id, updates);
        }

        const updated = boxes.map((b) =>
          b.id === editingBox.id
            ? {
                ...b,
                ...updates,
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
          icon,
          targetAmountCents: targetCents,
          currentBalanceCents: initialDepositCents,
          color,
        };

        if (targetDate && targetDate.trim()) {
          newBoxData.targetDate = targetDate.trim();
        }

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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-navy">
                Tipo de Objetivo / Categoria
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                className="text-xs font-bold text-gold-deep flex items-center gap-1 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nova Categoria</span>
              </button>
            </div>

            {/* Painel Inline para Adicionar Nova Categoria */}
            {isCreatingCategory && (
              <div className="mb-3 p-3.5 rounded-2xl bg-gold/10 border border-gold/40 animate-in fade-in slide-in-from-top-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-gold-deep" />
                    Criar Nova Categoria de Caixinha
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(false)}
                    className="text-muted hover:text-navy text-xs"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {catErrorMsg && (
                  <div className="p-2 rounded-lg bg-danger/10 text-danger text-[11px] font-semibold">
                    {catErrorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    Nome da Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Reserva de Oportunidade, Reforma, Casamento..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-navy/15 bg-white text-xs font-medium text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                  />
                </div>

                {/* Escolha do Ícone */}
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1.5">
                    Escolha um Ícone
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {QUICK_BOX_ICONS.map((item) => {
                      const IconComp = item.icon;
                      const isSelected = newCatIcon === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setNewCatIcon(item.name)}
                          title={item.label}
                          className={`h-9 w-full rounded-xl border flex items-center justify-center transition ${
                            isSelected
                              ? 'border-gold bg-gold text-navy shadow-sm'
                              : 'border-navy/10 bg-white hover:bg-navy/5 text-navy'
                          }`}
                        >
                          <IconComp className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Escolha da Cor */}
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1.5">
                    Escolha uma Cor
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {CATEGORY_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewCatColor(c)}
                        className="h-6 w-6 rounded-full border-2 transition relative grid place-items-center"
                        style={{
                          backgroundColor: c,
                          borderColor: newCatColor === c ? '#0A1F44' : 'transparent',
                        }}
                      >
                        {newCatColor === c && <Check className="h-3 w-3 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(false)}
                    className="text-xs text-muted hover:text-navy px-2.5 py-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNewCategory}
                    disabled={savingCat}
                    className="btn-gold text-xs h-8 px-3.5"
                  >
                    {savingCat ? 'Salvando...' : 'Adicionar Categoria'}
                  </button>
                </div>
              </div>
            )}

            {/* Grid de Categorias */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {availableCategories.map((preset) => {
                const IconComponent = getCategoryIconComponent(preset.icon || preset.id);
                const isSelected = category === preset.id || category === preset.name;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectCategory(preset)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                      isSelected
                        ? 'border-gold bg-gold/10 font-bold text-navy shadow-sm ring-1 ring-gold/40'
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
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs leading-tight block truncate">
                        {preset.label || preset.name}
                      </span>
                      {preset.isCustom && (
                        <span className="text-[9px] text-gold-deep font-semibold block leading-none mt-0.5">
                          Personalizada
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Botão de adicionar categoria no grid */}
              {!isCreatingCategory && (
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(true)}
                  className="p-2.5 rounded-xl border border-dashed border-navy/20 bg-navy/[0.02] hover:bg-gold/10 hover:border-gold text-left flex items-center gap-2.5 transition text-muted hover:text-navy"
                >
                  <div className="h-7 w-7 rounded-lg grid place-items-center shrink-0 bg-navy/5 text-navy">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="text-xs leading-tight font-semibold">+ Outra Categoria</span>
                </button>
              )}
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
              placeholder="Ex: Reserva de Emergência, Reserva de Oportunidade, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none font-medium"
            />
          </div>

          {/* Valor da Meta e Prazo */}
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
