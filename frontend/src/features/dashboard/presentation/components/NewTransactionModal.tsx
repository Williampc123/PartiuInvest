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
} from 'lucide-react';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/firebase';
import { useAppStore } from '@/features/auth/useAppStore';
import { FamilyMember, BankAccount } from '@/core/types';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({ isOpen, onClose }) => {
  const { user, familyMembers, accounts } = useAppStore();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Alimentação');
  const [selectedMemberId, setSelectedMemberId] = useState(user?.memberId || '');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || 'wallet');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<
    'mensal' | 'semanal' | 'quinzenal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
  >('mensal');
  const [recurrenceEndMonth, setRecurrenceEndMonth] = useState('');
  const [visibility, setVisibility] = useState<'family' | 'private'>('family');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const expenseCategories = [
    'Moradia',
    'Alimentação',
    'Transporte',
    'Lazer',
    'Saúde',
    'Educação',
    'Contas Fixas',
    'Outros',
  ];

  const incomeCategories = [
    'Salário',
    'Investimentos / Dividendos',
    'Freelance / Serviços',
    'Mesada / Presente',
    'Outros',
  ];

  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    setCategory(newType === 'expense' ? 'Alimentação' : 'Salário');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = parseAmountToCents(amountInput);

    if (amountCents <= 0 || !description.trim() || !user?.familyId) {
      return;
    }

    setLoading(true);

    try {
      const transRef = doc(collection(db, `families/${user.familyId}/transactions`));
      const finalAmountCents = type === 'expense' ? -Math.abs(amountCents) : Math.abs(amountCents);

      const payload: Record<string, any> = {
        id: transRef.id,
        accountId: selectedAccountId,
        memberId: selectedMemberId || user.memberId,
        visibility,
        description: description.trim(),
        amountCents: finalAmountCents,
        category,
        date,
        type: isRecurring && type === 'expense' ? 'bill' : type,
        isRecurring,
        source: 'manual',
        createdAt: new Date().toISOString(),
      };

      if (isRecurring) {
        payload.recurrenceFrequency = recurrenceFrequency;
        if (recurrenceEndMonth) {
          payload.recurrenceEndMonth = recurrenceEndMonth;
        }
      }

      await setDoc(transRef, payload);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setDescription('');
        setAmountInput('');
        setIsRecurring(false);
        setRecurrenceFrequency('mensal');
        setRecurrenceEndMonth('');
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
                <label className="block text-xs font-bold text-navy mb-1 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5 text-muted" /> Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                >
                  {(type === 'expense' ? expenseCategories : incomeCategories).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
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
                <label className="block text-xs font-bold text-navy mb-1 flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5 text-muted" /> Conta / Origem
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
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
    </div>
  );
};
