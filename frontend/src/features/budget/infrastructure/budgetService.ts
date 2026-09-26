import { doc, collection, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/firebase';
import { FinancialTransaction } from '@/core/types';

export interface BudgetAllocationItem {
  id: string;
  categoryName: string;
  percentage: number;
  amountCents: number;
  dueDay: number;
  color?: string;
  notes?: string;
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
    if (i.color) itemObj.color = i.color;
    if (i.notes?.trim()) itemObj.notes = i.notes.trim();
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
export async function generateProvisionedBudgetExpenses(
  familyId: string,
  items: BudgetAllocationItem[],
  existingTransactions: FinancialTransaction[],
  monthsCount: number = 1,
  startDate: Date = new Date()
): Promise<number> {
  if (!familyId || monthsCount <= 0) {
    return 0;
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
          desc.includes('orçamento:') ||
          desc.startsWith(item.categoryName.toLowerCase());
        const isSameMonth = t.date && t.date.startsWith(yearMonth);
        return isCat && isBudget && isSameMonth;
      });

      const targetAmountCents = -Math.abs(item.amountCents);
      const installmentSuffix = monthsCount > 1 ? ` (${k + 1}/${monthsCount})` : '';
      // Descrição limpa com apenas o nome da categoria e as parcelas
      const description = `${item.categoryName}${installmentSuffix}`;

      if (existing) {
        // Se a parcela já foi paga, preserva o histórico sem alterar
        if (existing.isPaid) {
          continue;
        }

        // Se a parcela ainda está em aberto, atualiza para refletir a nova separação
        const existingRef = doc(db, `families/${familyId}/transactions`, existing.id);
        const updatePayload: Record<string, any> = {
          amountCents: targetAmountCents,
          date: dateStr,
          category: item.categoryName,
          description,
          updatedAt: new Date().toISOString(),
        };

        if (item.notes?.trim()) {
          updatePayload.notes = item.notes.trim();
        }

        if (monthsCount > 1) {
          updatePayload.installmentNumber = k + 1;
          updatePayload.totalInstallments = monthsCount;
        }

        currentBatch.set(existingRef, sanitizeForFirestore(updatePayload), { merge: true });
        batchCount++;
        totalProcessed++;
      } else {
        // Não existe ainda: cria nova despesa orçada
        const newTransaction: Record<string, any> = {
          id: transactionId,
          accountId: 'wallet',
          memberId: 'family',
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

        if (monthsCount > 1) {
          newTransaction.installmentNumber = k + 1;
          newTransaction.totalInstallments = monthsCount;
        }

        currentBatch.set(transRef, sanitizeForFirestore(newTransaction), { merge: true });
        batchCount++;
        totalProcessed++;
      }

      await commitBatchIfNeeded();
    }
  }

  if (batchCount > 0) {
    try {
      await currentBatch.commit();
    } catch (err) {
      console.error('Erro ao processar lote de despesas orçadas:', err);
    }
  }

  return totalProcessed;
}
