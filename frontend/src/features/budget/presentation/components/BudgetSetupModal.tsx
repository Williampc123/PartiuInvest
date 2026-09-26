import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart,
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Percent,
  AlertTriangle,
  ArrowRight,
  Info,
  X,
  Wallet,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { useAppStore } from '@/features/auth/useAppStore';
import { Money } from '@/core/Money';
import { getCategoryColor, getCategoryIconComponent, DEFAULT_CATEGORIES } from '@/core/categories';
import {
  BudgetAllocationItem,
  saveBudgetConfig,
  generateProvisionedBudgetExpenses,
} from '@/features/budget/infrastructure/budgetService';

export interface BudgetAllocationFormItem {
  id: string;
  categoryName: string;
  percentage: number;
  percentageStr: string;
  amountCents: number;
  amountStr: string;
  dueDay: number;
  accountId?: string;
  color?: string;
  notes?: string;
}

interface BudgetSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatMoneyInput = (cents: number): string => {
  if (!cents || cents <= 0) return '';
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseMoneyInputToCents = (valStr: string): number => {
  if (!valStr) return 0;
  const cleanStr = valStr.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : Math.round(num * 100);
};

const parsePercentageInput = (valStr: string): number => {
  if (!valStr) return 0;
  const cleanStr = valStr.replace(',', '.').replace(/[^0-9.]/g, '');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : Math.max(0, num);
};

export const BudgetSetupModal: React.FC<BudgetSetupModalProps> = ({ isOpen, onClose }) => {
  const { user, familyMembers, accounts, categories, transactions, budgetConfig } = useAppStore();

  // 1. Receita total da família calculada a partir dos membros configurados
  const calculatedIncomeCents = useMemo(() => {
    if (!familyMembers || familyMembers.length === 0) return 0;
    return familyMembers.reduce((sum, m) => sum + (m.monthlyIncomeCents || 0), 0);
  }, [familyMembers]);

  // Permite override se não houver membros configurados ainda
  const [baseIncomeInput, setBaseIncomeInput] = useState('');
  const [items, setItems] = useState<BudgetAllocationFormItem[]>([]);
  const [provisionExpenses, setProvisionExpenses] = useState(true);
  const [provisionPeriod, setProvisionPeriod] = useState<'3m' | '6m' | '1y' | '2y' | '3y' | 'custom'>('1y');
  const [customMonths, setCustomMonths] = useState(12);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Renda base efetiva
  const effectiveTotalIncomeCents = useMemo(() => {
    if (calculatedIncomeCents > 0) return calculatedIncomeCents;
    if (!baseIncomeInput) return 0;
    const cleanStr = baseIncomeInput.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : Math.round(num * 100);
  }, [calculatedIncomeCents, baseIncomeInput]);

  // Lista apenas categorias do tipo 'expense' ou 'both'
  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'expense' || c.type === 'both');
  }, [categories]);

  // Aplicação de Presets Financeiros
  const applyPreset = (type: '50-30-20' | '60-20-20' | 'essential', incomeCents: number) => {
    const inc = incomeCents > 0 ? incomeCents : 500000;
    let presetItems: { cat: string; pct: number; day: number }[] = [];

    if (type === '50-30-20') {
      presetItems = [
        { cat: 'Moradia', pct: 25, day: 10 },
        { cat: 'Supermercado', pct: 15, day: 5 },
        { cat: 'Transporte', pct: 10, day: 8 },
        { cat: 'Lazer', pct: 15, day: 15 },
        { cat: 'Compras & Vestuário', pct: 15, day: 20 },
        { cat: 'Investimentos / Dividendos', pct: 20, day: 5 },
      ];
    } else if (type === '60-20-20') {
      presetItems = [
        { cat: 'Moradia', pct: 30, day: 10 },
        { cat: 'Supermercado', pct: 20, day: 5 },
        { cat: 'Contas Fixas', pct: 10, day: 10 },
        { cat: 'Lazer', pct: 20, day: 15 },
        { cat: 'Investimentos / Dividendos', pct: 20, day: 5 },
      ];
    } else {
      presetItems = [
        { cat: 'Moradia', pct: 30, day: 10 },
        { cat: 'Alimentação', pct: 20, day: 5 },
        { cat: 'Transporte', pct: 10, day: 8 },
        { cat: 'Saúde', pct: 10, day: 12 },
        { cat: 'Educação', pct: 10, day: 10 },
        { cat: 'Lazer', pct: 10, day: 15 },
        { cat: 'Investimentos / Dividendos', pct: 10, day: 5 },
      ];
    }

    const mapped: BudgetAllocationFormItem[] = presetItems.map((p, idx) => {
      const amountCents = Math.round((inc * p.pct) / 100);
      return {
        id: `bud_preset_${idx}_${Date.now()}`,
        categoryName: p.cat,
        percentage: p.pct,
        percentageStr: String(p.pct),
        amountCents,
        amountStr: formatMoneyInput(amountCents),
        dueDay: p.day,
        accountId: 'wallet',
        color: getCategoryColor(p.cat, categories),
      };
    });

    setItems(mapped);
  };

  // Inicializar itens padrão na abertura
  useEffect(() => {
    if (!isOpen) return;

    if (calculatedIncomeCents > 0) {
      setBaseIncomeInput((calculatedIncomeCents / 100).toFixed(2).replace('.', ','));
    } else if (budgetConfig?.totalIncomeCents) {
      setBaseIncomeInput((budgetConfig.totalIncomeCents / 100).toFixed(2).replace('.', ','));
    } else {
      setBaseIncomeInput((prev) => prev || '');
    }

    // Se já existirem itens salvos no Firestore, carrega a configuração da família
    if (budgetConfig?.items && budgetConfig.items.length > 0) {
      const loaded: BudgetAllocationFormItem[] = budgetConfig.items.map((it) => ({
        id: it.id,
        categoryName: it.categoryName,
        percentage: it.percentage,
        percentageStr: String(it.percentage),
        amountCents: it.amountCents,
        amountStr: formatMoneyInput(it.amountCents),
        dueDay: it.dueDay || 10,
        accountId: it.accountId || 'wallet',
        color: it.color || getCategoryColor(it.categoryName, categories),
        notes: it.notes,
      }));
      setItems(loaded);
    } else if (items.length === 0) {
      applyPreset('50-30-20', calculatedIncomeCents || 500000);
    } else {
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          percentageStr: it.percentageStr !== undefined ? it.percentageStr : (it.percentage ? String(it.percentage) : ''),
          amountStr: it.amountStr !== undefined ? it.amountStr : (it.amountCents ? formatMoneyInput(it.amountCents) : ''),
        }))
      );
    }
  }, [isOpen, calculatedIncomeCents, budgetConfig]);

  if (!isOpen) return null;

  // Total alocado e saldo restante
  const totalAllocatedCents = items.reduce((sum, i) => sum + (i.amountCents || 0), 0);
  const totalAllocatedPercent = effectiveTotalIncomeCents > 0
    ? (totalAllocatedCents / effectiveTotalIncomeCents) * 100
    : items.reduce((sum, i) => sum + (i.percentage || 0), 0);

  const remainingCents = effectiveTotalIncomeCents - totalAllocatedCents;
  const remainingPercent = 100 - totalAllocatedPercent;

  // Atualização de Porcentagem com digitação fluida
  const handlePercentageChange = (id: string, newStr: string) => {
    // Permite digitação natural de números, vírgulas e decimais (ex: '0', '15', '15,5', '')
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const pct = parsePercentageInput(newStr);
        const newAmountCents = effectiveTotalIncomeCents > 0
          ? Math.round((effectiveTotalIncomeCents * pct) / 100)
          : item.amountCents;

        return {
          ...item,
          percentage: pct,
          percentageStr: newStr,
          amountCents: newAmountCents,
          amountStr: newAmountCents > 0 ? formatMoneyInput(newAmountCents) : (newStr === '' ? '' : '0,00'),
        };
      })
    );
  };

  const handlePercentageBlur = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const formatted = item.percentage > 0 ? String(item.percentage) : '0';
        return {
          ...item,
          percentageStr: item.percentageStr.trim() === '' ? '0' : formatted,
        };
      })
    );
  };

  // Atualização de Valor R$ com digitação fluida
  const handleAmountChange = (id: string, newStr: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const cents = parseMoneyInputToCents(newStr);
        const pct = effectiveTotalIncomeCents > 0
          ? parseFloat(((cents / effectiveTotalIncomeCents) * 100).toFixed(1))
          : 0;

        return {
          ...item,
          amountCents: cents,
          amountStr: newStr,
          percentage: pct,
          percentageStr: pct > 0 ? String(pct) : (newStr === '' ? '' : '0'),
        };
      })
    );
  };

  const handleAmountBlur = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          amountStr: item.amountCents > 0 ? formatMoneyInput(item.amountCents) : (item.amountStr.trim() ? '0,00' : ''),
        };
      })
    );
  };

  const handleCategoryChange = (id: string, newCat: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              categoryName: newCat,
              color: getCategoryColor(newCat, categories),
            }
          : item
      )
    );
  };

  const handleDueDayChange = (id: string, newDay: string) => {
    const day = Math.max(1, Math.min(31, parseInt(newDay, 10) || 10));
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, dueDay: day } : item))
    );
  };

  const handleNotesChange = (id: string, newNotes: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes: newNotes } : item))
    );
  };

  const handleAccountChange = (id: string, newAccountId: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, accountId: newAccountId } : item))
    );
  };

  const handleAddItem = () => {
    const defaultCat = expenseCategories[items.length % expenseCategories.length]?.name || 'Outros';
    const pct = 10;
    const amountCents = effectiveTotalIncomeCents > 0 ? Math.round(effectiveTotalIncomeCents * 0.1) : 0;
    const newItem: BudgetAllocationFormItem = {
      id: `bud_item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      categoryName: defaultCat,
      percentage: pct,
      percentageStr: String(pct),
      amountCents,
      amountStr: amountCents > 0 ? formatMoneyInput(amountCents) : '',
      dueDay: 10,
      accountId: accounts[0]?.id || 'wallet',
      color: getCategoryColor(defaultCat, categories),
      notes: '',
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const getMonthsCount = (): number => {
    if (!provisionExpenses) return 1;
    switch (provisionPeriod) {
      case '3m': return 3;
      case '6m': return 6;
      case '1y': return 12;
      case '2y': return 24;
      case '3y': return 36;
      case 'custom': return Math.max(1, Math.min(60, customMonths || 1));
      default: return 12;
    }
  };

  const getPeriodRangeLabel = (months: number): string => {
    const start = new Date();
    const end = new Date(start.getFullYear(), start.getMonth() + months - 1, 1);
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[start.getMonth()]}/${start.getFullYear()} até ${monthNames[end.getMonth()]}/${end.getFullYear()}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.familyId) return;

    setErrorMsg('');
    setLoading(true);

    try {
      const cleanItems: BudgetAllocationItem[] = items.map((i) => {
        const itemObj: BudgetAllocationItem = {
          id: i.id || '',
          categoryName: i.categoryName || '',
          percentage: Number(i.percentage) || 0,
          amountCents: Number(i.amountCents) || 0,
          dueDay: Number(i.dueDay) || 10,
          accountId: i.accountId || 'wallet',
        };
        if (i.color) itemObj.color = i.color;
        if (i.notes) itemObj.notes = i.notes;
        return itemObj;
      });

      // 1. Salva a configuração de orçamento no documento da família
      await saveBudgetConfig(user.familyId, effectiveTotalIncomeCents, cleanItems);

      // 2. Se a opção de provisionar estiver marcada, gera os lançamentos previstos no Firestore
      if (provisionExpenses) {
        const monthsCount = getMonthsCount();
        await generateProvisionedBudgetExpenses(
          user.familyId,
          cleanItems,
          transactions,
          monthsCount
        );
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Erro ao salvar separação de orçamento:', err);
      setErrorMsg(err?.message || 'Erro ao salvar orçamento familiar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-deep/65 backdrop-blur-md animate-in fade-in duration-200">
      <div className="card w-full max-w-3xl bg-white border-white/95 shadow-[0_40px_80px_-20px_rgba(10,31,68,.35)] p-5 sm:p-7 rounded-[32px] relative max-h-[92vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between pb-4 border-b border-navy/10">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold/25 text-gold-deep border border-gold/40 shadow-sm">
              <PieChart className="h-6 w-6" />
            </span>
            <div>
              <span className="pill bg-gold/20 text-gold-deep text-[10px] font-extrabold uppercase tracking-wide">
                📊 Planejamento Mensal
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-navy leading-tight mt-0.5">
                Alocação de gastos
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                Distribua a receita da sua família por categoria em <b>porcentagem (%)</b> ou <b>valor (R$)</b> mês a mês.
              </p>
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

        {/* Mensagens de Feedback */}
        {errorMsg && (
          <div className="my-3 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success ? (
          <div className="my-auto py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-ok/20 border border-ok/40 flex items-center justify-center text-ok animate-bounce">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black text-navy">Orçamento Familiar Salvo!</h3>
            <p className="text-xs sm:text-sm text-muted max-w-md">
              O planejamento orçamentário foi gravado com sucesso
              {provisionExpenses && ` e as despesas foram provisionadas para os próximos ${getMonthsCount()} meses`}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden pt-3">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar">
              {/* Bloco 1: Renda Familiar Base */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-gold/15 via-gold/5 to-transparent border border-gold/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gold/25 text-gold-deep flex items-center justify-center shrink-0">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-muted uppercase tracking-wider block">
                      Receita Base Mensal da Família
                    </span>
                    <div className="flex items-center gap-2">
                      <b className="text-lg sm:text-xl font-black text-navy">
                        {Money.formatCents(effectiveTotalIncomeCents)}
                      </b>
                      {calculatedIncomeCents > 0 && (
                        <span className="pill bg-ok/20 text-ok text-[10px] font-extrabold">
                          ✓ Rendas da Família
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {calculatedIncomeCents === 0 && (
                  <div className="w-full sm:w-auto">
                    <label className="block text-[10px] font-bold text-navy mb-0.5">
                      Definir Renda Base Mensal:
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={baseIncomeInput ?? ''}
                      onChange={(e) => setBaseIncomeInput(e.target.value)}
                      className="w-full sm:w-36 h-9 px-3 rounded-xl border border-navy/20 text-xs font-bold text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Bloco 2: Painel de Alocação e Barra de Progresso */}
              <div className="p-4 rounded-2xl bg-navy/[0.02] border border-navy/10 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-navy block">Alocação do Orçamento:</span>
                    <span className="text-[11px] text-muted">
                      Total Alocado: <b>{Money.formatCents(totalAllocatedCents)}</b> ({totalAllocatedPercent.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold block">
                      {remainingCents >= 0 ? (
                        <span className="text-ok">Livre para Investir / Caixinhas: {Money.formatCents(remainingCents)} ({remainingPercent.toFixed(1)}%)</span>
                      ) : (
                        <span className="text-danger flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Orçamento Excedido: {Money.formatCents(Math.abs(remainingCents))}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Barra Visual de Distribuição */}
                <div className="h-3 w-full rounded-full bg-navy/10 overflow-hidden flex shadow-inner">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      title={`${it.categoryName}: ${it.percentage.toFixed(1)}% (${Money.formatCents(it.amountCents)})`}
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.max(0, it.percentage)}%`,
                        backgroundColor: it.color || '#F5B82E',
                      }}
                    />
                  ))}
                  {remainingPercent > 0 && (
                    <div
                      title={`Livre / Caixinhas: ${remainingPercent.toFixed(1)}%`}
                      className="h-full bg-ok/30 border-l border-white/40"
                      style={{ width: `${Math.max(0, remainingPercent)}%` }}
                    />
                  )}
                </div>

                {/* Modelos / Presets Rápidos */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-muted mr-1 flex items-center gap-1">
                    <Sliders className="h-3 w-3" /> Modelos Rápidos:
                  </span>
                  <button
                    type="button"
                    onClick={() => applyPreset('50-30-20', effectiveTotalIncomeCents)}
                    className="btn-line text-[11px] h-7 px-2.5 rounded-lg border-gold/40 text-navy font-bold hover:bg-gold/15"
                  >
                    🎯 Regra 50-30-20
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('60-20-20', effectiveTotalIncomeCents)}
                    className="btn-line text-[11px] h-7 px-2.5 rounded-lg border-gold/40 text-navy font-bold hover:bg-gold/15"
                  >
                    🏠 Regra 60-20-20
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('essential', effectiveTotalIncomeCents)}
                    className="btn-line text-[11px] h-7 px-2.5 rounded-lg border-navy/20 text-muted font-semibold hover:text-navy"
                  >
                    ⚖️ Essencial Equilibrado
                  </button>
                </div>
              </div>

              {/* Bloco 3: Lista de Despesas e Alocações */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-navy uppercase tracking-wider">
                    Categorias de Despesa & Limites
                  </label>
                  <span className="text-[11px] text-muted">
                    Preencha por <b>%</b> ou por <b>R$</b>
                  </span>
                </div>

                {items.map((item) => {
                  const IconComp = getCategoryIconComponent(item.categoryName);

                  return (
                    <div
                      key={item.id}
                      className="p-3 sm:p-3.5 rounded-2xl border border-navy/10 bg-white hover:border-gold/50 transition-all flex flex-col gap-2 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
                        {/* Categoria */}
                        <div className="flex items-center gap-2.5 min-w-[190px] flex-1 w-full sm:w-auto">
                          <span
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                            style={{ backgroundColor: item.color || '#F5B82E' }}
                          >
                            <IconComp className="h-4 w-4" />
                          </span>
                          <select
                            value={item.categoryName || ''}
                            onChange={(e) => handleCategoryChange(item.id, e.target.value)}
                            className="w-full h-9 px-2.5 rounded-xl border border-navy/15 text-xs sm:text-sm font-bold text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                          >
                            {expenseCategories.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Inputs Duplos: Porcentagem e Valor em R$ */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                          {/* Porcentagem */}
                          <div className="relative w-24">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.percentageStr ?? ''}
                              onChange={(e) => handlePercentageChange(item.id, e.target.value)}
                              onBlur={() => handlePercentageBlur(item.id)}
                              placeholder="0"
                              className="w-full h-9 pl-2.5 pr-6 rounded-xl border border-navy/15 text-xs sm:text-sm font-extrabold text-navy text-right focus:ring-2 focus:ring-gold focus:outline-none"
                            />
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                              %
                            </span>
                          </div>

                          {/* Valor em R$ */}
                          <div className="relative w-32">
                            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                              R$
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="0,00"
                              value={item.amountStr ?? ''}
                              onChange={(e) => handleAmountChange(item.id, e.target.value)}
                              onBlur={() => handleAmountBlur(item.id)}
                              className="w-full h-9 pl-7 pr-2.5 rounded-xl border border-navy/15 text-xs sm:text-sm font-extrabold text-navy text-right focus:ring-2 focus:ring-gold focus:outline-none"
                            />
                          </div>

                          {/* Dia do Vencimento */}
                          <div className="relative w-20" title="Dia do Vencimento Mensal">
                            <select
                              value={item.dueDay || 10}
                              onChange={(e) => handleDueDayChange(item.id, e.target.value)}
                              className="w-full h-9 px-2 rounded-xl border border-navy/15 text-xs font-bold text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                            >
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                <option key={d} value={d}>
                                  Dia {d}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Botão Remover */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="h-9 w-9 rounded-xl flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition shrink-0"
                            title="Remover despesa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Linha 2: Dropdown de Conta de Saída e Campo de Observação */}
                      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-0.5">
                        {/* Dropdown de Conta Bancária de Saída */}
                        <div className="w-full sm:w-56 shrink-0 relative" title="Escolha de qual conta a despesa vai sair">
                          <select
                            value={item.accountId || 'wallet'}
                            onChange={(e) => handleAccountChange(item.id, e.target.value)}
                            className="w-full h-8 px-2.5 rounded-lg border border-navy/15 bg-white text-xs font-semibold text-navy focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none truncate"
                          >
                            <option value="wallet">💵 Dinheiro Livre / Carteira</option>
                            {accounts.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                💳 {acc.name} ({Money.formatCents(acc.balanceCents)})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Campo de Observação Opcional */}
                        <div className="flex-1 w-full">
                          <input
                            type="text"
                            value={item.notes ?? ''}
                            onChange={(e) => handleNotesChange(item.id, e.target.value)}
                            placeholder="Observação (opcional, ex: Vivo Fibra, Carro, Seguro...)"
                            className="w-full h-8 px-3 rounded-lg border border-navy/10 bg-navy/[0.02] text-xs font-medium text-navy placeholder:text-muted/60 focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Botão Adicionar Item */}
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="btn-line text-xs h-9 px-3.5 gap-1.5 border-dashed border-navy/25 hover:border-gold hover:text-gold-deep w-full sm:w-auto"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Adicionar Categoria de Despesa</span>
                </button>
              </div>

              {/* Bloco 4: Provisionamento por Período */}
              <div className={`p-4 rounded-2xl border transition-all space-y-3 mt-3 ${
                provisionExpenses
                  ? 'bg-gold/10 border-gold/40 shadow-sm'
                  : 'bg-navy/[0.02] border-navy/10'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                      provisionExpenses ? 'bg-gold/30 text-gold-deep' : 'bg-navy/10 text-muted'
                    }`}>
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <label htmlFor="budget-provision-checkbox" className="block text-xs sm:text-sm font-extrabold text-navy cursor-pointer">
                        Provisionar despesas do orçamento por um período
                      </label>
                      <p className="text-[11px] text-muted">
                        Lança as contas e despesas previstas automaticamente para cada mês da série.
                      </p>
                    </div>
                  </div>
                  <input
                    id="budget-provision-checkbox"
                    type="checkbox"
                    checked={provisionExpenses}
                    onChange={(e) => setProvisionExpenses(e.target.checked)}
                    className="h-5 w-5 rounded-lg accent-gold cursor-pointer shrink-0"
                  />
                </div>

                {provisionExpenses && (
                  <div className="pt-3 border-t border-gold/25 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="block text-xs font-bold text-navy">
                      Escolha o período de provisionamento:
                    </label>

                    {/* Seletores de Período */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {[
                        { key: '3m', label: '3 meses', count: 3 },
                        { key: '6m', label: '6 meses', count: 6 },
                        { key: '1y', label: '1 ano', count: 12 },
                        { key: '2y', label: '2 anos', count: 24 },
                        { key: '3y', label: '3 anos', count: 36 },
                        { key: 'custom', label: 'Personalizado', count: customMonths },
                      ].map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setProvisionPeriod(p.key as any)}
                          className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center text-center ${
                            provisionPeriod === p.key
                              ? 'bg-gold text-navy-deep border-gold-deep ring-2 ring-gold/40 shadow-sm'
                              : 'bg-white border-navy/15 text-navy hover:border-gold/50'
                          }`}
                        >
                          <span>{p.label}</span>
                          {p.key !== 'custom' && (
                            <span className="text-[10px] opacity-75">{p.count} parcelas</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Campo de meses personalizado */}
                    {provisionPeriod === 'custom' && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-gold/30">
                        <label className="text-xs font-bold text-navy whitespace-nowrap">
                          Quantidade de meses:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={customMonths ?? 12}
                          onChange={(e) => setCustomMonths(Math.max(1, Math.min(60, parseInt(e.target.value, 10) || 1)))}
                          className="w-24 h-9 px-3 rounded-lg border border-navy/20 text-xs font-extrabold text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                        />
                        <span className="text-xs text-muted">meses (1 a 60 parcelas)</span>
                      </div>
                    )}

                    {/* Badge informativo com preview */}
                    <div className="p-2.5 rounded-xl bg-white/90 border border-gold/30 flex items-center gap-2 text-[11px] text-navy font-semibold">
                      <Sparkles className="h-4 w-4 text-gold-deep shrink-0" />
                      <span>
                        Serão geradas <b>{getMonthsCount()} parcelas mensais</b> de despesas previstas para cada categoria ({getPeriodRangeLabel(getMonthsCount())}).
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé de Ações */}
            <div className="pt-4 border-t border-navy/10 flex flex-col sm:flex-row items-center justify-between gap-3 mt-auto">
              <span className="text-[11px] text-muted text-center sm:text-left">
                💡 O orçamento familiar organiza suas metas e ajuda na previsão financeira.
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-line text-xs h-10 px-4 flex-1 sm:flex-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold text-xs h-10 px-6 font-bold flex-1 sm:flex-none shadow-md"
                >
                  {loading ? 'Salvando...' : 'Salvar & Provisionar Orçamento'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
