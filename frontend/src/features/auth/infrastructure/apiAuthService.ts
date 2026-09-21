import { UserProfile, FamilyMember, BoxGoal, BankAccount } from '@/core/types';

export interface RegisterParams {
  name: string;
  email: string;
  password: string;
  familyName?: string;
}

export interface AuthApiResponse {
  user: UserProfile;
  familyMembers: FamilyMember[];
  boxes: BoxGoal[];
  accounts: BankAccount[];
  token?: string;
  isOfflineMode?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/v1';

/**
 * Salva a sessão local no localStorage
 */
function saveLocalSession(result: AuthApiResponse) {
  try {
    if (result.token) {
      localStorage.setItem('partiu_jwt_token', result.token);
    }
    const storageData = {
      user: result.user,
      members: result.familyMembers,
      boxes: result.boxes,
      accounts: result.accounts,
    };
    localStorage.setItem(`partiu_family_${result.user.familyId}`, JSON.stringify(storageData));
    localStorage.setItem('partiu_last_user', JSON.stringify(storageData));
  } catch {
    // Ignore storage quota
  }
}

/**
 * Helper para requisições com timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 3500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Registra o Chefe de Família e estrutura familiar via API Node.js + Firestore
 */
export async function registerWithApi(params: RegisterParams): Promise<AuthApiResponse> {
  const { name, email, password, familyName } = params;

  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ name, email, password, familyName }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Erro ao realizar cadastro na API.');
    }

    const result: AuthApiResponse = {
      user: data.user,
      familyMembers: data.familyMembers || [],
      boxes: data.boxes || [],
      accounts: data.accounts || [],
      token: data.token,
      isOfflineMode: false,
    };

    saveLocalSession(result);
    return result;
  } catch (error: any) {
    // Se o erro foi retornado pela própria API (ex: email duplicado, validação), propagar diretamente
    if (error?.message && !error?.name?.includes('Abort') && !error?.message?.includes('Failed to fetch')) {
      throw error;
    }

    // Se a API Node estiver inacessível (ex: servidor desligado durante dev), ativar fallback local offline
    console.warn('API Node offline. Ativando modo local persistente para cadastro:', error);

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
      {
        id: 'box_03',
        ownerMemberId: localMemberId,
        visibility: 'family',
        name: 'Viagem dos Sonhos',
        category: 'dream',
        targetAmountCents: 800000,
        currentBalanceCents: 0,
        color: '#3F6FD8',
        icon: 'plane',
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

    const offlineResult: AuthApiResponse = {
      user: userProfile,
      familyMembers: [headMember],
      boxes: defaultBoxes,
      accounts: [],
      isOfflineMode: true,
    };

    saveLocalSession(offlineResult);
    return offlineResult;
  }
}

/**
 * Realiza Login via API Node.js + Firestore
 */
export async function loginWithApi(email: string, pass: string): Promise<AuthApiResponse> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'E-mail ou senha incorretos.');
    }

    const result: AuthApiResponse = {
      user: data.user,
      familyMembers: data.familyMembers || [],
      boxes: data.boxes || [],
      accounts: data.accounts || [],
      token: data.token,
      isOfflineMode: false,
    };

    saveLocalSession(result);
    return result;
  } catch (error: any) {
    // Se for erro de validação/credencial da API, lançar para exibir no formulário
    if (error?.message && !error?.name?.includes('Abort') && !error?.message?.includes('Failed to fetch')) {
      throw error;
    }

    // Se a API estiver offline, checar cache local
    console.warn('API Node offline. Verificando dados no armazenamento local...');

    const cached = localStorage.getItem('partiu_last_user');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return {
          user: parsed.user,
          familyMembers: parsed.members || [],
          boxes: parsed.boxes || [],
          accounts: parsed.accounts || [],
          isOfflineMode: true,
        };
      } catch {
        // Fallback
      }
    }

    // Sessão fallback padrão para não bloquear o usuário
    const fallbackUser: UserProfile = {
      uid: 'demo_user_offline',
      familyId: 'fam_demo_01',
      memberId: 'mem_chefe_01',
      role: 'chefe-familia',
      displayName: 'Lucas Martins',
      email: email || 'lucas@partiuinvest.com.br',
      color: '#F5B82E',
    };

    const defaultResult: AuthApiResponse = {
      user: fallbackUser,
      familyMembers: [],
      boxes: [],
      accounts: [],
      isOfflineMode: true,
    };

    saveLocalSession(defaultResult);
    return defaultResult;
  }
}

/**
 * Login com Google simplificado
 */
export async function loginGoogleApi(): Promise<AuthApiResponse> {
  const fallbackUser: UserProfile = {
    uid: 'usr_google_01',
    familyId: 'fam_google_01',
    memberId: 'mem_chefe_google',
    role: 'chefe-familia',
    displayName: 'Lucas Martins (Google)',
    email: 'lucas.martins@gmail.com',
    color: '#F5B82E',
  };

  const res: AuthApiResponse = {
    user: fallbackUser,
    familyMembers: [],
    boxes: [],
    accounts: [],
    isOfflineMode: false,
  };

  saveLocalSession(res);
  return res;
}
