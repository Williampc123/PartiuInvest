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
import { FamilyMember, BoxGoal, BankAccount, FinancialTransaction, FinancialCategory, BoxCategory } from '@/core/types';
import { DEFAULT_CATEGORIES, DEFAULT_BOX_CATEGORIES } from '@/core/categories';
import { FamilyBudgetConfig } from '@/features/budget/infrastructure/budgetService';

export interface FamilyDataState {
  familyName: string;
  initialSetupDone?: boolean;
  budgetConfig?: FamilyBudgetConfig | null;
  members: FamilyMember[];
  boxes: BoxGoal[];
  boxCategories: BoxCategory[];
  accounts: BankAccount[];
  transactions: FinancialTransaction[];
  categories: FinancialCategory[];
}

/**
 * Inicializa as categorias padrão diretamente no Firestore para a família
 */
export async function seedDefaultCategoriesIfEmpty(familyId: string) {
  try {
    const categoriesRef = collection(db, `families/${familyId}/categories`);
    const snap = await getDocs(categoriesRef);

    if (snap.empty) {
      const batch = writeBatch(db);
      const nowIso = new Date().toISOString();

      DEFAULT_CATEGORIES.forEach((cat) => {
        const catDocRef = doc(categoriesRef, cat.id);
        batch.set(catDocRef, {
          id: cat.id,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          color: cat.color,
          isCustom: true,
          createdAt: nowIso,
        });
      });

      await batch.commit();
      console.log(`✅ Categorias padrão salvas no Firestore para [${familyId}]!`);
    }
  } catch (err) {
    console.warn('Aviso ao inicializar categorias no Firestore:', err);
  }
}

/**
 * Inicializa a estrutura de caixinhas e contas para uma nova família no Firestore
 */
export async function seedInitialFamilyDataIfEmpty(familyId: string, headMemberId: string) {
  try {
    // 1. Inicializar categorias no Firestore se não existirem
    await seedDefaultCategoriesIfEmpty(familyId);

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
 * Utilitário de sanitização para evitar erro de campos undefined no Firestore
 */
function cleanFirestoreObject<T extends Record<string, any>>(obj: T): T {
  const clean: any = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      clean[key] = cleanFirestoreObject(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
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

  const payload = cleanFirestoreObject({
    ...box,
    createdAt: new Date().toISOString(),
  });

  const batch = writeBatch(db);
  batch.set(newDocRef, payload);

  // Se houver saldo inicial com valor > 0
  if (boxData.currentBalanceCents > 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    // 1. Se a origem for conta bancária, debitar da conta e registrar saída da conta
    if (initialDeposit?.accountId && initialDeposit.accountId !== 'wallet') {
      const transRefDebit = doc(collection(db, `families/${familyId}/transactions`));
      batch.set(transRefDebit, cleanFirestoreObject({
        id: transRefDebit.id,
        accountId: initialDeposit.accountId,
        memberId: initialDeposit.memberId || boxData.ownerMemberId,
        visibility: boxData.visibility,
        description: `Retirada da Conta para Caixinha: ${boxData.name}`,
        amountCents: -Math.abs(boxData.currentBalanceCents),
        category: 'Investimentos / Caixinhas',
        date: todayStr,
        type: 'expense',
        source: 'manual',
        createdAt: nowIso,
      }));
    }

    // 2. Registrar aporte / entrada na caixinha
    const transRefCredit = doc(collection(db, `families/${familyId}/transactions`));
    batch.set(transRefCredit, cleanFirestoreObject({
      id: transRefCredit.id,
      accountId: 'wallet',
      memberId: initialDeposit?.memberId || boxData.ownerMemberId,
      visibility: boxData.visibility,
      description: `Aporte Inicial na Caixinha: ${boxData.name}`,
      amountCents: Math.abs(boxData.currentBalanceCents),
      category: 'Investimentos / Caixinhas',
      date: todayStr,
      type: 'income',
      source: 'manual',
      createdAt: nowIso,
    }));
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
  const payload = cleanFirestoreObject({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  await updateDoc(boxDocRef, payload);
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
 * Aporta / Guarda dinheiro na caixinha gerando retirada da conta e aporte na caixinha
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

  const validSources = sourceList.filter(s => s.amountCents > 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const nowIso = new Date().toISOString();

  for (const src of validSources) {
    // 1. Se veio de conta bancária, registrar a retirada / saída da conta
    if (src.accountId !== 'wallet') {
      const transRefDebit = doc(collection(db, `families/${familyId}/transactions`));
      batch.set(transRefDebit, cleanFirestoreObject({
        id: transRefDebit.id,
        accountId: src.accountId,
        memberId: memberId || 'user',
        visibility: 'family',
        description: `Retirada da Conta para Caixinha: ${boxName || 'Meta Financeira'}`,
        amountCents: -Math.abs(src.amountCents),
        category: 'Investimentos / Caixinhas',
        date: todayStr,
        type: 'expense',
        source: 'manual',
        createdAt: nowIso,
      }));
    }

    // 2. Registrar o aporte / entrada na caixinha
    const transRefCredit = doc(collection(db, `families/${familyId}/transactions`));
    batch.set(transRefCredit, cleanFirestoreObject({
      id: transRefCredit.id,
      accountId: 'wallet',
      memberId: memberId || 'user',
      visibility: 'family',
      description: `Aporte na Caixinha: ${boxName || 'Meta Financeira'}`,
      amountCents: Math.abs(src.amountCents),
      category: 'Investimentos / Caixinhas',
      date: todayStr,
      type: 'income',
      source: 'manual',
      createdAt: nowIso,
    }));
  }

  await batch.commit();

  // Atualizar saldos das contas bancárias debitadas
  const bankSources = validSources.filter(s => s.accountId !== 'wallet');
  if (bankSources.length > 0) {
    try {
      const accSnap = await getDocs(collection(db, `families/${familyId}/accounts`));
      for (const src of bankSources) {
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
 * Resgata dinheiro da caixinha com opção de creditar em conta bancária (saída da caixinha + entrada na conta)
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

  const todayStr = new Date().toISOString().split('T')[0];
  const nowIso = new Date().toISOString();

  // 1. Saída / Resgate da Caixinha
  const transRefDebit = doc(collection(db, `families/${familyId}/transactions`));
  batch.set(transRefDebit, cleanFirestoreObject({
    id: transRefDebit.id,
    accountId: 'wallet',
    memberId: memberId || 'user',
    visibility: 'family',
    description: `Resgate da Caixinha: ${boxName || 'Meta Financeira'}`,
    amountCents: -Math.abs(amountCents),
    category: 'Investimentos / Caixinhas',
    date: todayStr,
    type: 'expense',
    source: 'manual',
    createdAt: nowIso,
  }));

  // 2. Se o destino for conta bancária cadastrada, creditar na conta e registrar entrada na conta
  if (toAccountId && toAccountId !== 'wallet') {
    const transRefCredit = doc(collection(db, `families/${familyId}/transactions`));
    batch.set(transRefCredit, cleanFirestoreObject({
      id: transRefCredit.id,
      accountId: toAccountId,
      memberId: memberId || 'user',
      visibility: 'family',
      description: `Entrada via Resgate da Caixinha: ${boxName || 'Meta Financeira'}`,
      amountCents: Math.abs(amountCents),
      category: 'Investimentos / Rendimentos',
      date: todayStr,
      type: 'income',
      source: 'manual',
      createdAt: nowIso,
    }));
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
 * Exclui múltiplas movimentações em lote no Firestore
 */
export async function deleteMultipleTransactionsFromFirestore(
  familyId: string,
  transactionIds: string[]
): Promise<void> {
  if (!familyId || !transactionIds || transactionIds.length === 0) return;

  const batch = writeBatch(db);
  for (const id of transactionIds) {
    const docRef = doc(db, `families/${familyId}/transactions`, id);
    batch.delete(docRef);
  }
  await batch.commit();
}

/**
 * Atualiza uma movimentação individual no Firestore
 */
export async function updateTransactionInFirestore(
  familyId: string,
  transactionId: string,
  updates: Partial<FinancialTransaction>
): Promise<void> {
  const transDocRef = doc(db, `families/${familyId}/transactions`, transactionId);
  await updateDoc(transDocRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Atualiza múltiplas movimentações em lote no Firestore (ex: todas as parcelas)
 */
export async function updateMultipleTransactionsInFirestore(
  familyId: string,
  transactionsUpdates: { id: string; updates: Partial<FinancialTransaction> }[]
): Promise<void> {
  const batch = writeBatch(db);
  const nowIso = new Date().toISOString();

  for (const item of transactionsUpdates) {
    const docRef = doc(db, `families/${familyId}/transactions`, item.id);
    batch.update(docRef, {
      ...item.updates,
      updatedAt: nowIso,
    });
  }

  await batch.commit();
}

/**
 * Adiciona uma nova categoria ao Firestore
 */
export async function addCategoryToFirestore(
  familyId: string,
  categoryData: Omit<FinancialCategory, 'id'>
): Promise<FinancialCategory> {
  const catRef = collection(db, `families/${familyId}/categories`);
  const newDocRef = doc(catRef);
  const category: FinancialCategory = {
    ...categoryData,
    id: newDocRef.id,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };

  await setDoc(newDocRef, category);
  return category;
}

/**
 * Atualiza uma categoria no Firestore
 */
export async function updateCategoryInFirestore(
  familyId: string,
  categoryId: string,
  updates: Partial<FinancialCategory>
): Promise<void> {
  const catDocRef = doc(db, `families/${familyId}/categories`, categoryId);
  await updateDoc(catDocRef, updates);
}

/**
 * Exclui uma categoria personalizada do Firestore
 */
export async function deleteCategoryFromFirestore(familyId: string, categoryId: string): Promise<void> {
  const catDocRef = doc(db, `families/${familyId}/categories`, categoryId);
  await deleteDoc(catDocRef);
}

/**
 * Inicializa categorias padrão de caixinhas se vazio
 */
export async function seedDefaultBoxCategoriesIfEmpty(familyId: string) {
  try {
    const boxCatRef = collection(db, `families/${familyId}/box_categories`);
    const snap = await getDocs(boxCatRef);

    if (snap.empty) {
      const batch = writeBatch(db);
      DEFAULT_BOX_CATEGORIES.forEach((cat) => {
        const catDocRef = doc(boxCatRef, cat.id);
        batch.set(catDocRef, {
          id: cat.id,
          name: cat.name,
          label: cat.label,
          icon: cat.icon,
          color: cat.color,
          defaultName: cat.defaultName || cat.label,
          isCustom: false,
          createdAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Erro ao verificar/semear categorias padrão de caixinhas:', err);
  }
}

/**
 * Adiciona nova categoria de caixinha no Firestore
 */
export async function addBoxCategoryToFirestore(
  familyId: string,
  categoryData: Omit<BoxCategory, 'id'>
): Promise<BoxCategory> {
  const catRef = collection(db, `families/${familyId}/box_categories`);
  const newDocRef = doc(catRef);
  const category: BoxCategory = {
    ...categoryData,
    id: newDocRef.id,
    isCustom: true,
  };

  await setDoc(newDocRef, {
    ...category,
    createdAt: new Date().toISOString(),
  });
  return category;
}

/**
 * Atualiza categoria de caixinha no Firestore
 */
export async function updateBoxCategoryInFirestore(
  familyId: string,
  categoryId: string,
  updates: Partial<BoxCategory>
): Promise<void> {
  const catDocRef = doc(db, `families/${familyId}/box_categories`, categoryId);
  await updateDoc(catDocRef, updates);
}

/**
 * Exclui categoria de caixinha do Firestore
 */
export async function deleteBoxCategoryFromFirestore(familyId: string, categoryId: string): Promise<void> {
  const catDocRef = doc(db, `families/${familyId}/box_categories`, categoryId);
  await deleteDoc(catDocRef);
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
    boxCategories: DEFAULT_BOX_CATEGORIES,
    accounts: [],
    transactions: [],
    categories: DEFAULT_CATEGORIES,
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
        state.budgetConfig = data.budgetConfig || null;
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

    // 6. Escutar Categorias do Firestore
    const categoriesRef = collection(db, `families/${familyId}/categories`);
    const unsubCategories = onSnapshot(categoriesRef, (snap) => {
      if (snap.empty) {
        // Se a coleção ainda estiver vazia no Firestore, faz o seed automático
        seedDefaultCategoriesIfEmpty(familyId);
        state.categories = DEFAULT_CATEGORIES;
      } else {
        // Usa estritamente os documentos da coleção de categorias do Firestore
        state.categories = snap.docs.map((d) => d.data() as FinancialCategory);
      }
      notify();
    });
    unsubs.push(unsubCategories);

    // 7. Escutar Categorias de Caixinhas do Firestore
    const boxCategoriesRef = collection(db, `families/${familyId}/box_categories`);
    const unsubBoxCategories = onSnapshot(boxCategoriesRef, (snap) => {
      if (snap.empty) {
        seedDefaultBoxCategoriesIfEmpty(familyId);
        state.boxCategories = DEFAULT_BOX_CATEGORIES;
      } else {
        state.boxCategories = snap.docs.map((d) => d.data() as BoxCategory);
      }
      notify();
    });
    unsubs.push(unsubBoxCategories);
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

