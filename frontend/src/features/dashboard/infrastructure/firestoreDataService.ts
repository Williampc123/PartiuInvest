import {
  collection,
  doc,
  onSnapshot,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/firebase';
import { FamilyMember, BoxGoal, BankAccount, FinancialTransaction } from '@/core/types';

export interface FamilyDataState {
  familyName: string;
  initialSetupDone?: boolean;
  members: FamilyMember[];
  boxes: BoxGoal[];
  accounts: BankAccount[];
  transactions: FinancialTransaction[];
}

/**
 * Inicializa a estrutura de caixinhas e contas para uma nova família no Firestore
 */
export async function seedInitialFamilyDataIfEmpty(familyId: string, headMemberId: string) {
  try {
    const boxesRef = collection(db, `families/${familyId}/boxes`);
    const boxesSnap = await getDocs(boxesRef);

    if (boxesSnap.empty) {
      const nowIso = new Date().toISOString();
      const batch = writeBatch(db);

      // Caixinhas padrão com saldo 0
      const box1Ref = doc(boxesRef);
      batch.set(box1Ref, {
        id: box1Ref.id,
        ownerMemberId: headMemberId,
        visibility: 'family',
        name: 'Reserva de emergência',
        category: 'emergency',
        targetAmountCents: 1800000,
        currentBalanceCents: 0,
        color: '#F5B82E',
        icon: 'shield',
        createdAt: nowIso,
      });

      const box2Ref = doc(boxesRef);
      batch.set(box2Ref, {
        id: box2Ref.id,
        ownerMemberId: headMemberId,
        visibility: 'family',
        name: 'Investimentos',
        category: 'investment',
        targetAmountCents: 5000000,
        currentBalanceCents: 0,
        color: '#0A1F44',
        icon: 'chart',
        createdAt: nowIso,
      });

      const box3Ref = doc(boxesRef);
      batch.set(box3Ref, {
        id: box3Ref.id,
        ownerMemberId: headMemberId,
        visibility: 'family',
        name: 'Viagem dos sonhos',
        category: 'dream',
        targetAmountCents: 800000,
        currentBalanceCents: 0,
        color: '#3F6FD8',
        icon: 'plane',
        createdAt: nowIso,
      });

      await batch.commit();
      console.log(`✅ Estrutura de caixinhas criada no Firestore para [${familyId}]!`);
    }
  } catch (err) {
    console.warn('Aviso ao inicializar caixinhas no Firestore:', err);
  }
}

/**
 * Adiciona uma conta bancária ao Firestore
 */
export async function addBankAccountToFirestore(
  familyId: string,
  accountData: Omit<BankAccount, 'id'>
): Promise<BankAccount> {
  const accountsRef = collection(db, `families/${familyId}/accounts`);
  const newDocRef = doc(accountsRef);
  const account: BankAccount = {
    ...accountData,
    id: newDocRef.id,
    lastSyncedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };

  await setDoc(newDocRef, account);
  return account;
}

/**
 * Exclui uma conta bancária do Firestore
 */
export async function deleteBankAccountFromFirestore(familyId: string, accountId: string): Promise<void> {
  const accountDocRef = doc(db, `families/${familyId}/accounts`, accountId);
  await deleteDoc(accountDocRef);
}

/**
 * Atualiza ou sincroniza o saldo/status de uma conta bancária
 */
export async function updateBankAccountInFirestore(
  familyId: string,
  accountId: string,
  updates: Partial<BankAccount>
): Promise<void> {
  const accountDocRef = doc(db, `families/${familyId}/accounts`, accountId);
  await updateDoc(accountDocRef, {
    ...updates,
    lastSyncedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  });
}

/**
 * Adiciona uma nova caixinha/meta ao Firestore
 */
export async function addBoxToFirestore(
  familyId: string,
  boxData: Omit<BoxGoal, 'id'>,
  initialDeposit?: { accountId?: string; memberId?: string }
): Promise<BoxGoal> {
  const boxesRef = collection(db, `families/${familyId}/boxes`);
  const newDocRef = doc(boxesRef);
  const box: BoxGoal = {
    ...boxData,
    id: newDocRef.id,
  };

  const batch = writeBatch(db);
  batch.set(newDocRef, {
    ...box,
    createdAt: new Date().toISOString(),
  });

  // Se houver saldo inicial vindo de uma conta bancária, debitar da conta e registrar transação
  if (boxData.currentBalanceCents > 0 && initialDeposit?.accountId && initialDeposit.accountId !== 'wallet') {
    const accDocRef = doc(db, `families/${familyId}/accounts`, initialDeposit.accountId);
    // Registrar transação de aporte
    const transRef = doc(collection(db, `families/${familyId}/transactions`));
    batch.set(transRef, {
      id: transRef.id,
      accountId: initialDeposit.accountId,
      memberId: initialDeposit.memberId || boxData.ownerMemberId,
      visibility: boxData.visibility,
      description: `Aporte Inicial Caixinha: ${boxData.name}`,
      amountCents: -Math.abs(boxData.currentBalanceCents),
      category: 'Investimentos / Caixinhas',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      source: 'manual',
      createdAt: new Date().toISOString(),
    });
  }

  await batch.commit();

  // Atualizar saldo da conta bancária se necessário
  if (boxData.currentBalanceCents > 0 && initialDeposit?.accountId && initialDeposit.accountId !== 'wallet') {
    try {
      const accDocRef = doc(db, `families/${familyId}/accounts`, initialDeposit.accountId);
      const accSnap = await getDocs(collection(db, `families/${familyId}/accounts`));
      const targetAcc = accSnap.docs.find(d => d.id === initialDeposit.accountId);
      if (targetAcc) {
        const currentBal = targetAcc.data().balanceCents || 0;
        await updateDoc(accDocRef, {
          balanceCents: Math.max(0, currentBal - boxData.currentBalanceCents),
          lastSyncedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        });
      }
    } catch (e) {
      console.warn('Erro ao atualizar saldo da conta no aporte inicial:', e);
    }
  }

  return box;
}

/**
 * Atualiza uma caixinha no Firestore
 */
export async function updateBoxInFirestore(
  familyId: string,
  boxId: string,
  updates: Partial<BoxGoal>
): Promise<void> {
  const boxDocRef = doc(db, `families/${familyId}/boxes`, boxId);
  await updateDoc(boxDocRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Exclui uma caixinha do Firestore
 */
export async function deleteBoxFromFirestore(familyId: string, boxId: string): Promise<void> {
  const boxDocRef = doc(db, `families/${familyId}/boxes`, boxId);
  await deleteDoc(boxDocRef);
}

export interface AccountDepositSource {
  accountId: string;
  amountCents: number;
}

/**
 * Aporta / Guarda dinheiro na caixinha com opção de debitar de uma ou mais contas bancárias
 */
export async function depositToBoxInFirestore(
  familyId: string,
  boxId: string,
  currentBalanceCents: number,
  totalAmountCents: number,
  sources: string | AccountDepositSource[],
  memberId?: string,
  boxName?: string
): Promise<void> {
  const boxDocRef = doc(db, `families/${familyId}/boxes`, boxId);
  const newBalance = currentBalanceCents + totalAmountCents;

  const batch = writeBatch(db);
  batch.update(boxDocRef, {
    currentBalanceCents: newBalance,
    updatedAt: new Date().toISOString(),
  });

  // Normalizar fontes
  const sourceList: AccountDepositSource[] = typeof sources === 'string'
    ? [{ accountId: sources, amountCents: totalAmountCents }]
    : sources;

  const validSources = sourceList.filter(s => s.amountCents > 0 && s.accountId !== 'wallet');

  for (const src of validSources) {
    const transRef = doc(collection(db, `families/${familyId}/transactions`));
    batch.set(transRef, {
      id: transRef.id,
      accountId: src.accountId,
      memberId: memberId || 'user',
      visibility: 'family',
      description: `Aporte Caixinha: ${boxName || 'Meta Financeira'}`,
      amountCents: -Math.abs(src.amountCents),
      category: 'Investimentos / Caixinhas',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      source: 'manual',
      createdAt: new Date().toISOString(),
    });
  }

  await batch.commit();

  // Atualizar saldos das contas bancárias debitadas
  if (validSources.length > 0) {
    try {
      const accSnap = await getDocs(collection(db, `families/${familyId}/accounts`));
      for (const src of validSources) {
        const targetAcc = accSnap.docs.find(d => d.id === src.accountId);
        if (targetAcc) {
          const currentBal = targetAcc.data().balanceCents || 0;
          const accDocRef = doc(db, `families/${familyId}/accounts`, src.accountId);
          await updateDoc(accDocRef, {
            balanceCents: Math.max(0, currentBal - src.amountCents),
            lastSyncedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          });
        }
      }
    } catch (e) {
      console.warn('Erro ao atualizar saldos das contas após aporte multi-contas:', e);
    }
  }
}

/**
 * Resgata dinheiro da caixinha com opção de creditar em conta bancária
 */
export async function withdrawFromBoxInFirestore(
  familyId: string,
  boxId: string,
  currentBalanceCents: number,
  amountCents: number,
  toAccountId?: string,
  memberId?: string,
  boxName?: string
): Promise<void> {
  const boxDocRef = doc(db, `families/${familyId}/boxes`, boxId);
  const newBalance = Math.max(0, currentBalanceCents - amountCents);

  const batch = writeBatch(db);
  batch.update(boxDocRef, {
    currentBalanceCents: newBalance,
    updatedAt: new Date().toISOString(),
  });

  // Se o destino for conta bancária cadastrada, creditar na conta e registrar receita
  if (toAccountId && toAccountId !== 'wallet') {
    const transRef = doc(collection(db, `families/${familyId}/transactions`));
    batch.set(transRef, {
      id: transRef.id,
      accountId: toAccountId,
      memberId: memberId || 'user',
      visibility: 'family',
      description: `Resgate Caixinha: ${boxName || 'Meta Financeira'}`,
      amountCents: Math.abs(amountCents),
      category: 'Investimentos / Rendimentos',
      date: new Date().toISOString().split('T')[0],
      type: 'income',
      source: 'manual',
      createdAt: new Date().toISOString(),
    });
  }

  await batch.commit();

  if (toAccountId && toAccountId !== 'wallet') {
    try {
      const accDocRef = doc(db, `families/${familyId}/accounts`, toAccountId);
      const accSnap = await getDocs(collection(db, `families/${familyId}/accounts`));
      const targetAcc = accSnap.docs.find(d => d.id === toAccountId);
      if (targetAcc) {
        const currentBal = targetAcc.data().balanceCents || 0;
        await updateDoc(accDocRef, {
          balanceCents: currentBal + amountCents,
          lastSyncedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        });
      }
    } catch (e) {
      console.warn('Erro ao atualizar saldo da conta após resgate:', e);
    }
  }
}

/**
 * Exclui uma movimentação/transação do Firestore
 */
export async function deleteTransactionFromFirestore(familyId: string, transactionId: string): Promise<void> {
  const transDocRef = doc(db, `families/${familyId}/transactions`, transactionId);
  await deleteDoc(transDocRef);
}

/**
 * Escuta em tempo real todas as subcoleções do Firestore para a família
 */
export function subscribeFamilyData(
  familyId: string,
  onUpdate: (data: FamilyDataState) => void
): Unsubscribe {
  const unsubs: Unsubscribe[] = [];

  let state: FamilyDataState = {
    familyName: 'Minha Família',
    members: [],
    boxes: [],
    accounts: [],
    transactions: [],
  };

  const notify = () => {
    onUpdate({ ...state });
  };

  try {
    // 1. Escutar Documento da Família
    const familyDocRef = doc(db, 'families', familyId);
    const unsubFamily = onSnapshot(familyDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        state.familyName = data.name || 'Minha Família';
        state.initialSetupDone = data.initialSetupDone === true;
        notify();
      }
    });
    unsubs.push(unsubFamily);

    // 2. Escutar Membros
    const membersRef = collection(db, `families/${familyId}/members`);
    const unsubMembers = onSnapshot(membersRef, (snap) => {
      state.members = snap.docs.map((d) => d.data() as FamilyMember);
      notify();
    });
    unsubs.push(unsubMembers);

    // 3. Escutar Caixinhas
    const boxesRef = collection(db, `families/${familyId}/boxes`);
    const unsubBoxes = onSnapshot(boxesRef, (snap) => {
      state.boxes = snap.docs.map((d) => d.data() as BoxGoal);
      notify();
    });
    unsubs.push(unsubBoxes);

    // 4. Escutar Contas
    const accountsRef = collection(db, `families/${familyId}/accounts`);
    const unsubAccounts = onSnapshot(accountsRef, (snap) => {
      state.accounts = snap.docs.map((d) => d.data() as BankAccount);
      notify();
    });
    unsubs.push(unsubAccounts);

    // 5. Escutar Transações
    const transRef = collection(db, `families/${familyId}/transactions`);
    const unsubTrans = onSnapshot(transRef, (snap) => {
      state.transactions = snap.docs.map((d) => d.data() as FinancialTransaction);
      notify();
    });
    unsubs.push(unsubTrans);
  } catch (err) {
    console.error('Erro ao subscrever dados do Firestore:', err);
  }

  return () => {
    unsubs.forEach((unsub) => {
      try {
        unsub();
      } catch {}
    });
  };
}
