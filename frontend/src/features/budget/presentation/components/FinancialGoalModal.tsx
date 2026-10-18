import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  DollarSign,
  TrendingUp,
  Landmark,
  Calendar,
  Percent,
  CheckCircle2,
  AlertCircle,
  PiggyBank,
  Wallet,
} from 'lucide-react';
import {
  FinancialGoal,
  FinancialGoalType,
  FinancialGoalOriginType,
} from '@/features/budget/infrastructure/budgetService';
import { BoxGoal, BankAccount } from '@/core/types';
import { Money } from '@/core/Money';

interface FinancialGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGoal: (goal: FinancialGoal) => void;
  editingGoal?: FinancialGoal | null;
  boxes: BoxGoal[];
  accounts: BankAccount[];
}

const formatCurrencyInput = (cents: number): string => {
  if (!cents || cents <= 0) return '';
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseCurrencyToCents = (valStr: string): number => {
  if (!valStr) return 0;
  const cleanStr = valStr.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : Math.round(num * 100);
};

export const FinancialGoalModal: React.FC<FinancialGoalModalProps> = ({
  isOpen,
  onClose,
  onSaveGoal,
  editingGoal,
  boxes,
  accounts,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<FinancialGoalType>('total_amount');
  const [amountStr, setAmountStr] = useState('');
  const [originType, setOriginType] = useState<FinancialGoalOriginType>('net_worth');
  const [originId, setOriginId] = useState<string>('net_worth');
  const [returnRateAnnual, setReturnRateAnnual] = useState<number>(8);
  const [targetDate, setTargetDate] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    if (editingGoal) {
      setTitle(editingGoal.title || '');
      setType(editingGoal.type || 'total_amount');
      setAmountStr(editingGoal.targetAmountCents ? formatCurrencyInput(editingGoal.targetAmountCents) : '');
      setOriginType(editingGoal.originType || 'net_worth');
      setOriginId(editingGoal.originId || (editingGoal.originType === 'net_worth' ? 'net_worth' : ''));
      setReturnRateAnnual(editingGoal.returnRateAnnual !== undefined ? editingGoal.returnRateAnnual : 8);
      setTargetDate(editingGoal.targetDate || '');
    } else {
      // Padrões para nova meta
      setTitle('');
      setType('total_amount');
      setAmountStr('');
      setOriginType('net_worth');
      setOriginId('net_worth');
      setReturnRateAnnual(8);
      // Padrão de data: 1 ano à frente
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setTargetDate(nextYear.toISOString().split('T')[0]);
    }
    setErrorMsg('');
  }, [isOpen, editingGoal]);

  if (!isOpen) return null;

  const handleOriginChange = (val: string) => {
    if (val === 'net_worth') {
      setOriginType('net_worth');
      setOriginId('net_worth');
    } else if (val.startsWith('box_')) {
      setOriginType('box');
      setOriginId(val.replace('box_', ''));
    } else if (val.startsWith('acc_')) {
      setOriginType('account');
      setOriginId(val.replace('acc_', ''));
    }
  };

  const currentOriginSelectVal = originType === 'net_worth'
    ? 'net_worth'
    : originType === 'box'
    ? `box_${originId}`
    : `acc_${originId}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMsg('Por favor, dê um título/nome para a meta.');
      return;
    }

    const cents = parseCurrencyToCents(amountStr);
    if (cents <= 0) {
      setErrorMsg('Por favor, informe um valor maior que R$ 0,00 para a meta.');
      return;
    }

    if (!targetDate) {
      setErrorMsg('Por favor, defina a data limite (Até) para atingir a meta.');
      return;
    }

    let originName = 'Patrimônio Total';
    if (originType === 'box') {
      const foundBox = boxes.find((b) => b.id === originId);
      originName = foundBox ? `Caixinha: ${foundBox.name}` : 'Caixinha';
    } else if (originType === 'account') {
      const foundAcc = accounts.find((a) => a.id === originId);
      originName = foundAcc ? `Conta: ${foundAcc.name}` : 'Conta Bancária';
    }

    const goalToSave: FinancialGoal = {
      id: editingGoal?.id || `goal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: trimmedTitle,
      type,
      targetAmountCents: cents,
      originType,
      originId: originType === 'net_worth' ? undefined : originId,
      originName,
      returnRateAnnual: type === 'monthly_investment' ? Number(returnRateAnnual) || 8 : undefined,
      targetDate,
      createdAt: editingGoal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveGoal(goalToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-navy-deep/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="card w-full max-w-lg bg-white border border-white/95 shadow-[0_45px_90px_-15px_rgba(10,31,68,.4)] p-5 sm:p-6 rounded-[28px] relative max-h-[95vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between pb-3.5 border-b border-navy/10">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gold/25 text-gold-deep border border-gold/40 shadow-sm">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <span className="pill bg-gold/20 text-gold-deep text-[10px] font-extrabold uppercase tracking-wide">
                🎯 Planejamento de Metas
              </span>
              <h2 className="text-lg sm:text-xl font-black text-navy leading-tight mt-0.5">
                {editingGoal ? 'Editar Meta Financeira' : 'Nova Meta Financeira'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="icon-btn text-muted hover:text-navy hover:bg-navy/5 -mr-1"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pt-4 custom-scrollbar pr-1">
          {/* Nome / Título da Meta */}
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Nome da Meta
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reserva de Emergência, Aporte Mensal em FIIs, Carro Novo..."
              className="w-full h-10 px-3.5 rounded-xl border border-navy/15 text-sm font-semibold text-navy placeholder:text-muted/60 focus:ring-2 focus:ring-gold focus:outline-none"
              autoFocus
            />
          </div>

          {/* Tipo de Meta */}
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
              Tipo de Meta
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setType('total_amount')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  type === 'total_amount'
                    ? 'border-gold bg-gold/10 ring-2 ring-gold/40 shadow-sm'
                    : 'border-navy/10 bg-white hover:border-navy/20 hover:bg-navy/[0.02]'
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    type === 'total_amount' ? 'bg-gold text-navy-deep' : 'bg-navy/5 text-muted'
                  }`}
                >
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <b className="text-xs font-bold text-navy block">Valor em dinheiro total</b>
                  <p className="text-[11px] text-muted leading-tight mt-0.5">
                    Acumular um montante fixo total na origem selecionada.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('monthly_investment')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  type === 'monthly_investment'
                    ? 'border-gold bg-gold/10 ring-2 ring-gold/40 shadow-sm'
                    : 'border-navy/10 bg-white hover:border-navy/20 hover:bg-navy/[0.02]'
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    type === 'monthly_investment' ? 'bg-gold text-navy-deep' : 'bg-navy/5 text-muted'
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <b className="text-xs font-bold text-navy block">Investimentos mensais</b>
                  <p className="text-[11px] text-muted leading-tight mt-0.5">
                    Aporte recorrente todo mês com projeção de juros compostos.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Campo Valor em Reais */}
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              {type === 'total_amount' ? 'Valor Alvo Total (R$)' : 'Valor do Aporte Mensal (R$)'}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                className="w-full h-11 pl-11 pr-3.5 rounded-xl border border-navy/15 text-base font-extrabold text-navy focus:ring-2 focus:ring-gold focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-muted mt-1">
              {type === 'total_amount'
                ? 'Quanto você pretende atingir no total acumulado.'
                : 'Quanto você pretende aportar mês a mês nessa meta.'}
            </p>
          </div>

          {/* Origem */}
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Origem da Meta
            </label>
            <div className="relative">
              <select
                value={currentOriginSelectVal}
                onChange={(e) => handleOriginChange(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-navy/15 text-xs sm:text-sm font-bold text-navy bg-white focus:ring-2 focus:ring-gold focus:outline-none"
              >
                <optgroup label="🌐 Consolidado">
                  <option value="net_worth">Patrimônio Total (Contas + Caixinhas)</option>
                </optgroup>

                {boxes.length > 0 && (
                  <optgroup label="📦 Caixinhas">
                    {boxes.map((b) => (
                      <option key={b.id} value={`box_${b.id}`}>
                        Caixinha: {b.name} ({Money.formatCents(b.currentBalanceCents)})
                      </option>
                    ))}
                  </optgroup>
                )}

                {accounts.length > 0 && (
                  <optgroup label="🏦 Contas Bancárias">
                    {accounts.map((a) => (
                      <option key={a.id} value={`acc_${a.id}`}>
                        Conta: {a.name} ({Money.formatCents(a.balanceCents)})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <p className="text-[11px] text-muted mt-1">
              Onde o progresso financeiro desta meta será monitorado e comparado.
            </p>
          </div>

          {/* Taxa de Retorno (Apenas para Investimentos Mensais) */}
          {type === 'monthly_investment' && (
            <div className="p-3.5 rounded-2xl bg-gold/10 border border-gold/30 animate-in fade-in">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-gold-deep" />
                  Taxa de Retorno (% ao ano)
                </label>
                <span className="text-[10px] font-extrabold text-gold-deep bg-gold/20 px-2 py-0.5 rounded-full">
                  Padrão: 8% a.a.
                </span>
              </div>
              <div className="relative w-36">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={returnRateAnnual}
                  onChange={(e) => setReturnRateAnnual(parseFloat(e.target.value) || 0)}
                  className="w-full h-9 pl-3 pr-8 rounded-xl border border-navy/15 text-sm font-extrabold text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                  % a.a.
                </span>
              </div>
              <p className="text-[11px] text-muted mt-1.5">
                Utilizada para a projeção futura com juros compostos (10, 20 e 30 anos).
              </p>
            </div>
          )}

          {/* Campo Até (Data Limite) */}
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted" />
              Até (Data Alvo)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-navy/15 text-sm font-semibold text-navy bg-white focus:ring-2 focus:ring-gold focus:outline-none"
            />
            <p className="text-[11px] text-muted mt-1">
              Data estimada em que você planeja ter atingido esta meta.
            </p>
          </div>

          {/* Rodapé do Form */}
          <div className="pt-3 border-t border-navy/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="btn-line text-xs h-9 px-4"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-gold text-xs h-9 px-5 font-bold flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Salvar Meta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
