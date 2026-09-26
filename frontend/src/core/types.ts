export type FamilyRole = 'chefe-familia' | 'conjuge' | 'filho';

export interface UserProfile {
  uid: string;
  familyId: string;
  memberId: string;
  role: FamilyRole;
  displayName: string;
  email: string;
  avatarUrl?: string;
  color?: string;
  isMinor?: boolean;
}

export type PaydayType = 'fifth_business_day' | 'fixed_day';

export interface FamilyMember {
  id: string;
  authUid?: string;
  role: FamilyRole;
  name: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  color: string;
  isMinor: boolean;
  status: 'active' | 'invited' | 'revoked';
  monthlyIncomeCents?: number;
  paydayType?: PaydayType;
  payday?: number;
  createdAt?: string;
}

export interface BankAccount {
  id: string;
  ownerMemberId: string;
  visibility: 'family' | 'private';
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'investment';
  source: 'manual' | 'open_finance' | 'ofx';
  institutionName: string;
  balanceCents: number;
  color: string;
  lastSyncedAt?: string;
}

export interface BoxCategory {
  id: string;
  name: string;
  label: string;
  icon: string;
  color: string;
  defaultName?: string;
  isCustom?: boolean;
}

export interface BoxGoal {
  id: string;
  ownerMemberId: string;
  visibility: 'family' | 'private';
  name: string;
  category: string;
  targetAmountCents: number;
  currentBalanceCents: number;
  targetDate?: string;
  color: string;
  icon?: string;
}

export interface FinancialCategory {
  id: string;
  name: string;
  type: 'expense' | 'income' | 'both';
  icon: string;
  color?: string;
  isCustom?: boolean;
  createdAt?: string;
}

export interface FinancialTransaction {
  id: string;
  accountId: string;
  memberId: string;
  visibility: 'family' | 'private';
  description: string;
  amountCents: number;
  category: string;
  date: string;
  type?: 'income' | 'expense' | 'bill';
  isRecurring?: boolean;
  recurrenceFrequency?: 'mensal' | 'semanal' | 'quinzenal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
  recurrenceEndMonth?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  isPaid?: boolean;
  source: 'manual' | 'open_finance';
  createdAt?: string;
}

