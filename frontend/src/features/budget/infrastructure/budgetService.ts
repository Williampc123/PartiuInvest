import { doc, collection, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/firebase';
import { FinancialTransaction } from '@/core/types';

export interface BudgetAllocationItem {
  id: string;
  categoryName: string;
  percentage: number;
  amountCents: number;
  dueDay: number;
  accountId?: string;
  color?: string;
  notes?: string;
  skippedMonths?: string[];
}

export interface FamilyBudgetConfig {
  totalIncomeCents: number;
  items: BudgetAllocationItem[];
  updatedAt: string;
}

/**
 * Utilitário de sanitização profunda para garantir compatibilidade 100% com o Firestore
 * (remove qualquer propriedade cujo valor seja undefined)
 */
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const clean: any = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      clean[key] = sanitizeForFirestore(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Salva a configuração de separação de orçamento da família no Firestore
 */
export async function saveBudgetConfig(
  familyId: string,
  totalIncomeCents: number,
  items: BudgetAllocationItem[]
): Promise<void> {
  if (!familyId) return;

  const familyRef = doc(db, 'families', familyId);
  const cleanItems = (items || []).map((i) => {
    const itemObj: BudgetAllocationItem = {
      id: i.id || '',
      categoryName: i.categoryName || '',
      percentage: Number(i.percentage) || 0,
      amountCents: Number(i.amountCents) || 0,
      dueDay: Number(i.dueDay) || 10,
    };
    if (i.accountId) itemObj.accountId = i.accountId;
    if (i.color) itemObj.color = i.color;
    if (i.notes?.trim()) itemObj.notes = i.notes.trim();
    if (Array.isArray(i.skippedMonths) && i.skippedMonths.length > 0) {
      itemObj.skippedMonths = i.skippedMonths;
    }
    return sanitizeForFirestore(itemObj);
  });

  const budgetConfig: FamilyBudgetConfig = {
    totalIncomeCents: Number(totalIncomeCents) || 0,
    items: cleanItems,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(familyRef, { budgetConfig: sanitizeForFirestore(budgetConfig) }, { merge: true });
}

/**
 * Provisiona e sincroniza as despesas do orçamento ao longo do período selecionado.
 * - Formata a descrição diretamente com o nome da categoria (ex: "Internet (1/36)")
 * - Atualiza automaticamente parcelas em aberto (isPaid: false) com os novos valores/regras.
 * - Preserva o histórico de parcelas já quitadas (isPaid: true).
 * - Remove parcelas em aberto de categorias que foram excluídas do orçamento.
 * - Cria novas parcelas para meses futuros no período.
 */
export interface ProvisionResult {
  totalProcessed: number;
  updatedTransactions: FinancialTransaction[];
}

/**
 * Provisiona e sincroniza as despesas do orçamento ao longo do período selecionado.
 * - Formata a descrição diretamente com o nome da categoria
 * - Atualiza automaticamente parcelas em aberto (isPaid: false) com os novos valores/regras.
 * - Preserva o histórico de parcelas já quitadas (isPaid: true).
 * - Remove parcelas em aberto de categorias que foram excluídas do orçamento.
 * - Cria novas parcelas para meses futuros no período (padrão: 12 meses).
 */
export async function generateProvisionedBudgetExpenses(
  familyId: string,
  items: BudgetAllocationItem[],
  existingTransactions: FinancialTransaction[],
  monthsCount: number = 12,
  startDate: Date = new Date(),
  creatorMemberId?: string
): Promise<ProvisionResult> {
  if (!familyId || monthsCount <= 0) {
    return { totalProcessed: 0, updatedTransactions: existingTransactions || [] };
  }

  const startYear = startDate.getFullYear();
  const startMonthIndex = startDate.getMonth();
  const currentMonthStr = `${startYear}-${String(startMonthIndex + 1).padStart(2, '0')}`;

  // Conjunto de categorias ativas no novo orçamento (em minúsculo para busca segura)
  const activeCategoriesSet = new Set(
    (items || []).map((it) => it.categoryName.trim().toLowerCase())
  );

  let currentBatch = writeBatch(db);
  let batchCount = 0;
  let totalProcessed = 0;

  const commitBatchIfNeeded = async () => {
    if (batchCount >= 450) {
      await currentBatch.commit();
      currentBatch = writeBatch(db);
      batchCount = 0;
    }
  };

  // Cópia mutável para atualização imediata em memória
  const deletedIds = new Set<string>();
  const upsertedTransactionsMap = new Map<string, FinancialTransaction>();

  // 1. Remover parcelas em aberto de categorias que foram removidas do orçamento
  for (const t of existingTransactions) {
    const isBudgetTransaction =
      t.id.startsWith('bud_') ||
      t.description?.toLowerCase().startsWith('orçamento:') ||
      t.description?.toLowerCase().includes('orçamento:');

    // Se é uma despesa orçada a partir deste mês, não está paga e sua categoria não faz mais parte do orçamento
    if (
      isBudgetTransaction &&
      !t.isPaid &&
      t.date &&
      t.date >= `${currentMonthStr}-01`
    ) {
      const catKey = (t.category || '').trim().toLowerCase();
      if (!activeCategoriesSet.has(catKey)) {
        const transRef = doc(db, `families/${familyId}/transactions`, t.id);
        currentBatch.delete(transRef);
        batchCount++;
        deletedIds.add(t.id);
        await commitBatchIfNeeded();
      }
    }
  }

  // 2. Criar ou Atualizar parcelas para cada categoria ativa no novo orçamento
  for (const item of items) {
    if (!item.amountCents || item.amountCents <= 0 || !item.categoryName.trim()) {
      continue;
    }

    const cleanCatId = item.categoryName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15);

    for (let k = 0; k < monthsCount; k++) {
      const targetDate = new Date(startYear, startMonthIndex + k, 1);
      const year = targetDate.getFullYear();
      const monthIndex = targetDate.getMonth();
      const yearMonth = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

      // Calcula o dia de vencimento seguro para o mês alvo
      const maxDaysInTargetMonth = new Date(year, monthIndex + 1, 0).getDate();
      const day = Math.min(Math.max(1, item.dueDay || 10), maxDaysInTargetMonth);
      const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`;

      const transactionId = `bud_${cleanCatId}_${yearMonth.replace('-', '')}`;
      const transRef = doc(collection(db, `families/${familyId}/transactions`), transactionId);

      // Localiza se já existe um lançamento para esta categoria neste mês
      const existing = existingTransactions.find((t) => {
        if (t.id === transactionId) return true;
        const isCat = t.category?.toLowerCase() === item.categoryName.toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const isBudget =
          t.id.startsWith('bud_') ||
          desc.startsWith('orçamento:') ||
          desc.includes('orçamento:');
        const isSameMonth = t.date && t.date.startsWith(yearMonth);
        return isCat && isBudget && isSameMonth;
      });

      const targetAmountCents = -Math.abs(item.amountCents);
      const description = item.categoryName;

      // Se este mês foi suspenso/pulado para esta categoria do orçamento
      if (item.skippedMonths && item.skippedMonths.includes(yearMonth)) {
        if (existing && !existing.isPaid) {
          const existingRef = doc(db, `families/${familyId}/transactions`, existing.id);
          currentBatch.delete(existingRef);
          batchCount++;
          deletedIds.add(existing.id);
          await commitBatchIfNeeded();
        }
        continue;
      }

      if (existing) {
        // Se a parcela já foi paga, preserva o histórico sem alterar
        if (existing.isPaid) {
          upsertedTransactionsMap.set(existing.id, existing);
          continue;
        }

        const isAmountSame = existing.amountCents === targetAmountCents;
        const isDateSame = existing.date === dateStr;
        const isAccountSame = !item.accountId || existing.accountId === item.accountId;
        const isDescSame = existing.description === description;
        const isNotesSame = (item.notes?.trim() || '') === (existing.notes?.trim() || '');

        if (isAmountSame && isDateSame && isAccountSame && isDescSame && isNotesSame) {
          upsertedTransactionsMap.set(existing.id, existing);
          continue;
        }

        // Se a parcela ainda está em aberto e mudou, atualiza para refletir a nova separação
        const existingRef = doc(db, `families/${familyId}/transactions`, existing.id);
        const updatePayload: Record<string, any> = {
          amountCents: targetAmountCents,
          date: dateStr,
          category: item.categoryName,
          description,
          accountId: item.accountId || existing.accountId || 'wallet',
          updatedAt: new Date().toISOString(),
        };

        if (item.notes?.trim()) {
          updatePayload.notes = item.notes.trim();
        }

        currentBatch.set(existingRef, sanitizeForFirestore(updatePayload), { merge: true });
        batchCount++;
        totalProcessed++;

        upsertedTransactionsMap.set(existing.id, {
          ...existing,
          ...updatePayload,
        } as FinancialTransaction);
      } else {
        // Não existe ainda: cria nova despesa orçada
        const newTransaction: FinancialTransaction = {
          id: transactionId,
          accountId: item.accountId || 'wallet',
          memberId: creatorMemberId || 'family',
          visibility: 'family',
          description,
          amountCents: targetAmountCents,
          category: item.categoryName,
          date: dateStr,
          type: 'bill',
          isRecurring: true,
          recurrenceFrequency: 'mensal',
          isPaid: false,
          source: 'manual',
          createdAt: new Date().toISOString(),
        };

        if (item.notes?.trim()) {
          newTransaction.notes = item.notes.trim();
        }

        currentBatch.set(transRef, sanitizeForFirestore(newTransaction), { merge: true });
        batchCount++;
        totalProcessed++;

        upsertedTransactionsMap.set(transactionId, newTransaction);
      }

      await commitBatchIfNeeded();
    }
  }

  if (batchCount > 0) {
    try {
      await currentBatch.commit();
    } catch (err) {
      console.error('Erro ao processar lote de despesas orçadas no Firestore:', err);
      throw err;
    }
  }

  // Monta lista atualizada em memória combinando o estado anterior com exclusões e upserts
  const updatedTransactions = existingTransactions
    .filter((t) => !deletedIds.has(t.id))
    .map((t) => (upsertedTransactionsMap.has(t.id) ? upsertedTransactionsMap.get(t.id)! : t));

  // Adiciona transações novas que não existiam em existingTransactions
  for (const [id, trans] of upsertedTransactionsMap.entries()) {
    if (!updatedTransactions.some((t) => t.id === id)) {
      updatedTransactions.push(trans);
    }
  }

  return { totalProcessed, updatedTransactions };
}

/**
 * Garante que as despesas do orçamento estejam sempre provisionadas para os próximos 12 meses
 */
export async function checkAndGenerateMonthlyBudgetExpenses(
  familyId: string,
  items: BudgetAllocationItem[],
  existingTransactions: FinancialTransaction[],
  targetDate: Date = new Date(),
  creatorMemberId?: string
): Promise<ProvisionResult> {
  return generateProvisionedBudgetExpenses(familyId, items, existingTransactions, 12, targetDate, creatorMemberId);
}

/**
 * Suspende a previsão de uma categoria de orçamento em um mês específico (ex: '2026-12').
 * Atualiza o budgetConfig da família no Firestore e retorna a configuração atualizada.
 */
export async function skipBudgetCategoryMonth(
  familyId: string,
  categoryName: string,
  yearMonth: string,
  currentConfig: FamilyBudgetConfig | null
): Promise<FamilyBudgetConfig | null> {
  if (!familyId || !categoryName || !yearMonth || !currentConfig) return currentConfig;

  const catTarget = categoryName.trim().toLowerCase();
  let changed = false;

  const newItems: BudgetAllocationItem[] = (currentConfig.items || []).map((it) => {
    if (it.categoryName.trim().toLowerCase() === catTarget) {
      const currentSkipped = Array.isArray(it.skippedMonths) ? it.skippedMonths : [];
      if (!currentSkipped.includes(yearMonth)) {
        changed = true;
        return {
          ...it,
          skippedMonths: [...currentSkipped, yearMonth],
        };
      }
    }
    return it;
  });

  if (!changed) return currentConfig;

  const updatedConfig: FamilyBudgetConfig = {
    ...currentConfig,
    items: newItems,
    updatedAt: new Date().toISOString(),
  };

  await saveBudgetConfig(familyId, updatedConfig.totalIncomeCents, updatedConfig.items);
  return updatedConfig;
}

/**
 * Reativa a previsão de uma categoria de orçamento que havia sido suspensa em um mês específico.
 */
export async function unskipBudgetCategoryMonth(
  familyId: string,
  categoryName: string,
  yearMonth: string,
  currentConfig: FamilyBudgetConfig | null
): Promise<FamilyBudgetConfig | null> {
  if (!familyId || !categoryName || !yearMonth || !currentConfig) return currentConfig;

  const catTarget = categoryName.trim().toLowerCase();
  let changed = false;

  const newItems: BudgetAllocationItem[] = (currentConfig.items || []).map((it) => {
    if (it.categoryName.trim().toLowerCase() === catTarget) {
      const currentSkipped = Array.isArray(it.skippedMonths) ? it.skippedMonths : [];
      if (currentSkipped.includes(yearMonth)) {
        changed = true;
        return {
          ...it,
          skippedMonths: currentSkipped.filter((m) => m !== yearMonth),
        };
      }
    }
    return it;
  });

  if (!changed) return currentConfig;

  const updatedConfig: FamilyBudgetConfig = {
    ...currentConfig,
    items: newItems,
    updatedAt: new Date().toISOString(),
  };

  await saveBudgetConfig(familyId, updatedConfig.totalIncomeCents, updatedConfig.items);
  return updatedConfig;
}

