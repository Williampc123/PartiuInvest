import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Repeat,
  Calendar,
  CalendarRange,
  Clock,
  Tag,
  DollarSign,
  User,
  Wallet,
  CheckCircle2,
  Plus,
  Sparkles,
  Info,
} from 'lucide-react';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/firebase';
import { useAppStore } from '@/features/auth/useAppStore';
import { FamilyMember, BankAccount, FinancialCategory } from '@/core/types';
import { getCategoryIconComponent } from '@/core/categories';
import { NewCategoryModal } from '@/features/categories/presentation/components/NewCategoryModal';
import { NewAccountModal } from '@/features/accounts/presentation/components/NewAccountModal';

export type RecurrenceFrequency =
  | 'mensal'
  | 'semanal'
  | 'quinzenal'
  | 'bimestral'
  | 'trimestral'
  | 'semestral'
  | 'anual';

export function calculateRecurrenceDates(
  startDateStr: string,
  frequency: RecurrenceFrequency,
  endMonthStr?: string
): string[] {
  if (!startDateStr) return [];
  if (!endMonthStr) return [startDateStr];

  const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
  const [eYear, eMonth] = endMonthStr.split('-').map(Number);

  if (isNaN(sYear) || isNaN(sMonth) || isNaN(sDay) || isNaN(eYear) || isNaN(eMonth)) {
    return [startDateStr];
  }

  // Último milissegundo do mês final selecionado
  const maxDate = new Date(eYear, eMonth, 0, 23, 59, 59, 999);
  const startDate = new Date(sYear, sMonth - 1, sDay, 12, 0, 0);

  if (startDate.getTime() > maxDate.getTime()) {
    return [startDateStr];
  }

  const dates: string[] = [];
  let k = 0;
  const maxOccurrences = 240; // Limite de segurança de 240 parcelas

  while (k < maxOccurrences) {
    let nextDate: Date;

    if (frequency === 'semanal') {
      nextDate = new Date(sYear, sMonth - 1, sDay + k * 7, 12, 0, 0);
    } else if (frequency === 'quinzenal') {
      nextDate = new Date(sYear, sMonth - 1, sDay + k * 14, 12, 0, 0);
    } else {
      let monthStep = 1;
      if (frequency === 'bimestral') monthStep = 2;
      else if (frequency === 'trimestral') monthStep = 3;
      else if (frequency === 'semestral') monthStep = 6;
      else if (frequency === 'anual') monthStep = 12;

      const totalTargetMonth = sMonth - 1 + k * monthStep;
      const targetYear = sYear + Math.floor(totalTargetMonth / 12);
      const targetMonth = totalTargetMonth % 12;
      const maxDaysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const targetDay = Math.min(sDay, maxDaysInTargetMonth);

      nextDate = new Date(targetYear, targetMonth, targetDay, 12, 0, 0);
    }

    if (nextDate.getTime() > maxDate.getTime()) {
      break;
    }

    const yyyy = nextDate.getFullYear();
    const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
    const dd = String(nextDate.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);

    k++;
  }

  return dates.length > 0 ? dates : [startDateStr];
}

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({ isOpen, onClose }) => {
  const { user, familyMembers, accounts, categories } = useAppStore();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Alimentação');
  const [selectedMemberId, setSelectedMemberId] = useState(user?.memberId || '');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || 'wallet');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>('mensal');
  const [recurrenceEndMonth, setRecurrenceEndMonth] = useState('');
  const [visibility, setVisibility] = useState<'family' | 'private'>('family');
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isNewCatModalOpen, setIsNewCatModalOpen] = useState(false);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);

  if (!isOpen) return null;

  // Filtrar categorias aplicáveis ao tipo selecionado
  const currentCategories = categories.filter(
    (c) => c.type === 'both' || c.type === type
  );

  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    const firstCat = categories.find((c) => c.type === newType || c.type === 'both');
    setCategory(firstCat ? firstCat.name : (newType === 'expense' ? 'Alimentação' : 'Salário'));
  };

  const handleCategoryCreated = (newCat: FinancialCategory) => {
    setCategory(newCat.name);
  };

  const handleAccountCreated = (newAcc: BankAccount) => {
    setSelectedAccountId(newAcc.id);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir dígitos e vírgula/ponto
    let val = e.target.value.replace(/[^0-9.,]/g, '');
    setAmountInput(val);
  };

  const parseAmountToCents = (valStr: string): number => {
    const cleanStr = valStr.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : Math.round(num * 100);
  };

  const previewDates =
    isRecurring && recurrenceEndMonth
      ? calculateRecurrenceDates(date, recurrenceFrequency, recurrenceEndMonth)
      : [];
  const previewCount = previewDates.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = parseAmountToCents(amountInput);

    if (amountCents <= 0 || !description.trim() || !user?.familyId) {
      return;
    }

    setLoading(true);

    try {
      const finalAmountCents = type === 'expense' ? -Math.abs(amountCents) : Math.abs(amountCents);
      const isRecurringActive = isRecurring && Boolean(recurrenceEndMonth);
      const recurrenceDates = isRecurringActive
        ? calculateRecurrenceDates(date, recurrenceFrequency, recurrenceEndMonth)
        : [date];

      const totalInstallments = recurrenceDates.length;
      const batch = writeBatch(db);

      recurrenceDates.forEach((recDate, index) => {
        const transRef = doc(collection(db, `families/${user.familyId}/transactions`));
        const installmentSuffix =
          totalInstallments > 1 ? ` (${index + 1}/${totalInstallments})` : '';
        const finalDescription = `${description.trim()}${installmentSuffix}`;

        const payload: Record<string, any> = {
          id: transRef.id,
          accountId: selectedAccountId,
          memberId: selectedMemberId || user.memberId,
          visibility,
          description: finalDescription,
          amountCents: finalAmountCents,
          category,
          date: recDate,
          type: isRecurring && type === 'expense' ? 'bill' : type,
          isRecurring,
          isPaid,
          source: 'manual',
          createdAt: new Date().toISOString(),
        };

        if (isRecurring) {
          payload.recurrenceFrequency = recurrenceFrequency;
          if (recurrenceEndMonth) {
            payload.recurrenceEndMonth = recurrenceEndMonth;
          }
          if (totalInstallments > 1) {
            payload.installmentNumber = index + 1;
            payload.totalInstallments = totalInstallments;
          }
        }

        batch.set(transRef, payload);
      });

      await batch.commit();

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setDescription('');
        setAmountInput('');
        setIsRecurring(false);
        setRecurrenceFrequency('mensal');
        setRecurrenceEndMonth('');
        setIsPaid(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao salvar movimentação no Firestore:', error);
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
          <div className="py-10 text-center space-y-3">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok/15 text-ok">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-navy">Movimentação Registrada!</h3>
            <p className="text-xs text-muted">
              Os dados foram atualizados no Firestore e refletidos no painel familiar.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-navy">Nova Movimentação</h3>
              <p className="text-xs text-muted">Cadastre uma receita ou despesa na sua família</p>
            </div>

            {/* Alternador de Tipo: Receita vs Despesa */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-navy/5 border border-navy/10">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
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
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
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
                placeholder={type === 'expense' ? 'Ex: Supermercado Mensal, Aluguel...' : 'Ex: Salário, Rendimentos...'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
              />
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

            {/* Bloco de Recorrência */}
            <div className={`p-3.5 rounded-2xl transition-all border ${
              isRecurring ? 'bg-gold/10 border-gold/30 space-y-3' : 'bg-navy/5 border-navy/10'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className={`h-4 w-4 ${isRecurring ? 'text-gold-deep' : 'text-muted'}`} />
                  <div>
                    <b className="block text-xs text-navy">Lançamento Recorrente?</b>
                    <small className="text-[10px] text-muted">
                      {isRecurring ? 'Configurar repetição periódica' : 'Repete periodicamente (ex: salário, aluguel, assinatura)'}
                    </small>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="h-4 w-4 rounded accent-gold cursor-pointer"
                />
              </div>

              {isRecurring && (
                <div className="pt-3 border-t border-gold/20 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-gold-deep" /> Periodicidade
                    </label>
                    <select
                      value={recurrenceFrequency}
                      onChange={(e) => setRecurrenceFrequency(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-xl border border-navy/15 bg-white text-xs font-semibold text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                    >
                      <option value="mensal">Mensal (todo mês)</option>
                      <option value="semanal">Semanal (toda semana)</option>
                      <option value="quinzenal">Quinzenal (a cada 15 dias)</option>
                      <option value="bimestral">Bimestral (a cada 2 meses)</option>
                      <option value="trimestral">Trimestral (a cada 3 meses)</option>
                      <option value="semestral">Semestral (a cada 6 meses)</option>
                      <option value="anual">Anual (uma vez por ano)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1 flex items-center gap-1">
                      <CalendarRange className="h-3.5 w-3.5 text-gold-deep" /> Data Final (Mês / Ano)
                    </label>
                    <input
                      type="month"
                      value={recurrenceEndMonth}
                      min={date ? date.slice(0, 7) : undefined}
                      onChange={(e) => setRecurrenceEndMonth(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-navy/15 bg-white text-xs font-semibold text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                    />
                  </div>

                  {previewCount > 1 ? (
                    <div className="col-span-1 sm:col-span-2 p-2.5 rounded-xl bg-gold/15 border border-gold/30 text-[11px] text-navy font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-gold-deep shrink-0" />
                      <span>
                        Serão gerados <b>{previewCount} lançamentos</b> com parcelas automáticas:{' '}
                        <span className="font-bold text-navy-soft">
                          "{description.trim() || 'Lançamento'} (1/{previewCount})"
                        </span>{' '}
                        até{' '}
                        <span className="font-bold text-navy-soft">
                          "({previewCount}/{previewCount})"
                        </span>.
                      </span>
                    </div>
                  ) : !recurrenceEndMonth ? (
                    <div className="col-span-1 sm:col-span-2 text-[11px] text-muted flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-muted shrink-0" />
                      <span>Selecione o mês final para gerar as parcelas numeradas (ex: 1/8 a 8/8).</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-navy/10">
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
                {loading ? 'Salvando...' : 'Salvar Movimentação'}
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
        onSuccess={handleCategoryCreated}
      />

      {/* Modal Rápido para Criar Nova Conta Bancária */}
      <NewAccountModal
        isOpen={isNewAccountModalOpen}
        onClose={() => setIsNewAccountModalOpen(false)}
        onSuccess={handleAccountCreated}
      />
    </div>
  );
};
