import React from 'react';
import { useAppStore } from '@/features/auth/useAppStore';
import { Money } from '@/core/Money';
import { BankAccount } from '@/core/types';
import { TrendingUp, ShieldCheck } from 'lucide-react';

export const NetWorthCard: React.FC = () => {
  const { accounts, selectedMemberId } = useAppStore();

  const filteredAccounts = selectedMemberId === 'all'
    ? accounts
    : accounts.filter((acc: BankAccount) => acc.ownerMemberId === selectedMemberId);

  const totalCents = filteredAccounts.reduce((acc: number, curr: BankAccount) => acc + curr.balanceCents, 0);

  return (
    <div className="card relative overflow-hidden flex flex-col justify-between">
      <div className="absolute -right-8 -top-8 -z-10 h-32 w-32 rounded-full bg-gold/30 blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Patrimônio Total {selectedMemberId === 'all' ? '(Família)' : '(Individual)'}
          </span>
          <span className="pill bg-ok/15 text-ok border border-ok/30 text-[11px]">
            <TrendingUp className="h-3 w-3" /> +4.2% este mês
          </span>
        </div>

        <div className="mt-3">
          <div className="text-3xl lg:text-4xl font-extrabold text-navy tracking-tight">
            {Money.formatCents(totalCents)}
          </div>
          <p className="mt-1 text-xs text-muted">
            Soma de contas correntes, caixinhas e investimentos sincronizados.
          </p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-navy/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-navy font-semibold">
          <ShieldCheck className="h-4 w-4 text-ok" />
          <span>3 Bancos Conectados via Open Finance</span>
        </div>
        <span className="text-muted">Atualizado em tempo real</span>
      </div>
    </div>
  );
};
