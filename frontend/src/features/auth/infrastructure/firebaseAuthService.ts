import bcrypt from 'bcryptjs';
import {
  doc,
  collection,
  writeBatch,
  getDocs,
  query,
  where,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/firebase';
import { UserProfile, FamilyMember, BoxGoal, BankAccount } from '@/core/types';
import { DEFAULT_CATEGORIES } from '@/core/categories';

export interface RegisterFamilyParams {
  name: string;
  email: string;
  password: string;
  familyName: string;
}

export interface AuthSuccessResult {
  user: UserProfile;
  familyMembers: FamilyMember[];
  boxes: BoxGoal[];
  accounts: BankAccount[];
  isOfflineMode?: boolean;
}

/**
 * Gera hash criptográfico seguro (Bcrypt com fallback para SHA-256)
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, 10);
  } catch {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}

/**
 * Valida a senha comparando com o hash salvo no Firestore (suporta Bcrypt, SHA-256 e texto direto)
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;

  // 1. Se for hash Bcrypt ($2a$, $2b$, $2y$)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    try {
      const match = await bcrypt.compare(password, storedHash);
      if (match) return true;
    } catch {}
  }

  // 2. Se for hash SHA-256 (64 hexadecimais)
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha256Hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    if (sha256Hex.toLowerCase() === storedHash.toLowerCase()) {
      return true;
    }
  } catch {}

  // 3. Fallback para comparação direta (caso tenha sido gravado em texto simples)
  if (password === storedHash) {
    return true;
  }

  return false;
}

/**
 * Mapeamento de mensagens amigáveis de erro
 */
export function getFirebaseErrorMessage(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Tente entrar ou recuperar sua senha.';
    case 'auth/invalid-email':
      return 'O formato do e-mail é inválido.';
    case 'auth/weak-password':
      return 'A senha deve ter no mínimo 6 caracteres.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos. Verifique seus dados.';
    case 'auth/popup-closed-by-user':
      return 'A janela de autenticação foi fechada antes de concluir.';
    case 'auth/network-request-failed':
      return 'Não foi possível conectar ao Firestore no momento. Verifique sua conexão.';
    default:
      return error?.message || 'Ocorreu um erro ao processar. Tente novamente.';
  }
}

/**
 * Helper para salvar sessão localmente
 */
function saveLocalUser(user: UserProfile, members: FamilyMember[], boxes: BoxGoal[]) {
  try {
    const key = `partiu_family_${user.familyId}`;
    localStorage.setItem(key, JSON.stringify({ user, members, boxes }));
    localStorage.setItem('partiu_last_user', JSON.stringify({ user, members, boxes }));
  } catch {
    // Ignore storage quota
  }
}

/**
 * Registra novo usuário e estrutura familiar diretamente na collection `users` e `families` do Firestore
 */
export async function registerFamilyAndHead(
  params: RegisterFamilyParams
): Promise<AuthSuccessResult> {
  const { name, email: rawEmail, password, familyName } = params;
  const email = rawEmail.toLowerCase().trim();

  // 1. Verificar se o e-mail já existe na collection `users` do Firestore
  const usersRef = collection(db, 'users');
  const userQuery = query(usersRef, where('email', '==', email));
  const userSnap = await getDocs(userQuery);

  if (!userSnap.empty) {
    const err: any = new Error('Este e-mail já está cadastrado. Tente entrar.');
    err.code = 'auth/email-already-in-use';
    throw err;
  }

  // 2. Gerar hashes e IDs
  const passwordHash = await hashPassword(password);
  const nowIso = new Date().toISOString();

  const userDocRef = doc(collection(db, 'users'));
  const userId = userDocRef.id;

  const familyDocRef = doc(collection(db, 'families'));
  const familyId = familyDocRef.id;

  const memberDocRef = doc(collection(db, `families/${familyId}/members`));
  const memberId = memberDocRef.id;

  // 3. Documento da Família
  const familyData = {
    id: familyId,
    name: familyName || `Família de ${name.trim().split(' ')[0]}`,
    headMemberId: memberId,
    createdAt: nowIso,
    updatedAt: nowIso,
    plan: 'free',
    currency: 'BRL',
    settings: {
      defaultView: 'consolidated',
      allowKidsViewFamilyTotals: true,
    },
  };

  // 4. Documento do Membro Chefe
  const headMember: FamilyMember = {
    id: memberId,
    authUid: userId,
    role: 'chefe-familia',
    name: name.trim(),
    displayName: name.trim().split(' ')[0],
    email,
    color: '#F5B82E',
    isMinor: false,
    status: 'active',
  };

  // 5. Caixinhas Iniciais
  const box1DocRef = doc(collection(db, `families/${familyId}/boxes`));
  const box1: BoxGoal = {
    id: box1DocRef.id,
    ownerMemberId: memberId,
    visibility: 'family',
    name: 'Reserva de Emergência',
    category: 'emergency',
    targetAmountCents: 1800000,
    currentBalanceCents: 0,
    targetDate: '2027-12-31',
    color: '#F5B82E',
    icon: 'shield',
  };

  const box2DocRef = doc(collection(db, `families/${familyId}/boxes`));
  const box2: BoxGoal = {
    id: box2DocRef.id,
    ownerMemberId: memberId,
    visibility: 'family',
    name: 'Investimentos',
    category: 'investment',
    targetAmountCents: 5000000,
    currentBalanceCents: 0,
    color: '#0A1F44',
    icon: 'chart',
  };

  const box3DocRef = doc(collection(db, `families/${familyId}/boxes`));
  const box3: BoxGoal = {
    id: box3DocRef.id,
    ownerMemberId: memberId,
    visibility: 'family',
    name: 'Viagem dos Sonhos',
    category: 'dream',
    targetAmountCents: 800000,
    currentBalanceCents: 0,
    targetDate: '2027-07-31',
    color: '#3F6FD8',
    icon: 'plane',
  };

  const defaultBoxes = [box1, box2, box3];

  // 6. Documento do Usuário
  const userData = {
    id: userId,
    name: name.trim(),
    displayName: name.trim().split(' ')[0],
    email,
    passwordHash,
    familyId,
    memberId,
    role: 'chefe-familia',
    color: '#F5B82E',
    status: 'active',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // 7. Gravação atômica via Batch no Firestore
  const batch = writeBatch(db);
  batch.set(userDocRef, userData);
  batch.set(familyDocRef, familyData);
  batch.set(memberDocRef, { ...headMember, createdAt: nowIso, updatedAt: nowIso });
  batch.set(box1DocRef, { ...box1, createdAt: nowIso });
  batch.set(box2DocRef, { ...box2, createdAt: nowIso });
  batch.set(box3DocRef, { ...box3, createdAt: nowIso });

  // Categorias padrão
  DEFAULT_CATEGORIES.forEach((cat) => {
    const catRef = doc(collection(db, `families/${familyId}/categories`), cat.id);
    batch.set(catRef, {
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

  const userProfile: UserProfile = {
    uid: userId,
    familyId,
    memberId,
    role: 'chefe-familia',
    displayName: name.trim(),
    email,
    color: '#F5B82E',
    isMinor: false,
  };

  saveLocalUser(userProfile, [headMember], defaultBoxes);

  return {
    user: userProfile,
    familyMembers: [headMember],
    boxes: defaultBoxes,
    accounts: [],
    isOfflineMode: false,
  };
}

/**
 * Autentica o usuário diretamente na collection `users` do Firestore
 */
export async function loginUser(rawEmail: string, pass: string): Promise<AuthSuccessResult> {
  const emailLower = rawEmail.toLowerCase().trim();
  const emailOriginal = rawEmail.trim();

  // 1. Buscar usuário na collection `users` do Firestore (tentando lowercase e original)
  const usersRef = collection(db, 'users');
  let userSnap = await getDocs(query(usersRef, where('email', '==', emailLower)));
  if (userSnap.empty && emailLower !== emailOriginal) {
    userSnap = await getDocs(query(usersRef, where('email', '==', emailOriginal)));
  }

  if (userSnap.empty) {
    const err: any = new Error('E-mail ou senha incorretos.');
    err.code = 'auth/invalid-credential';
    throw err;
  }

  const userDoc = userSnap.docs[0];
  const userData = userDoc.data() as any;

  // 2. Validar senha com o hash salvo (Bcrypt, SHA-256 ou texto direto)
  const isMatch = await verifyPassword(pass, userData.passwordHash);
  if (!isMatch) {
    const err: any = new Error('E-mail ou senha incorretos.');
    err.code = 'auth/invalid-credential';
    throw err;
  }

  // Atualiza hash antigo para bcrypt caso não seja
  if (userData.passwordHash && !userData.passwordHash.startsWith('$2b$') && !userData.passwordHash.startsWith('$2a$')) {
    hashPassword(pass).then((newHash) => {
      updateDoc(userDoc.ref, { passwordHash: newHash, updatedAt: new Date().toISOString() }).catch(() => {});
    });
  }

  const familyId = userData.familyId || `fam_${userDoc.id}`;
  const memberId = userData.memberId || `mem_${userDoc.id}`;

  // 3. Carregar membros da família
  let familyMembers: FamilyMember[] = [];
  try {
    const membersSnap = await getDocs(collection(db, `families/${familyId}/members`));
    familyMembers = membersSnap.docs.map((d) => d.data() as FamilyMember);
  } catch {}

  // 4. Carregar caixinhas
  let boxes: BoxGoal[] = [];
  try {
    const boxesSnap = await getDocs(collection(db, `families/${familyId}/boxes`));
    boxes = boxesSnap.docs.map((d) => d.data() as BoxGoal);
  } catch {}

  // 5. Carregar contas
  let accounts: BankAccount[] = [];
  try {
    const accountsSnap = await getDocs(collection(db, `families/${familyId}/accounts`));
    accounts = accountsSnap.docs.map((d) => d.data() as BankAccount);
  } catch {}

  if (familyMembers.length === 0) {
    familyMembers = [
      {
        id: memberId,
        authUid: userDoc.id,
        role: (userData.role as any) || 'chefe-familia',
        name: userData.name || userData.displayName || emailLower.split('@')[0],
        displayName: (userData.displayName || userData.name || emailLower.split('@')[0]).split(' ')[0],
        email: userData.email || emailLower,
        color: userData.color || '#F5B82E',
        isMinor: false,
        status: 'active',
      },
    ];
  }

  const userProfile: UserProfile = {
    uid: userDoc.id,
    familyId,
    memberId,
    role: (userData.role as any) || 'chefe-familia',
    displayName: userData.displayName || userData.name || emailLower.split('@')[0],
    email: userData.email || emailLower,
    color: userData.color || '#F5B82E',
    isMinor: !!userData.isMinor,
  };

  saveLocalUser(userProfile, familyMembers, boxes);

  return {
    user: userProfile,
    familyMembers,
    boxes,
    accounts,
    isOfflineMode: false,
  };
}

/**
 * Login com Google
 */
export async function loginWithGoogle(): Promise<AuthSuccessResult> {
  const err: any = new Error('Para utilizar login com Google, ative o provedor Google no Firebase Console.');
  err.code = 'auth/operation-not-allowed';
  throw err;
}
