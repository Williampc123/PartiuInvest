import { doc, collection, writeBatch } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/firebase';
import { FamilyMember, FinancialTransaction } from '@/core/types';
import { calculateMemberPayday } from '@/core/dateUtils';

/**
 * Provisiona as receitas previstas de salário para os membros da família ao longo de um período de meses
 * gerando parcelas automáticas numeradas (ex: 1/12 até 12/12).
 */
export async function generateProvisionedSalaries(
  familyId: string,
  members: FamilyMember[],
  existingTransactions: FinancialTransaction[],
  monthsCount: number = 1,
  startDate: Date = new Date()
): Promise<number> {
  if (!familyId || !members || members.length === 0 || monthsCount <= 0) {
    return 0;
  }

  const startYear = startDate.getFullYear();
  const startMonthIndex = startDate.getMonth();
  let totalGenerated = 0;

  const batch = writeBatch(db);
  let batchCount = 0;

  for (const member of members) {
    // Só gera se o membro tiver renda mensal cadastrada maior que zero
    if (!member.monthlyIncomeCents || member.monthlyIncomeCents <= 0) {
      continue;
    }

    for (let k = 0; k < monthsCount; k++) {
      const targetDate = new Date(startYear, startMonthIndex + k, 1);
      const year = targetDate.getFullYear();
      const monthIndex = targetDate.getMonth();
      const yearMonth = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

      // Verifica se já existe transação de salário para este membro neste mês
      const alreadyExists = existingTransactions.some((t) => {
        const isMember = t.memberId === member.id;
        const isSalaryCat = t.category === 'Salário' || t.description.toLowerCase().includes('salário');
        const isSameMonth = t.date && t.date.startsWith(yearMonth);
        return isMember && isSalaryCat && isSameMonth;
      });

      if (alreadyExists) {
        continue;
      }

      // Calcula a data exata da previsão do salário para o mês alvo
      const forecastDate = calculateMemberPayday(
        member.paydayType || 'fifth_business_day',
        member.payday || 5,
        year,
        monthIndex
      );

      const transactionId = `sal_${member.id}_${yearMonth.replace('-', '')}`;
      const transRef = doc(collection(db, `families/${familyId}/transactions`), transactionId);

      const installmentSuffix = monthsCount > 1 ? ` (${k + 1}/${monthsCount})` : '';
      const description = `Salário Previsto - ${member.displayName || member.name}${installmentSuffix}`;

      const newTransaction: FinancialTransaction = {
        id: transactionId,
        accountId: 'wallet',
        memberId: member.id,
        visibility: 'family',
        description,
        amountCents: Math.abs(member.monthlyIncomeCents),
        category: 'Salário',
        date: forecastDate,
        type: 'income',
        isRecurring: true,
        recurrenceFrequency: 'mensal',
        isPaid: false,
        source: 'manual',
        createdAt: new Date().toISOString(),
      };

      if (monthsCount > 1) {
        newTransaction.installmentNumber = k + 1;
        newTransaction.totalInstallments = monthsCount;
      }

      batch.set(transRef, newTransaction, { merge: true });
      batchCount++;
      totalGenerated++;
    }
  }

  if (batchCount > 0) {
    try {
      await batch.commit();
    } catch (err) {
      console.error('Erro ao salvar lote de previsões salariais:', err);
    }
  }

  return totalGenerated;
}

/**
 * Verifica e gera automaticamente as receitas previstas de salário para o mês vigente
 */
export async function checkAndGenerateMonthlySalaries(
  familyId: string,
  members: FamilyMember[],
  existingTransactions: FinancialTransaction[],
  targetDate: Date = new Date()
): Promise<number> {
  return generateProvisionedSalaries(familyId, members, existingTransactions, 1, targetDate);
}

