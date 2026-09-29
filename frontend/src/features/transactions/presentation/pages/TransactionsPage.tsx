import React, { useState } from 'react';
import { useAppStore } from '@/features/auth/useAppStore';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Plus,
  Search,
  Trash2,
  Receipt,
  Calendar,
  Wallet,
  Repeat,
  Sparkles,
  Tag,
  Pencil,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Money } from '@/core/Money';
import { FinancialTransaction, BankAccount } from '@/core/types';
import {
  deleteTransactionFromFirestore,
  deleteMultipleTransactionsFromFirestore,
  updateTransactionInFirestore,
  updateBankAccountInFirestore,
} from '@/features/dashboard/infrastructure/firestoreDataService';
import { NewTransactionModal } from '@/features/dashboard/presentation/components/NewTransactionModal';
import {
  EditTransactionModal,
  getInstallmentInfo,
} from '@/features/transactions/presentation/components/EditTransactionModal';
import { ManageCategoriesModal } from '@/features/categories/presentation/components/ManageCategoriesModal';
import { getCategoryIconComponent, getCategoryColor } from '@/core/categories';
import { filterTransactionsByPeriod, formatPeriodLabel } from '@/core/dateUtils';
import Swal from 'sweetalert2';

export const TransactionsPage: React.FC = () => {
  const {
    transactions,
    familyMembers,
    selectedMemberId,
    periodFilter,
    accounts,
    categories,
    user,
    setTransactions,
    updateTransaction,
  } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense' | 'bill'>('all');
  const [selectedPaidStatus, setSelectedPaidStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 1. Filtragem por membro
  const memberTransactions = selectedMemberId === 'all'
    ? transactions
    : transactions.filter((t: FinancialTransaction) => t.memberId === selectedMemberId);

  // 2. Filtragem por período selecionado (mês ou intervalo de datas)
  const periodTransactions = filterTransactionsByPeriod(memberTransactions, periodFilter);

  // Cálculos de Totais para o período selecionado
  const incomeCents = periodTransactions
    .filter((t) => t.type === 'income' || t.amountCents > 0)
    .reduce((acc, t) => acc + Math.abs(t.amountCents), 0);

  const expenseCents = periodTransactions
    .filter((t) => (t.type === 'expense' || t.type === 'bill' || t.amountCents < 0))
    .reduce((acc, t) => acc + Math.abs(t.amountCents), 0);

  const billsCents = periodTransactions
    .filter((t) => t.type === 'bill')
    .reduce((acc, t) => acc + Math.abs(t.amountCents), 0);

  const netCents = incomeCents - expenseCents;

  // Filtragem combinada
  const filteredList = periodTransactions.filter((t) => {
    // Filtro de Busca
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      if (!matchDesc && !matchCat) return false;
    }

    // Filtro de Tipo
    if (selectedType === 'income') {
      if (t.type !== 'income' && t.amountCents <= 0) return false;
    }
    if (selectedType === 'expense') {
      if (t.type !== 'expense' && t.type !== 'bill' && t.amountCents >= 0) return false;
    }
    if (selectedType === 'bill') {
      if (t.type !== 'bill') return false;
    }

    // Filtro de Status de Pagamento (Pago vs Pendente)
    if (selectedPaidStatus === 'paid' && t.isPaid !== true) return false;
    if (selectedPaidStatus === 'pending' && t.isPaid === true) return false;

    // Filtro de Categoria
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;

    return true;
  });

  // Lista única de categorias para o filtro combinando cadastradas e transações
  const allCategoryNames = Array.from(
    new Set([
      ...categories.map((c) => c.name),
      ...memberTransactions.map((t) => t.category),
    ].filter(Boolean))
  );

  // Alternância rápida de status Pago vs Pendente
  const handleTogglePaid = async (t: FinancialTransaction) => {
    if (!user?.familyId) return;
    const currentPaid = t.isPaid === true;
    const newPaid = !currentPaid;
    try {
      await updateTransactionInFirestore(user.familyId, t.id, { isPaid: newPaid });
      updateTransaction({ ...t, isPaid: newPaid });

      // Atualizar saldo da conta bancária vinculada se aplicável
      if (t.accountId && t.accountId !== 'wallet') {
        try {
          const targetAcc = accounts.find((a) => a.id === t.accountId);
          if (targetAcc) {
            const delta = newPaid ? t.amountCents : -t.amountCents;
            const newBal = Math.max(0, targetAcc.balanceCents + delta);
            await updateBankAccountInFirestore(user.familyId, t.accountId, { balanceCents: newBal });
          }
        } catch (accErr) {
          console.warn('Erro ao atualizar saldo da conta bancária no toggle:', accErr);
        }
      }

      showToast(newPaid ? 'Movimentação marcada como Paga/Recebida!' : 'Movimentação desmarcada (Pendente).');
    } catch (err) {
      console.error('Erro ao alternar status de pagamento:', err);
    }
  };

  // Exclusão de movimentação com suporte a parcelas vinculadas e SweetAlert2
  const handleDelete = async (trans: FinancialTransaction) => {
    if (!user?.familyId) return;

    const installmentInfo = getInstallmentInfo(trans, transactions);
    const hasSisterInstallments = installmentInfo.isInstallment && installmentInfo.sisterTransactions.length > 1;

    if (hasSisterInstallments) {
      const result = await Swal.fire({
        title: 'Excluir Movimentação Parcelada',
        html: `
          <div class="text-left text-sm text-navy space-y-2.5">
            <p>A movimentação <b>"${trans.description}"</b> faz parte de uma série de <b>${installmentInfo.totalInstallments} parcelas</b>.</p>
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
          await deleteTransactionFromFirestore(user.familyId, trans.id);
          setTransactions(transactions.filter((t) => t.id !== trans.id));
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
        html: `<p class="text-sm text-navy">Tem certeza que deseja remover <b>"${trans.description}"</b>?</p>`,
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
          await deleteTransactionFromFirestore(user.familyId, trans.id);
          setTransactions(transactions.filter((t) => t.id !== trans.id));
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

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-navy text-white px-4 py-3 shadow-2xl flex items-center gap-2.5 text-sm animate-in fade-in slide-in-from-bottom-3 border border-gold/40">
          <Sparkles className="h-4 w-4 text-gold shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Topo do Módulo de Movimentações */}
      <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-gold-light to-gold text-navy-deep shadow-md">
            <ArrowUpDown className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy">Movimentações & Extrato</h2>
            <p className="text-xs text-muted">
              Controle detalhado de fluxo de caixa, receitas, despesas e pagamentos da família.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsManageCategoriesOpen(true)}
            className="btn-line text-xs h-[38px] px-3.5 gap-1.5"
            title="Gerenciar e cadastrar novas categorias"
          >
            <Tag className="h-4 w-4 text-gold-deep" />
            <span>Categorias</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-gold text-xs h-[38px] px-4 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Movimentação</span>
          </button>
        </div>
      </div>

      {/* Cards de Resumo Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="card !p-4 bg-gradient-to-br from-white/90 to-white/60">
          <div className="flex items-center justify-between">
            <small className="text-xs text-muted">Receitas do Mês</small>
            <div className="h-6 w-6 rounded-lg bg-ok/10 text-ok grid place-items-center">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <b className="text-xl font-extrabold text-ok tracking-tight mt-1 block">
            {Money.formatCents(incomeCents)}
          </b>
          <span className="text-[11px] text-muted mt-0.5 block">Entradas confirmadas</span>
        </div>

        <div className="card !p-4 bg-gradient-to-br from-white/90 to-white/60">
          <div className="flex items-center justify-between">
            <small className="text-xs text-muted">Despesas do Mês</small>
            <div className="h-6 w-6 rounded-lg bg-danger/10 text-danger grid place-items-center">
              <TrendingDown className="h-3.5 w-3.5" />
            </div>
          </div>
          <b className="text-xl font-extrabold text-danger tracking-tight mt-1 block">
            {Money.formatCents(expenseCents)}
          </b>
          <span className="text-[11px] text-muted mt-0.5 block">Gastos variáveis e fixos</span>
        </div>

        <div className="card !p-4 bg-gradient-to-br from-white/90 to-white/60">
          <div className="flex items-center justify-between">
            <small className="text-xs text-muted">Sobrou no Mês</small>
            <div className={`h-6 w-6 rounded-lg grid place-items-center ${netCents >= 0 ? 'bg-ok/10 text-ok' : 'bg-danger/10 text-danger'}`}>
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <b className={`text-xl font-extrabold tracking-tight mt-1 block ${netCents >= 0 ? 'text-navy' : 'text-danger'}`}>
            {Money.formatCents(netCents)}
          </b>
          <span className="text-[11px] text-muted mt-0.5 block">
            {netCents >= 0 ? 'Superávit financeiro' : 'Atenção aos gastos'}
          </span>
        </div>

        <div className="card !p-4 bg-gradient-to-br from-white/90 to-white/60">
          <div className="flex items-center justify-between">
            <small className="text-xs text-muted">Boletos & Fixos</small>
            <div className="h-6 w-6 rounded-lg bg-gold/20 text-gold-deep grid place-items-center">
              <Receipt className="h-3.5 w-3.5" />
            </div>
          </div>
          <b className="text-xl font-extrabold text-navy tracking-tight mt-1 block">
            {Money.formatCents(billsCents)}
          </b>
          <span className="text-[11px] text-muted mt-0.5 block">Contas programadas</span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="card !p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por descrição ou categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-navy/15 bg-white text-xs text-navy focus:ring-2 focus:ring-gold focus:outline-none placeholder:text-muted/60"
          />
        </div>

        {/* Pílulas de Filtro de Tipo */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedType === 'all'
                ? 'bg-navy text-white shadow-sm'
                : 'bg-navy/5 text-muted hover:text-navy'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('income')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              selectedType === 'income'
                ? 'bg-ok text-white shadow-sm'
                : 'bg-ok/10 text-ok hover:bg-ok/20'
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            <span>Receitas</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('expense')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              selectedType === 'expense'
                ? 'bg-danger text-white shadow-sm'
                : 'bg-danger/10 text-danger hover:bg-danger/20'
            }`}
          >
            <TrendingDown className="h-3 w-3" />
            <span>Despesas</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('bill')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              selectedType === 'bill'
                ? 'bg-gold-deep text-white shadow-sm'
                : 'bg-gold/20 text-gold-deep hover:bg-gold/30'
            }`}
          >
            <Receipt className="h-3 w-3" />
            <span>Boletos</span>
          </button>

          {/* Filtro de Categoria */}
          {allCategoryNames.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 px-2.5 rounded-xl border border-navy/15 bg-white text-xs text-navy font-semibold focus:ring-2 focus:ring-gold focus:outline-none"
            >
              <option value="all">Todas as Categorias</option>
              {allCategoryNames.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {/* Divisor */}
          <span className="text-navy/20 hidden sm:inline">|</span>

          {/* Filtro de Status de Pagamento */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectedPaidStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                selectedPaidStatus === 'all'
                  ? 'bg-navy/10 text-navy font-extrabold'
                  : 'text-muted hover:text-navy'
              }`}
              title="Exibir todos os status"
            >
              Status: Todos
            </button>
            <button
              type="button"
              onClick={() => setSelectedPaidStatus('paid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                selectedPaidStatus === 'paid'
                  ? 'bg-ok/20 text-ok border border-ok/30 shadow-sm'
                  : 'text-muted hover:text-ok'
              }`}
              title="Filtrar apenas movimentações pagas/recebidas"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Pagos</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedPaidStatus('pending')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                selectedPaidStatus === 'pending'
                  ? 'bg-amber-500/20 text-amber-700 border border-amber-500/30 shadow-sm'
                  : 'text-muted hover:text-amber-700'
              }`}
              title="Filtrar apenas movimentações pendentes / a pagar"
            >
              <Clock className="h-3 w-3" />
              <span>Pendentes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Movimentações */}
      {filteredList.length === 0 ? (
        <div className="card text-center py-12 space-y-3">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-navy/5 text-muted">
            <ArrowUpDown className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-navy">Nenhuma movimentação encontrada</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {searchQuery || selectedType !== 'all' || selectedCategory !== 'all'
              ? 'Tente ajustar os filtros de busca ou tipo de transação.'
              : 'Comece registrando a primeira receita, compra ou conta do mês.'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-gold text-xs h-9 px-4 gap-1.5 mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Movimentação</span>
          </button>
        </div>
      ) : (
        <div className="card !p-0 sm:overflow-hidden bg-transparent sm:bg-white/60 border-0 sm:border border-white/80">
          <div className="flex flex-col gap-2.5 sm:gap-0 sm:divide-y sm:divide-navy/10">
            {filteredList.map((t: FinancialTransaction) => {
              const isIncome = t.type === 'income' || t.amountCents > 0;
              const isBill = t.type === 'bill';
              const member = familyMembers.find((m) => m.id === t.memberId);
              const account = accounts.find((a) => a.id === t.accountId);
              const CategoryIcon = getCategoryIconComponent(t.category);
              const categoryColor = getCategoryColor(t.category, categories);

              return (
                <div
                  key={t.id}
                  className="rounded-2xl sm:rounded-none bg-white/85 sm:bg-transparent border border-navy/10 sm:border-0 p-3.5 sm:p-4 shadow-sm sm:shadow-none hover:bg-white/90 transition group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Linha Superior no Mobile / Lado Esquerdo no Desktop */}
                  <div className="flex items-start sm:items-center justify-between sm:justify-start gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl grid place-items-center shrink-0 shadow-sm transition-transform duration-200"
                        style={{
                          backgroundColor: `${categoryColor}18`,
                          color: categoryColor,
                        }}
                      >
                        <CategoryIcon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-navy truncate">{t.description}</p>
                          {t.source === 'open_finance' && (
                            <span className="pill bg-ok/10 text-ok text-[10px] py-0 px-1.5">
                              Open Finance
                            </span>
                          )}
                          {(isBill || t.isRecurring) && (
                            <span className="pill bg-gold/25 text-[#7A4F08] text-[10px] py-0 px-1.5 font-bold flex items-center gap-0.5">
                              <Repeat className="h-2.5 w-2.5" />
                              {t.recurrenceFrequency
                                ? `${t.recurrenceFrequency.charAt(0).toUpperCase() + t.recurrenceFrequency.slice(1)}`
                                : isBill ? 'Fixo' : 'Recorrente'}
                              {t.recurrenceEndMonth
                                ? ` (até ${t.recurrenceEndMonth.split('-').reverse().join('/')})`
                                : ''}
                            </span>
                          )}
                        </div>

                        {/* Metadados: Categoria, Data, Titular, Conta */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] text-muted mt-1">
                          <span
                            className="font-semibold px-2 py-0.5 rounded-md text-[10px]"
                            style={{
                              backgroundColor: `${categoryColor}15`,
                              color: categoryColor,
                            }}
                          >
                            {t.category}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {t.date || 'Hoje'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: member?.color || '#F5B82E' }}
                            />
                            {member?.displayName || user?.displayName || 'Membro'}
                          </span>
                          {account && (
                            <>
                              <span>•</span>
                              <span className="truncate">{account.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação no Mobile (Visíveis no topo à direita) */}
                    <div className="flex items-center gap-1 sm:hidden shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingTransaction(t)}
                        title="Editar Movimentação"
                        className="p-1.5 rounded-lg text-muted hover:text-navy hover:bg-navy/5 transition"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(t)}
                        title="Excluir Movimentação"
                        className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Linha Inferior no Mobile / Lado Direito no Desktop */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-navy/10 shrink-0">
                    {/* Botão Interativo de Status Pago / Pendente */}
                    <button
                      type="button"
                      onClick={() => handleTogglePaid(t)}
                      title={t.isPaid === true ? 'Clique para desmarcar (tornar Pendente)' : 'Clique para marcar como Pago/Recebido'}
                      className={`px-2.5 py-1.5 sm:py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 border shadow-sm cursor-pointer ${
                        t.isPaid === true
                          ? 'bg-ok/15 text-ok border-ok/30 hover:bg-ok/25'
                          : 'bg-navy/[0.03] text-muted hover:text-navy border-navy/15 hover:border-gold hover:bg-gold/10'
                      }`}
                    >
                      {t.isPaid === true ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-ok shrink-0" />
                          <span>{isIncome ? 'Recebido' : 'Pago'}</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3.5 w-3.5 text-muted shrink-0" />
                          <span>{isIncome ? 'A receber' : 'Pendente'}</span>
                        </>
                      )}
                    </button>

                    {/* Valor Formatado */}
                    <div className="text-right">
                      <p
                        className={`text-sm sm:text-base font-extrabold tracking-tight ${
                          isIncome ? 'text-ok' : isBill ? 'text-navy' : 'text-danger'
                        }`}
                      >
                        {isIncome ? '+ ' : isBill ? '' : '- '}
                        {Money.formatCents(Math.abs(t.amountCents))}
                      </p>
                      <span className="text-[10px] text-muted capitalize block sm:hidden">
                        {isIncome ? 'Receita' : isBill ? 'Conta Fixa' : 'Despesa'}
                      </span>
                    </div>

                    {/* Botões de Ação no Desktop (Hover) */}
                    <div className="hidden sm:flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingTransaction(t)}
                        title="Editar Movimentação"
                        className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg text-muted hover:text-navy hover:bg-navy/5"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(t)}
                        title="Excluir Movimentação"
                        className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Nova Movimentação */}
      <NewTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Modal de Edição de Movimentação (com suporte a parcelas) */}
      <EditTransactionModal
        isOpen={Boolean(editingTransaction)}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSuccess={() => showToast('Movimentação atualizada com sucesso!')}
      />

      {/* Modal de Gerenciamento de Categorias */}
      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
      />
    </div>
  );
};
