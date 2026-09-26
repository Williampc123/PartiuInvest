import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  User,
  Wallet,
  CheckCircle2,
  Plus,
  Repeat,
  Layers,
  ArrowRight,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/features/auth/useAppStore';
import { FinancialTransaction, FamilyMember, BankAccount, FinancialCategory } from '@/core/types';
import { Money } from '@/core/Money';
import {
  updateTransactionInFirestore,
  updateMultipleTransactionsInFirestore,
  deleteTransactionFromFirestore,
  deleteMultipleTransactionsFromFirestore,
} from '@/features/dashboard/infrastructure/firestoreDataService';
import { NewCategoryModal } from '@/features/categories/presentation/components/NewCategoryModal';
import { NewAccountModal } from '@/features/accounts/presentation/components/NewAccountModal';
import Swal from 'sweetalert2';

export interface InstallmentInfo {
  isInstallment: boolean;
  installmentNumber: number;
  totalInstallments: number;
  baseDescription: string;
  sisterTransactions: FinancialTransaction[];
}

export function getInstallmentInfo(
  transaction: FinancialTransaction | null,
  allTransactions: FinancialTransaction[]
): InstallmentInfo {
  if (!transaction) {
    return {
      isInstallment: false,
      installmentNumber: 1,
      totalInstallments: 1,
      baseDescription: '',
      sisterTransactions: [],
    };
  }

  const match = transaction.description.match(/\s*\((\d+)\/(\d+)\)$/);
  const totalFromField = transaction.totalInstallments;
  const numFromField = transaction.installmentNumber;

  const total = totalFromField || (match ? parseInt(match[2], 10) : 1);
  const currentNum = numFromField || (match ? parseInt(match[1], 10) : 1);
  const baseDescription = transaction.description.replace(/\s*\(\d+\/\d+\)$/, '').trim();

  if (total <= 1 && !match) {
    return {
      isInstallment: false,
      installmentNumber: 1,
      totalInstallments: 1,
      baseDescription: transaction.description.trim(),
      sisterTransactions: [transaction],
    };
  }

  // Encontrar todas as parcelas do mesmo grupo
  const sisters = allTransactions.filter((t) => {
    if (t.id === transaction.id) return true;
    const tMatch = t.description.match(/\s*\((\d+)\/(\d+)\)$/);
    const tBase = t.description.replace(/\s*\(\d+\/\d+\)$/, '').trim();
    const tTotal = t.totalInstallments || (tMatch ? parseInt(tMatch[2], 10) : 0);

    const sameBase = tBase.toLowerCase() === baseDescription.toLowerCase();
    const sameTotal = tTotal === total;

    return sameBase && sameTotal;
  });

  return {
    isInstallment: sisters.length > 1 || total > 1,
    installmentNumber: currentNum,
    totalInstallments: total,
    baseDescription,
    sisterTransactions: sisters,
  };
}

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: FinancialTransaction | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onSuccess,
}) => {
  const {
    user,
    familyMembers,
    accounts,
    categories,
    transactions,
    setTransactions,
    updateTransaction,
    updateMultipleTransactions,
  } = useAppStore();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('wallet');
  const [visibility, setVisibility] = useState<'family' | 'private'>('family');
  const [isPaid, setIsPaid] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [installmentScope, setInstallmentScope] = useState<'all' | 'upcoming' | 'previous' | 'single'>('upcoming');
  const [isNewCatModalOpen, setIsNewCatModalOpen] = useState(false);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);

  // Analisar dados de parcelamento
  const installmentInfo = useMemo(() => {
    return getInstallmentInfo(transaction, transactions);
  }, [transaction, transactions]);

  // Calcular quantidade de parcelas para cada escopo (declarado incondicionalmente no topo)
  const upcomingSisters = useMemo(() => {
    const currentNum = installmentInfo.installmentNumber;
    return installmentInfo.sisterTransactions.filter((s) => {
      const match = s.description.match(/\s*\((\d+)\/(\d+)\)$/);
      const sNum = s.installmentNumber || (match ? parseInt(match[1], 10) : 0);
      if (sNum && currentNum) return sNum >= currentNum;
      return (s.date || '') >= (transaction?.date || '');
    });
  }, [installmentInfo, transaction]);

  const previousSisters = useMemo(() => {
    const currentNum = installmentInfo.installmentNumber;
    return installmentInfo.sisterTransactions.filter((s) => {
      const match = s.description.match(/\s*\((\d+)\/(\d+)\)$/);
      const sNum = s.installmentNumber || (match ? parseInt(match[1], 10) : 0);
      if (sNum && currentNum) return sNum <= currentNum;
      return (s.date || '') <= (transaction?.date || '');
    });
  }, [installmentInfo, transaction]);

  // Inicializar formulário quando a transação for aberta
  useEffect(() => {
    if (transaction) {
      const isInc = transaction.type === 'income' || transaction.amountCents > 0;
      setType(isInc ? 'income' : 'expense');
      
      const cleanDesc = transaction.description.replace(/\s*\(\d+\/\d+\)$/, '').trim();
      setDescription(cleanDesc);

      const absCents = Math.abs(transaction.amountCents);
      const valStr = (absCents / 100).toFixed(2).replace('.', ',');
      setAmountInput(valStr);

      setDate(transaction.date || new Date().toISOString().split('T')[0]);
      setCategory(transaction.category || (isInc ? 'Salário' : 'Alimentação'));
      setSelectedMemberId(transaction.memberId || user?.memberId || '');
      setSelectedAccountId(transaction.accountId || accounts[0]?.id || 'wallet');
      setVisibility(transaction.visibility || 'family');
      setIsPaid(transaction.isPaid === true);
      setInstallmentScope('upcoming');
      setSuccess(false);
    }
  }, [transaction, isOpen]);

  if (!isOpen || !transaction) return null;

  const currentCategories = categories.filter(
    (c) => c.type === 'both' || c.type === type
  );

  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    const firstCat = categories.find((c) => c.type === newType || c.type === 'both');
    setCategory(firstCat ? firstCat.name : (newType === 'expense' ? 'Alimentação' : 'Salário'));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.,]/g, '');
    setAmountInput(val);
  };

  const parseAmountToCents = (valStr: string): number => {
    const cleanStr = valStr.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : Math.round(num * 100);
  };

  // Salvar com escopo selecionado no dropdown (todas, próximas, anteriores, apenas esta)
  const handleSaveWithScope = async (scope: 'all' | 'upcoming' | 'previous' | 'single') => {
    if (!transaction || !user?.familyId) return;

    const amountCents = parseAmountToCents(amountInput);
    const finalAmountCents = type === 'expense' ? -Math.abs(amountCents) : Math.abs(amountCents);
    const cleanBaseDesc = description.trim();

    if (scope === 'single' || !installmentInfo.isInstallment) {
      const suffix = installmentInfo.isInstallment
        ? ` (${installmentInfo.installmentNumber}/${installmentInfo.totalInstallments})`
        : '';
      const finalDescription = `${cleanBaseDesc}${suffix}`;

      setLoading(true);
      try {
        const updates: Partial<FinancialTransaction> = {
          description: finalDescription,
          amountCents: finalAmountCents,
          category,
          date,
          accountId: selectedAccountId,
          memberId: selectedMemberId || user.memberId,
          visibility,
          isPaid,
          type: transaction.isRecurring && type === 'expense' ? 'bill' : type,
        };

        await updateTransactionInFirestore(user.familyId, transaction.id, updates);

        const updatedTransaction: FinancialTransaction = {
          ...transaction,
          ...updates,
        };
        updateTransaction(updatedTransaction);

        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onSuccess?.();
          onClose();
        }, 1000);
      } catch (err) {
        console.error('Erro ao atualizar movimentação:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    let targetSisters = installmentInfo.sisterTransactions;
    if (scope === 'upcoming') {
      targetSisters = upcomingSisters;
    } else if (scope === 'previous') {
      targetSisters = previousSisters;
    }

    setLoading(true);
    try {
      const batchUpdates: { id: string; updates: Partial<FinancialTransaction> }[] = [];
      const updatedList: FinancialTransaction[] = [];

      for (const sister of targetSisters) {
        const match = sister.description.match(/\s*\((\d+)\/(\d+)\)$/);
        const sisterNum = sister.installmentNumber || (match ? parseInt(match[1], 10) : 1);
        const sisterTotal = sister.totalInstallments || (match ? parseInt(match[2], 10) : installmentInfo.totalInstallments);
        const newDesc = `${cleanBaseDesc} (${sisterNum}/${sisterTotal})`;

        // Atualizar os campos mantendo a data original de cada parcela
        const updates: Partial<FinancialTransaction> = {
          description: newDesc,
          amountCents: finalAmountCents,
          category,
          accountId: selectedAccountId,
          memberId: selectedMemberId || user.memberId,
          visibility,
          isPaid,
          type: sister.isRecurring && type === 'expense' ? 'bill' : type,
        };

        // Se for a própria parcela que está sendo editada e o usuário mudou a data dela
        if (sister.id === transaction.id && date) {
          updates.date = date;
        }

        batchUpdates.push({ id: sister.id, updates });
        updatedList.push({ ...sister, ...updates });
      }

      await updateMultipleTransactionsInFirestore(user.familyId, batchUpdates);
      updateMultipleTransactions(updatedList);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (err) {
      console.error(`Erro ao atualizar parcelas (${scope}):`, err);
    } finally {
      setLoading(false);
    }
  };

  // Exclusão com suporte a parcelas vinculadas a partir da modal
  const handleDeleteFromModal = async () => {
    if (!user?.familyId || !transaction) return;

    const hasSisterInstallments = installmentInfo.isInstallment && installmentInfo.sisterTransactions.length > 1;

    if (hasSisterInstallments) {
      const result = await Swal.fire({
        title: 'Excluir Movimentação Parcelada',
        html: `
          <div class="text-left text-sm text-navy space-y-2.5">
            <p>A movimentação <b>"${transaction.description}"</b> faz parte de uma série de <b>${installmentInfo.totalInstallments} parcelas</b>.</p>
            <p class="text-muted text-xs">Como você deseja realizar a exclusão?</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: `🗑️ Deletar todas as parcelas (${installmentInfo.sisterTransactions.length})`,
        denyButtonText: `📄 Deletar somente esta (${installmentInfo.installmentNumber}/${installmentInfo.totalInstallments})`,
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#DC2626',
        denyButtonColor: '#475569',
        cancelButtonColor: '#94A3B8',
        reverseButtons: true,
        focusCancel: true,
        customClass: {
          popup: 'rounded-3xl border border-navy/10 shadow-2xl p-6 font-sans',
          confirmButton: 'rounded-xl text-xs font-bold py-2.5 px-3.5 shadow-sm',
          denyButton: 'rounded-xl text-xs font-bold py-2.5 px-3.5 shadow-sm',
          cancelButton: 'rounded-xl text-xs font-bold py-2.5 px-3.5',
        },
      });

      if (result.isConfirmed) {
        try {
          const idsToDelete = installmentInfo.sisterTransactions.map((st) => st.id);
          await deleteMultipleTransactionsFromFirestore(user.familyId, idsToDelete);
          const idsSet = new Set(idsToDelete);
          setTransactions(transactions.filter((t) => !idsSet.has(t.id)));
          onClose();
          Swal.fire({
            title: 'Excluído!',
            text: `Todas as ${idsToDelete.length} parcelas vinculadas foram removidas com sucesso.`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: 'rounded-2xl font-sans' },
          });
        } catch (err) {
          console.error('Erro ao deletar parcelas vinculadas:', err);
          Swal.fire('Erro', 'Não foi possível remover as parcelas.', 'error');
        }
      } else if (result.isDenied) {
        try {
          await deleteTransactionFromFirestore(user.familyId, transaction.id);
          setTransactions(transactions.filter((t) => t.id !== transaction.id));
          onClose();
          Swal.fire({
            title: 'Excluído!',
            text: `A parcela (${installmentInfo.installmentNumber}/${installmentInfo.totalInstallments}) foi removida.`,
            icon: 'success',
            timer: 1800,
            showConfirmButton: false,
            customClass: { popup: 'rounded-2xl font-sans' },
          });
        } catch (err) {
          console.error('Erro ao deletar parcela:', err);
          Swal.fire('Erro', 'Não foi possível remover a movimentação.', 'error');
        }
      }
    } else {
      // Movimentação avulsa simples
      const result = await Swal.fire({
        title: 'Excluir Movimentação?',
        html: `<p class="text-sm text-navy">Tem certeza que deseja remover <b>"${transaction.description}"</b>?</p>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#DC2626',
        cancelButtonColor: '#94A3B8',
        reverseButtons: true,
        focusCancel: true,
        customClass: {
          popup: 'rounded-3xl border border-navy/10 shadow-2xl p-6 font-sans',
          confirmButton: 'rounded-xl text-xs font-bold py-2.5 px-4 shadow-sm',
          cancelButton: 'rounded-xl text-xs font-bold py-2.5 px-4',
        },
      });

      if (result.isConfirmed) {
        try {
          await deleteTransactionFromFirestore(user.familyId, transaction.id);
          setTransactions(transactions.filter((t) => t.id !== transaction.id));
          onClose();
          Swal.fire({
            title: 'Excluído!',
            text: 'Movimentação removida com sucesso.',
            icon: 'success',
            timer: 1800,
            showConfirmButton: false,
            customClass: { popup: 'rounded-2xl font-sans' },
          });
        } catch (err) {
          console.error('Erro ao deletar movimentação:', err);
          Swal.fire('Erro', 'Não foi possível remover a movimentação.', 'error');
        }
      }
    }
  };

  // Submissão do formulário principal
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = parseAmountToCents(amountInput);

    if (amountCents <= 0 || !description.trim()) {
      return;
    }

    handleSaveWithScope(installmentInfo.isInstallment ? installmentScope : 'single');
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

        {success ? (
          <div className="py-10 text-center space-y-3 animate-in fade-in">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok/15 text-ok">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-navy">Alterações Salvas!</h3>
            <p className="text-xs text-muted">
              A movimentação financeira foi atualizada com sucesso no painel da família.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-navy">Editar Movimentação</h3>
                {installmentInfo.isInstallment && (
                  <span className="pill bg-gold/20 text-[#7A4F08] text-[10px] font-bold flex items-center gap-1">
                    <Repeat className="h-3 w-3" />
                    Parcela {installmentInfo.installmentNumber}/{installmentInfo.totalInstallments}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">Atualize os detalhes do lançamento financeiro</p>
            </div>

            {/* Alternador de Tipo: Receita vs Despesa */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-navy/5 border border-navy/10">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  type === 'expense'
                    ? 'bg-danger text-white shadow-md'
                    : 'text-muted hover:text-navy'
                }`}
              >
                <TrendingDown className="h-4 w-4" />
                <span>Despesa (Gasto)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  type === 'income'
                    ? 'bg-ok text-white shadow-md'
                    : 'text-muted hover:text-navy'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Receita (Ganho)</span>
              </button>
            </div>

            {/* Valor */}
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Valor da Movimentação (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">
                  R$
                </span>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={amountInput}
                  onChange={handleAmountChange}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-navy/15 bg-white text-lg font-extrabold text-navy focus:ring-2 focus:ring-gold focus:outline-none placeholder:text-muted/50"
                />
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Descrição do Lançamento
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Supermercado, Aluguel, Salário..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
              />
              {installmentInfo.isInstallment && (
                <p className="text-[11px] text-muted mt-1 flex items-center gap-1">
                  <HelpCircle className="h-3 w-3 text-gold-deep shrink-0" />
                  O sufixo da parcela <span className="font-semibold text-navy">({installmentInfo.installmentNumber}/{installmentInfo.totalInstallments})</span> será ajustado automaticamente.
                </p>
              )}
            </div>

            {/* Grid: Data e Categoria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-navy mb-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted" /> Data
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-navy flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-muted" /> Categoria
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNewCatModalOpen(true)}
                    className="text-[11px] font-bold text-gold-deep hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Nova</span>
                  </button>
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none font-medium"
                >
                  {currentCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid: Membro Responsável e Conta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-navy mb-1 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-muted" /> Membro
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-navy flex items-center gap-1">
                    <Wallet className="h-3.5 w-3.5 text-muted" /> Conta / Origem
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNewAccountModalOpen(true)}
                    className="text-[11px] font-bold text-gold-deep hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Nova</span>
                  </button>
                </div>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none font-medium"
                >
                  <option value="wallet">💵 Dinheiro em Espécie / Carteira</option>
                  {accounts.map((acc: BankAccount) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.institutionName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status de Pagamento (Pago vs Pendente) */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-navy/5 border border-navy/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 ${isPaid ? 'text-ok' : 'text-muted'}`} />
                <div>
                  <b className="block text-xs text-navy">
                    {type === 'income' ? 'Valor já recebido?' : 'Pagamento já realizado?'}
                  </b>
                  <small className="text-[10px] text-muted">
                    {isPaid
                      ? type === 'income' ? 'Consta como recebido no saldo' : 'Consta como quitado/pago'
                      : type === 'income' ? 'Consta como a receber (previsto)' : 'Consta como pendente / a pagar'}
                  </small>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPaid(!isPaid)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  isPaid
                    ? 'bg-ok text-white border-ok shadow-sm'
                    : 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                }`}
              >
                {isPaid ? (type === 'income' ? '✓ Recebido' : '✓ Pago') : (type === 'income' ? '⏳ A receber' : '⏳ Pendente')}
              </button>
            </div>

            {/* Dropdown de Escopo de Alteração nas Demais Parcelas */}
            {installmentInfo.isInstallment && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-gold/15 to-gold/5 border border-gold/40 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="installment-scope-select" className="text-xs font-extrabold text-navy flex items-center gap-1.5">
                    <Repeat className="h-4 w-4 text-gold-deep" />
                    <span>Aplicar alterações em:</span>
                  </label>
                  <span className="pill bg-gold/25 text-[#7A4F08] border border-gold/40 text-[10px] font-bold">
                    Parcela {installmentInfo.installmentNumber} de {installmentInfo.totalInstallments}
                  </span>
                </div>

                <div className="relative">
                  <select
                    id="installment-scope-select"
                    value={installmentScope}
                    onChange={(e) => setInstallmentScope(e.target.value as any)}
                    className="w-full h-11 pl-3.5 pr-9 rounded-xl border border-gold/50 bg-white text-xs sm:text-sm font-bold text-navy focus:ring-2 focus:ring-gold focus:outline-none appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="upcoming">
                      ⏩ Alterar somente as próximas ({upcomingSisters.length} parcelas: {installmentInfo.installmentNumber} a {installmentInfo.totalInstallments})
                    </option>
                    <option value="all">
                      🔁 Alterar todas as parcelas ({installmentInfo.sisterTransactions.length} parcelas conectadas)
                    </option>
                    <option value="previous">
                      ⏪ Alterar somente as anteriores ({previousSisters.length} parcelas: 1 a {installmentInfo.installmentNumber})
                    </option>
                    <option value="single">
                      📅 Alterar apenas nesta parcela ({installmentInfo.installmentNumber}/{installmentInfo.totalInstallments})
                    </option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gold-deep">
                    <Layers className="h-4 w-4" />
                  </div>
                </div>

                <p className="text-[11px] text-muted flex items-start gap-1.5 leading-tight">
                  <Sparkles className="h-3.5 w-3.5 text-gold-deep shrink-0 mt-0.5" />
                  <span>
                    {installmentScope === 'all' && (
                      <>Aplica as alterações em <b>todas as {installmentInfo.sisterTransactions.length} parcelas</b> conectadas da série.</>
                    )}
                    {installmentScope === 'upcoming' && (
                      <>Aplica as alterações nesta parcela (<b>{installmentInfo.installmentNumber}</b>) e em todas as <b>parcelas futuras</b> ({installmentInfo.installmentNumber} a {installmentInfo.totalInstallments}).</>
                    )}
                    {installmentScope === 'previous' && (
                      <>Aplica as alterações nesta parcela (<b>{installmentInfo.installmentNumber}</b>) e em todas as <b>parcelas passadas</b> (1 a {installmentInfo.installmentNumber}).</>
                    )}
                    {installmentScope === 'single' && (
                      <>Modifica <b>exclusivamente</b> esta parcela ({installmentInfo.installmentNumber}/{installmentInfo.totalInstallments}). As demais permanecerão intactas.</>
                    )}
                  </span>
                </p>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-navy/10">
              <button
                type="button"
                onClick={handleDeleteFromModal}
                className="btn-line text-xs h-10 px-3.5 text-danger border-danger/30 hover:bg-danger/10 hover:border-danger gap-1.5 font-bold"
                title="Excluir movimentação"
              >
                <Trash2 className="h-4 w-4" />
                <span>Excluir</span>
              </button>

              <div className="flex items-center gap-2">
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
                  className="btn-gold text-xs h-10 px-5 gap-1.5 font-bold"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Modal Rápido para Criar Nova Categoria */}
      <NewCategoryModal
        isOpen={isNewCatModalOpen}
        onClose={() => setIsNewCatModalOpen(false)}
        defaultType={type}
        onSuccess={(newCat) => setCategory(newCat.name)}
      />

      {/* Modal Rápido para Criar Nova Conta Bancária */}
      <NewAccountModal
        isOpen={isNewAccountModalOpen}
        onClose={() => setIsNewAccountModalOpen(false)}
        onSuccess={(newAcc) => setSelectedAccountId(newAcc.id)}
      />
    </div>
  );
};
