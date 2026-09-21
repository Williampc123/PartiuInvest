import { create } from 'zustand';
import { UserProfile, FamilyMember, BankAccount, BoxGoal, FinancialTransaction } from '../../core/types';

interface AppState {
  user: UserProfile | null;
  familyName: string;
  familyMembers: FamilyMember[];
  selectedMemberId: string | 'all'; // 'all' para visão consolidada da família
  accounts: BankAccount[];
  boxes: BoxGoal[];
  transactions: FinancialTransaction[];
  selectedYearMonth: string; // formato YYYY-MM (ex: '2026-09')
  periodFilter: {
    type: 'month' | 'custom' | 'all';
    yearMonth?: string;
    startDate?: string;
    endDate?: string;
    label?: string;
  };
  initialSetupDone: boolean;
  isInitialSetupOpen: boolean;
  isDataLoaded: boolean;
  isOffline: boolean;
  setUser: (user: UserProfile | null) => void;
  setFamilyName: (name: string) => void;
  setFamilyMembers: (members: FamilyMember[]) => void;
  setSelectedMemberId: (id: string | 'all') => void;
  setSelectedYearMonth: (ym: string) => void;
  setInitialSetupDone: (done: boolean) => void;
  setIsInitialSetupOpen: (open: boolean) => void;
  setPeriodFilter: (filter: {
    type: 'month' | 'custom' | 'all';
    yearMonth?: string;
    startDate?: string;
    endDate?: string;
    label?: string;
  }) => void;
  setCustomPeriod: (startDate: string, endDate: string) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  setAccounts: (accounts: BankAccount[]) => void;
  setBoxes: (boxes: BoxGoal[]) => void;
  setTransactions: (transactions: FinancialTransaction[]) => void;
  setIsDataLoaded: (loaded: boolean) => void;
  setIsOffline: (offline: boolean) => void;
  setAllFamilyData: (data: {
    familyName?: string;
    members?: FamilyMember[];
    boxes?: BoxGoal[];
    accounts?: BankAccount[];
    transactions?: FinancialTransaction[];
  }) => void;
}

// Recuperar último usuário salvo na sessão local
const getInitialUser = (): UserProfile | null => {
  try {
    const cached = localStorage.getItem('partiu_last_user');
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed.user || null;
    }
  } catch {}
  return null;
};

// Obter mês atual padrão no formato YYYY-MM
const getInitialYearMonth = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const useAppStore = create<AppState>((set) => {
  const initialYM = getInitialYearMonth();

  return {
    user: getInitialUser(),
    familyName: 'Minha Família',
    familyMembers: [],
    selectedMemberId: 'all',
    selectedYearMonth: initialYM,
    periodFilter: {
      type: 'month',
      yearMonth: initialYM,
    },
    accounts: [],
    boxes: [],
    transactions: [],
    initialSetupDone: false,
    isInitialSetupOpen: false,
    isDataLoaded: false,
    isOffline: !navigator.onLine,

    setUser: (user) => set({ user }),
    setFamilyName: (familyName) => set({ familyName }),
    setFamilyMembers: (familyMembers) => set({ familyMembers }),
    setSelectedMemberId: (selectedMemberId) => set({ selectedMemberId }),
    setInitialSetupDone: (initialSetupDone) => set({ initialSetupDone }),
    setIsInitialSetupOpen: (isInitialSetupOpen) => set({ isInitialSetupOpen }),
    setSelectedYearMonth: (selectedYearMonth) =>
      set({
        selectedYearMonth,
        periodFilter: { type: 'month', yearMonth: selectedYearMonth },
      }),
    
    setPeriodFilter: (periodFilter) =>
      set((state) => ({
        periodFilter,
        selectedYearMonth: periodFilter.yearMonth || state.selectedYearMonth,
      })),

    setCustomPeriod: (startDate, endDate) =>
      set({
        periodFilter: {
          type: 'custom',
          startDate,
          endDate,
        },
      }),

    goToPreviousMonth: () =>
      set((state) => {
        const currentYM = state.periodFilter.yearMonth || state.selectedYearMonth;
        const [y, m] = currentYM.split('-').map(Number);
        let newY = y;
        let newM = m - 1;
        if (newM < 1) {
          newM = 12;
          newY -= 1;
        }
        const nextYM = `${newY}-${String(newM).padStart(2, '0')}`;
        return {
          selectedYearMonth: nextYM,
          periodFilter: { type: 'month', yearMonth: nextYM },
        };
      }),

    goToNextMonth: () =>
      set((state) => {
        const currentYM = state.periodFilter.yearMonth || state.selectedYearMonth;
        const [y, m] = currentYM.split('-').map(Number);
        let newY = y;
        let newM = m + 1;
        if (newM > 12) {
          newM = 1;
          newY += 1;
        }
        const nextYM = `${newY}-${String(newM).padStart(2, '0')}`;
        return {
          selectedYearMonth: nextYM,
          periodFilter: { type: 'month', yearMonth: nextYM },
        };
      }),

    setAccounts: (accounts) => set({ accounts }),
    setBoxes: (boxes) => set({ boxes }),
    setTransactions: (transactions) => set({ transactions }),
    setIsDataLoaded: (isDataLoaded) => set({ isDataLoaded }),
    setIsOffline: (isOffline) => set({ isOffline }),

    setAllFamilyData: (data) =>
      set((state) => ({
        familyName: data.familyName !== undefined ? data.familyName : state.familyName,
        familyMembers: data.members !== undefined ? data.members : state.familyMembers,
        boxes: data.boxes !== undefined ? data.boxes : state.boxes,
        accounts: data.accounts !== undefined ? data.accounts : state.accounts,
        transactions: data.transactions !== undefined ? data.transactions : state.transactions,
        initialSetupDone: (data as any).initialSetupDone !== undefined ? (data as any).initialSetupDone : state.initialSetupDone,
        isDataLoaded: true,
      })),
  };
});
