import { doc, collection, setDoc } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/firebase';
import { FamilyMember, FinancialTransaction } from '@/core/types';
import { calculateMemberPayday } from '@/core/dateUtils';

/**
 * Verifica e gera automaticamente as receitas previstas de salário para os membros da família
 * assim que o mês virar ou durante o primeiro acesso.
 */
export async function checkAndGenerateMonthlySalaries(
  familyId: string,
  members: FamilyMember[],
  existingTransactions: FinancialTransaction[],
  targetDate: Date = new Date()
): Promise<number> {
  if (!familyId || !members || members.length === 0) {
    return 0;
  }

  const year = targetDate.getFullYear();
  const monthIndex = targetDate.getMonth();
  const yearMonth = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  let generatedCount = 0;

  for (const member of members) {
    // Só lança se o membro tiver renda mensal configurada maior que 0
    if (!member.monthlyIncomeCents || member.monthlyIncomeCents <= 0) {
      continue;
    }

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

    // Calcula a data exata da previsão do salário
    const forecastDate = calculateMemberPayday(
      member.paydayType || 'fifth_business_day',
      member.payday || 5,
      year,
      monthIndex
    );

    const transactionId = `sal_${member.id}_${yearMonth.replace('-', '')}`;
    const transRef = doc(collection(db, `families/${familyId}/transactions`), transactionId);

    const newTransaction: FinancialTransaction = {
      id: transactionId,
      accountId: 'wallet',
      memberId: member.id,
      visibility: 'family',
      description: `Salário Previsto - ${member.displayName || member.name}`,
      amountCents: Math.abs(member.monthlyIncomeCents),
      category: 'Salário',
      date: forecastDate,
      type: 'income',
      isRecurring: true,
      recurrenceFrequency: 'mensal',
      source: 'manual',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(transRef, newTransaction, { merge: true });
      generatedCount++;
    } catch (err) {
      console.warn(`Aviso ao gerar previsão de salário para [${member.displayName}]:`, err);
    }
  }

  return generatedCount;
}
