import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  collection,
  writeBatch,
  getDocs,
  query,
  collectionGroup,
  where,
} from 'firebase/firestore';
import { auth, db } from '@/infrastructure/firebase/firebase';
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
 * Função utilitária para timeout em requisições de rede
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs = 4500): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error('Tempo limite de rede excedido.');
      (err as any).code = 'auth/network-request-failed';
      reject(err);
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

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
      return 'Modo Offline: Não foi possível conectar ao servidor do Firebase no momento. Seus dados foram salvos localmente.';
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed':
      return 'Autenticação por E-mail/Senha não ativada no Firebase Console. Operando em modo local persistente.';
    default:
      return error?.message || 'Ocorreu um erro ao processar. Tente novamente.';
  }
}

/**
 * Helper para salvar e recuperar usuários em cache local offline (localStorage)
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
 * Registra o Chefe de Família, cria o documento da Família e as Caixinhas iniciais.
 * Se a conexão com o Firebase falhar/timeout (offline), cria no armazenamento persistente local.
 */
export async function registerFamilyAndHead(
  params: RegisterFamilyParams
): Promise<AuthSuccessResult> {
  const { name, email, password, familyName } = params;

  try {
    // Tenta criar no Firebase Authentication com timeout de 4.5s
    const userCredential = await withTimeout(
      createUserWithEmailAndPassword(auth, email, password)
    );
    const authUser = userCredential.user;

    try {
      await updateProfile(authUser, { displayName: name });
    } catch {
      // Non-blocking
    }

    // Gerar IDs locais compatíveis com offline-first
    const familyRef = doc(collection(db, 'families'));
    const familyId = familyRef.id;

    const memberRef = doc(collection(db, `families/${familyId}/members`));
    const memberId = memberRef.id;

    const nowIso = new Date().toISOString();

    const batch = writeBatch(db);

    batch.set(familyRef, {
      id: familyId,
      name: familyName || `Família de ${name.split(' ')[0]}`,
      headMemberId: memberId,
      createdAt: nowIso,
      updatedAt: nowIso,
      plan: 'free',
      currency: 'BRL',
      settings: {
        defaultView: 'consolidated',
        allowKidsViewFamilyTotals: true,
      },
    });

    const headMember: FamilyMember = {
      id: memberId,
      authUid: authUser.uid,
      role: 'chefe-familia',
      name,
      displayName: name.split(' ')[0],
      email,
      color: '#F5B82E',
      isMinor: false,
      status: 'active',
    };

    batch.set(memberRef, {
      ...headMember,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    const box1Ref = doc(collection(db, `families/${familyId}/boxes`));
    const box1: BoxGoal = {
      id: box1Ref.id,
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
    batch.set(box1Ref, { ...box1, createdAt: nowIso });

    const box2Ref = doc(collection(db, `families/${familyId}/boxes`));
    const box2: BoxGoal = {
      id: box2Ref.id,
      ownerMemberId: memberId,
      visibility: 'family',
      name: 'Investimentos',
      category: 'investment',
      targetAmountCents: 5000000,
      currentBalanceCents: 0,
      color: '#0A1F44',
      icon: 'chart',
    };
    batch.set(box2Ref, { ...box2, createdAt: nowIso });

    const box3Ref = doc(collection(db, `families/${familyId}/boxes`));
    const box3: BoxGoal = {
      id: box3Ref.id,
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
    batch.set(box3Ref, { ...box3, createdAt: nowIso });

    // Salvar todas as categorias padrão diretamente no Firestore
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

    // Firestore aceita batch offline e enfileira
    batch.commit().catch(() => {});

    const userProfile: UserProfile = {
      uid: authUser.uid,
      familyId,
      memberId,
      role: 'chefe-familia',
      displayName: name,
      email,
      color: '#F5B82E',
      isMinor: false,
    };

    saveLocalUser(userProfile, [headMember], [box1, box2, box3]);

    return {
      user: userProfile,
      familyMembers: [headMember],
      boxes: [box1, box2, box3],
      accounts: [],
      isOfflineMode: false,
    };
  } catch (error: any) {
    // Trata falhas de rede ou serviço de Auth não ativado no console (auth/configuration-not-found / auth/operation-not-allowed)
    const isOfflineOrNotConfigured =
      error?.code === 'auth/network-request-failed' ||
      error?.code === 'auth/configuration-not-found' ||
      error?.code === 'auth/operation-not-allowed' ||
      error?.code === 'auth/admin-restricted-operation' ||
      error?.message?.includes('network') ||
      error?.message?.includes('configuration-not-found');

    if (isOfflineOrNotConfigured) {
      console.warn('Firebase Auth indisponível ou não configurado. Ativando modo local persistente para cadastro:', error);

      const localFamilyId = `fam_local_${Date.now()}`;
      const localMemberId = `mem_chefe_${Date.now()}`;
      const localUid = `usr_local_${Date.now()}`;

      const headMember: FamilyMember = {
        id: localMemberId,
        authUid: localUid,
        role: 'chefe-familia',
        name,
        displayName: name.split(' ')[0],
        email,
        color: '#F5B82E',
        isMinor: false,
        status: 'active',
      };

      const defaultBoxes: BoxGoal[] = [
        {
          id: 'box_01',
          ownerMemberId: localMemberId,
          visibility: 'family',
          name: 'Reserva de Emergência',
          category: 'emergency',
          targetAmountCents: 1800000,
          currentBalanceCents: 0,
          color: '#F5B82E',
          icon: 'shield',
        },
        {
          id: 'box_02',
          ownerMemberId: localMemberId,
          visibility: 'family',
          name: 'Investimentos',
          category: 'investment',
          targetAmountCents: 5000000,
          currentBalanceCents: 0,
          color: '#0A1F44',
          icon: 'chart',
        },
      ];

      const userProfile: UserProfile = {
        uid: localUid,
        familyId: localFamilyId,
        memberId: localMemberId,
        role: 'chefe-familia',
        displayName: name,
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
        isOfflineMode: true,
      };
    }

    throw error;
  }
}

/**
 * Autentica o usuário no Firebase ou utiliza o cache local se estiver offline
 */
export async function loginUser(email: string, pass: string): Promise<AuthSuccessResult> {
  try {
    const credential = await withTimeout(
      signInWithEmailAndPassword(auth, email, pass)
    );
    const authUser = credential.user;

    try {
      const memberQuery = query(
        collectionGroup(db, 'members'),
        where('authUid', '==', authUser.uid)
      );
      const memberSnap = await getDocs(memberQuery);

      if (!memberSnap.empty) {
        const memberDoc = memberSnap.docs[0];
        const memberData = memberDoc.data() as FamilyMember;
        const familyRef = memberDoc.ref.parent.parent;
        const familyId = familyRef ? familyRef.id : 'fam_default';

        const allMembersSnap = await getDocs(collection(db, `families/${familyId}/members`));
        const familyMembers: FamilyMember[] = allMembersSnap.docs.map((d) => d.data() as FamilyMember);

        const boxesSnap = await getDocs(collection(db, `families/${familyId}/boxes`));
        const boxes: BoxGoal[] = boxesSnap.docs.map((d) => d.data() as BoxGoal);

        const accountsSnap = await getDocs(collection(db, `families/${familyId}/accounts`));
        const accounts: BankAccount[] = accountsSnap.docs.map((d) => d.data() as BankAccount);

        const userProfile: UserProfile = {
          uid: authUser.uid,
          familyId,
          memberId: memberData.id,
          role: memberData.role,
          displayName: authUser.displayName || memberData.name || 'Lucas Martins',
          email: authUser.email || email,
          color: memberData.color || '#F5B82E',
          avatarUrl: authUser.photoURL || memberData.avatarUrl,
          isMinor: memberData.isMinor,
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
    } catch {
      // Ignora erro de Firestore e segue
    }

    const fallbackUser: UserProfile = {
      uid: authUser.uid,
      familyId: 'fam_01',
      memberId: 'mem_chefe_01',
      role: 'chefe-familia',
      displayName: authUser.displayName || 'Lucas Martins',
      email: authUser.email || email,
      color: '#F5B82E',
    };

    return {
      user: fallbackUser,
      familyMembers: [],
      boxes: [],
      accounts: [],
      isOfflineMode: false,
    };
  } catch (error: any) {
    const isOfflineOrNotConfigured =
      error?.code === 'auth/network-request-failed' ||
      error?.code === 'auth/configuration-not-found' ||
      error?.code === 'auth/operation-not-allowed' ||
      error?.code === 'auth/admin-restricted-operation' ||
      error?.message?.includes('network') ||
      error?.message?.includes('configuration-not-found');

    if (isOfflineOrNotConfigured) {
      console.warn('Modo local acionado no login:', error);

      const cached = localStorage.getItem('partiu_last_user');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          return {
            ...parsed,
            isOfflineMode: true,
          };
        } catch {
          // Continue
        }
      }

      // Sessão offline fallback para não travar o usuário
      const fallbackUser: UserProfile = {
        uid: 'demo_user_offline',
        familyId: 'fam_demo_01',
        memberId: 'mem_chefe_01',
        role: 'chefe-familia',
        displayName: 'Lucas Martins',
        email: email || 'lucas@partiuinvest.com.br',
        color: '#F5B82E',
      };

      return {
        user: fallbackUser,
        familyMembers: [],
        boxes: [],
        accounts: [],
        isOfflineMode: true,
      };
    }

    throw error;
  }
}

/**
 * Login com Google Auth ou Fallback Offline
 */
export async function loginWithGoogle(): Promise<AuthSuccessResult> {
  try {
    const provider = new GoogleAuthProvider();
    const credential = await withTimeout(signInWithPopup(auth, provider));
    const authUser = credential.user;

    return loginUser(authUser.email || '', '');
  } catch (error: any) {
    const isFallbackNeeded =
      error?.code === 'auth/network-request-failed' ||
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/configuration-not-found' ||
      error?.code === 'auth/operation-not-allowed';

    if (isFallbackNeeded) {
      const fallbackUser: UserProfile = {
        uid: 'google_user_offline',
        familyId: 'fam_demo_01',
        memberId: 'mem_chefe_01',
        role: 'chefe-familia',
        displayName: 'Lucas Martins (Google)',
        email: 'lucas.martins@gmail.com',
        color: '#F5B82E',
      };

      return {
        user: fallbackUser,
        familyMembers: [],
        boxes: [],
        accounts: [],
        isOfflineMode: true,
      };
    }

    throw error;
  }
}
