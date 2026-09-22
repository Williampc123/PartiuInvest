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
} from 'lucide-react';
import { useAppStore } from '@/features/auth/useAppStore';
import { FinancialTransaction, FamilyMember, BankAccount, FinancialCategory } from '@/core/types';
import { Money } from '@/core/Money';
import {
  updateTransactionInFirestore,
  updateMultipleTransactionsInFirestore,
} from '@/features/dashboard/infrastructure/firestoreDataService';
import { NewCategoryModal } from '@/features/categories/presentation/components/NewCategoryModal';
import { NewAccountModal } from '@/features/accounts/presentation/components/NewAccountModal';

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
  const [showInstallmentChoice, setShowInstallmentChoice] = useState(false);
  const [isNewCatModalOpen, setIsNewCatModalOpen] = useState(false);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);

  // Analisar dados de parcelamento
  const installmentInfo = useMemo(() => {
    return getInstallmentInfo(transaction, transactions);
  }, [transaction, transactions]);

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
      setShowInstallmentChoice(false);
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

  // Submissão do formulário principal
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = parseAmountToCents(amountInput);

    if (amountCents <= 0 || !description.trim()) {
      return;
    }

    // Se fizer parte de um parcelamento com múltiplas parcelas, perguntar escopo
    if (installmentInfo.isInstallment && installmentInfo.sisterTransactions.length > 1) {
      setShowInstallmentChoice(true);
      return;
    }

    // Caso contrário, salvar diretamente a transação única
    handleSaveSingle();
  };

  // Salvar apenas a transação/parcela selecionada
  const handleSaveSingle = async () => {
    if (!transaction || !user?.familyId) return;

    const amountCents = parseAmountToCents(amountInput);
    const finalAmountCents = type === 'expense' ? -Math.abs(amountCents) : Math.abs(amountCents);

    // Se for parcela, manter o sufixo (X/Y)
    const suffix = installmentInfo.isInstallment
      ? ` (${installmentInfo.installmentNumber}/${installmentInfo.totalInstallments})`
      : '';
    const finalDescription = `${description.trim()}${suffix}`;

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
  };

  // Salvar em todas as parcelas da série
  const handleSaveAllInstallments = async () => {
    if (!transaction || !user?.familyId) return;

    const amountCents = parseAmountToCents(amountInput);
    const finalAmountCents = type === 'expense' ? -Math.abs(amountCents) : Math.abs(amountCents);
    const cleanBaseDesc = description.trim();

    setLoading(true);
    try {
      const batchUpdates: { id: string; updates: Partial<FinancialTransaction> }[] = [];
      const updatedList: FinancialTransaction[] = [];

      for (const sister of installmentInfo.sisterTransactions) {
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
      console.error('Erro ao atualizar todas as parcelas:', err);
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
        ) : showInstallmentChoice ? (
          /* ==========================================================
             PASSO 2: ESCOLHA DE ESCOPO PARA PARCELAS
             ========================================================== */
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="pill bg-gold/20 text-[#7A4F08] text-[11px] font-bold flex items-center gap-1">
                  <Repeat className="h-3 w-3" />
                  Parcelamento Detectado
                </span>
              </div>
              <h3 className="text-lg font-bold text-navy">
                Como deseja aplicar esta alteração?
              </h3>
              <p className="text-xs text-muted">
                Esta movimentação é a <b>parcela {installmentInfo.installmentNumber} de {installmentInfo.totalInstallments}</b> ({installmentInfo.sisterTransactions.length} parcelas encontradas no sistema).
              </p>
            </div>

            {/* Prévia das alterações */}
            <div className="p-3 rounded-2xl bg-navy/5 border border-navy/10 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted">Nova Descrição Base:</span>
                <b className="text-navy">{description.trim()}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Novo Valor por Parcela:</span>
                <b className={type === 'income' ? 'text-ok' : 'text-danger'}>
                  {type === 'income' ? '+ ' : '- '}
                  {Money.formatCents(parseAmountToCents(amountInput))}
                </b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Categoria & Conta:</span>
                <span className="text-navy font-medium">
                  {category} • {accounts.find((a) => a.id === selectedAccountId)?.name || 'Carteira'}
                </span>
              </div>
            </div>

            {/* Opções de Escopo */}
            <div className="space-y-2.5 pt-1">
              {/* Opção 1: Apenas nesta parcela */}
              <button
                type="button"
                onClick={handleSaveSingle}
                disabled={loading}
                className="w-full text-left p-3.5 rounded-2xl border-2 border-navy/15 hover:border-gold hover:bg-gold/[0.04] transition group flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-navy group-hover:text-gold-deep">
                    <Calendar className="h-4 w-4 text-gold-deep shrink-0" />
                    <span>Alterar apenas nesta parcela ({installmentInfo.installmentNumber}/{installmentInfo.totalInstallments})</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Apenas o lançamento deste mês será modificado. As outras {installmentInfo.totalInstallments - 1} parcelas permanecerão inalteradas.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted group-hover:text-gold-deep shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* Opção 2: Em todas as parcelas */}
              <button
                type="button"
                onClick={handleSaveAllInstallments}
                disabled={loading}
                className="w-full text-left p-3.5 rounded-2xl border-2 border-gold/40 bg-gold/10 hover:border-gold hover:bg-gold/15 transition group flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-navy group-hover:text-gold-deep">
                    <Layers className="h-4 w-4 text-gold-deep shrink-0" />
                    <span>Alterar em todas as {installmentInfo.sisterTransactions.length} parcelas</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Aplica a nova descrição, valor, categoria e conta a <b>todas as parcelas</b> da série, mantendo os vencimentos mensais programados.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gold-deep shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Botões do Rodapé de Escopo */}
            <div className="flex items-center justify-between pt-3 border-t border-navy/10">
              <button
                type="button"
                onClick={() => setShowInstallmentChoice(false)}
                disabled={loading}
                className="btn-line text-xs h-9 px-3.5"
              >
                Voltar à Edição
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="text-xs text-muted hover:text-navy"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* ==========================================================
             PASSO 1: FORMULÁRIO DE EDIÇÃO PRINCIPAL
             ========================================================== */
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
                className="btn-gold text-xs h-10 px-5 gap-1.5"
              >
                <Sparkles className="h-4 w-4" />
                <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
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
