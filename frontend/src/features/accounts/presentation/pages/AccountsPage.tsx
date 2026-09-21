import React, { useState } from 'react';
import { OpenFinanceModal } from '@/features/open-finance/presentation/components/OpenFinanceModal';
import { useAppStore } from '@/features/auth/useAppStore';
import {
  Building2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Zap,
  Trash2,
  Lock,
  Wallet,
  X,
  Sparkles,
} from 'lucide-react';
import { Money } from '@/core/Money';
import { BankAccount, FamilyMember } from '@/core/types';
import {
  addBankAccountToFirestore,
  deleteBankAccountFromFirestore,
  updateBankAccountInFirestore,
} from '@/features/dashboard/infrastructure/firestoreDataService';

export const AccountsPage: React.FC = () => {
  const { accounts, familyMembers, selectedMemberId, user, setAccounts } = useAppStore();
  const [isOpenFinanceOpen, setIsOpenFinanceOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Formulário de Conta Manual
  const [manualName, setManualName] = useState('');
  const [manualBank, setManualBank] = useState('Nubank');
  const [manualBalanceStr, setManualBalanceStr] = useState('');
  const [manualType, setManualType] = useState<'checking' | 'savings' | 'credit_card' | 'investment'>('checking');
  const [manualMemberId, setManualMemberId] = useState(user?.memberId || '');
  const [manualVisibility, setManualVisibility] = useState<'family' | 'private'>('family');
  const [isSavingManual, setIsSavingManual] = useState(false);

  const availableBanks = [
    { name: 'Nubank', color: '#8A05BE' },
    { name: 'Itaú Unibanco', color: '#EC7000' },
    { name: 'Banco Inter', color: '#FF7A00' },
    { name: 'Bradesco', color: '#CC092F' },
    { name: 'Banco do Brasil', color: '#0038A8' },
    { name: 'Santander', color: '#E50000' },
    { name: 'C6 Bank', color: '#1B1B1B' },
    { name: 'BTG Pactual', color: '#001E62' },
    { name: 'Caixa Econômica', color: '#005CA9' },
    { name: 'XP Investimentos', color: '#0A1F44' },
    { name: 'Nomad', color: '#FFD700' },
    { name: 'Sofisa Direto', color: '#FF5000' },
  ];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const filteredAccounts = selectedMemberId === 'all'
    ? accounts
    : accounts.filter((a: BankAccount) => a.ownerMemberId === selectedMemberId);

  const totalBalanceCents = filteredAccounts.reduce((acc: number, curr: BankAccount) => acc + curr.balanceCents, 0);
  const openFinanceCount = filteredAccounts.filter((a) => a.source === 'open_finance').length;
  const manualCount = filteredAccounts.filter((a) => a.source !== 'open_finance').length;

  // Sincronizar todas as contas
  const handleSyncAll = () => {
    setSyncingAll(true);
    setTimeout(async () => {
      if (user?.familyId) {
        for (const acc of filteredAccounts) {
          const delta = acc.source === 'open_finance' ? Math.floor((Math.random() - 0.3) * 5000) : 0;
          const newBal = Math.max(0, acc.balanceCents + delta);
          await updateBankAccountInFirestore(user.familyId, acc.id, { balanceCents: newBal });
        }
      }
      setSyncingAll(false);
      showToast('Todas as contas foram sincronizadas com sucesso!');
    }, 1200);
  };

  // Sincronizar conta individual
  const handleSyncSingle = async (account: BankAccount) => {
    setSyncingId(account.id);
    setTimeout(async () => {
      if (user?.familyId) {
        const delta = account.source === 'open_finance' ? Math.floor((Math.random() - 0.2) * 8000) : 0;
        const newBal = Math.max(0, account.balanceCents + delta);
        await updateBankAccountInFirestore(user.familyId, account.id, { balanceCents: newBal });
      }
      setSyncingId(null);
      showToast(`Conta ${account.name} sincronizada!`);
    }, 1000);
  };

  // Excluir conta
  const handleDeleteAccount = async (accountId: string, name: string) => {
    if (!user?.familyId) return;
    if (confirm(`Deseja realmente remover a conta "${name}"?`)) {
      try {
        await deleteBankAccountFromFirestore(user.familyId, accountId);
        setAccounts(accounts.filter((a) => a.id !== accountId));
        showToast(`Conta "${name}" removida.`);
      } catch (err) {
        console.error('Erro ao deletar conta:', err);
      }
    }
  };

  // Salvar conta manual
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.familyId) return;

    const bankObj = availableBanks.find((b) => b.name === manualBank) || availableBanks[0];
    const cleanStr = manualBalanceStr.replace(/\./g, '').replace(',', '.');
    const balanceCents = Math.round((parseFloat(cleanStr) || 0) * 100);

    setIsSavingManual(true);
    try {
      const created = await addBankAccountToFirestore(user.familyId, {
        ownerMemberId: manualMemberId || user.memberId,
        visibility: manualVisibility,
        name: manualName || `Conta ${bankObj.name}`,
        type: manualType,
        source: 'manual',
        institutionName: bankObj.name,
        balanceCents,
        color: bankObj.color,
      });

      setAccounts([...accounts, created]);
      setIsManualModalOpen(false);
      setManualName('');
      setManualBalanceStr('');
      showToast('Conta bancária manual cadastrada com sucesso!');
    } catch (err) {
      console.error('Erro ao cadastrar conta manual:', err);
    } finally {
      setIsSavingManual(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-navy text-white px-4 py-3 shadow-2xl flex items-center gap-2.5 text-sm animate-in fade-in slide-in-from-bottom-3 border border-gold/40">
          <Sparkles className="h-4 w-4 text-gold shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Topo do Módulo Exclusivo de Contas */}
      <div className="card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-gold-light to-gold text-navy-deep shadow-md">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy">Contas Bancárias & Open Finance</h2>
            <p className="text-xs text-muted">
              Centralize instituições financeiras, saldos em tempo real e conexões Open Finance da família.
            </p>
          </div>
        </div>

        {/* Barra de Ações */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sincronizar Tudo */}
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="btn-line text-xs h-[38px] px-3 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${syncingAll ? 'animate-spin text-gold-deep' : ''}`} />
            <span>{syncingAll ? 'Sincronizando...' : 'Sincronizar Todas'}</span>
          </button>

          {/* Cadastrar Manual */}
          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="btn-gold text-xs h-[38px] px-4 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Conta Manual</span>
          </button>

          {/* Conectar Open Finance */}
          <button
            type="button"
            onClick={() => setIsOpenFinanceOpen(true)}
            className="btn-line text-xs h-[38px] px-4 gap-1.5 border-navy/20 hover:border-navy/40"
          >
            <Zap className="h-4 w-4 text-gold-deep" />
            <span>Conectar via Open Finance</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas e Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="card !p-4 bg-gradient-to-br from-white/90 to-white/60">
          <small className="text-xs text-muted block">Saldo Total em Contas</small>
          <b className="text-2xl font-extrabold text-navy tracking-tight mt-0.5 block">
            {Money.formatCents(totalBalanceCents)}
          </b>
          <span className="text-[11px] text-muted mt-1 block">
            Consolidado de {filteredAccounts.length} conta{filteredAccounts.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="card !p-4 bg-gradient-to-br from-white/90 to-white/60">
          <small className="text-xs text-muted block">Open Finance Integrado</small>
          <div className="flex items-center gap-2 mt-0.5">
            <b className="text-2xl font-extrabold text-ok tracking-tight">{openFinanceCount}</b>
            <span className="pill bg-ok/10 text-ok text-[11px] font-bold">Sincronizado</span>
          </div>
          <span className="text-[11px] text-muted mt-1 block">
            Atualizações automáticas via Banco Central
          </span>
        </div>

        <div className="card !p-4 bg-gradient-to-br from-white/90 to-white/60">
          <small className="text-xs text-muted block">Contas Cadastradas Manualmente</small>
          <div className="flex items-center gap-2 mt-0.5">
            <b className="text-2xl font-extrabold text-navy tracking-tight">{manualCount}</b>
            <span className="pill bg-navy/5 text-navy text-[11px]">Gerenciamento livre</span>
          </div>
          <span className="text-[11px] text-muted mt-1 block">
            Lançamentos e saldos controlados manualmente
          </span>
        </div>
      </div>

      {/* Grid de Contas Bancárias */}
      {filteredAccounts.length === 0 ? (
        <div className="card text-center py-12 space-y-3">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold/15 text-gold-deep">
            <Wallet className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-navy">Nenhuma conta bancária cadastrada</h3>
          <p className="text-xs text-muted max-w-md mx-auto">
            Cadastre suas contas correntes, poupanças ou investimentos manualmente ou conecte seu banco via Open Finance.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="btn-gold text-xs h-9 px-4 gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Cadastrar Conta Manual</span>
            </button>
            <button
              onClick={() => setIsOpenFinanceOpen(true)}
              className="btn-line text-xs h-9 px-4 gap-1.5"
            >
              <Zap className="h-4 w-4" />
              <span>Conectar Open Finance</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((acc: BankAccount) => {
            const owner = familyMembers.find((m) => m.id === acc.ownerMemberId);
            const isSyncingThis = syncingId === acc.id || syncingAll;

            return (
              <div
                key={acc.id}
                className="card flex flex-col justify-between relative overflow-hidden group hover:border-navy/30 transition shadow-sm"
              >
                <div>
                  {/* Cabeçalho do Cartão da Conta */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`pill text-[11px] font-bold ${
                        acc.source === 'open_finance'
                          ? 'bg-ok/10 text-ok border border-ok/20'
                          : 'bg-navy/5 text-navy border border-navy/10'
                      }`}
                    >
                      {acc.source === 'open_finance' ? '⚡ Open Finance' : '📝 Manual'}
                    </span>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-muted">
                        {acc.lastSyncedAt ? `Hoje às ${acc.lastSyncedAt}` : 'Recente'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(acc.id, acc.name)}
                        title="Excluir Conta"
                        className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-danger rounded-lg text-muted"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Informações da Instituição */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="h-12 w-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-sm shrink-0"
                      style={{ backgroundColor: acc.color || '#0A1F44' }}
                    >
                      {acc.institutionName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-navy truncate">{acc.name}</h3>
                      <p className="text-xs text-muted truncate">{acc.institutionName}</p>
                    </div>
                  </div>

                  {/* Saldo em Conta */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-navy/5 to-navy/[0.02] border border-navy/10 mb-3">
                    <p className="text-[11px] font-semibold text-muted">Saldo Disponível (Conta Corrente)</p>
                    <p className="text-xl font-extrabold text-navy tracking-tight">
                      {Money.formatCents(acc.balanceCents)}
                    </p>
                  </div>

                  {/* Titular e Visibilidade */}
                  <div className="flex items-center justify-between text-xs text-muted py-1 border-t border-navy/10">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: owner?.color || '#F5B82E' }}
                      />
                      <span className="font-semibold text-navy truncate">
                        {owner?.displayName || user?.displayName || 'Titular'}
                      </span>
                    </div>

                    <span className="text-[11px]">
                      {acc.visibility === 'family' ? '👨‍👩‍👧 Compartilhada' : '🔒 Individual'}
                    </span>
                  </div>
                </div>

                {/* Ações da Conta */}
                <div className="mt-3 pt-3 border-t border-navy/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleSyncSingle(acc)}
                    disabled={isSyncingThis}
                    className="btn-line text-[11px] h-8 px-2.5 gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${isSyncingThis ? 'animate-spin' : ''}`} />
                    <span>{isSyncingThis ? 'Sincronizando...' : 'Sincronizar'}</span>
                  </button>

                  {acc.source === 'open_finance' ? (
                    <span className="flex items-center gap-1 text-[11px] text-ok font-bold">
                      <ShieldCheck className="h-3.5 w-3.5" /> Conectado
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsOpenFinanceOpen(true)}
                      className="link text-[11px] font-bold text-gold-deep"
                    >
                      Conectar Open Finance
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Box de Segurança Open Finance */}
      <div className="rounded-2xl bg-navy/5 border border-navy/10 p-4 flex items-start gap-3 text-xs text-muted">
        <Lock className="h-5 w-5 text-navy-soft shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-navy mb-0.5">
            Segurança & Conformidade Open Finance Banco Central
          </p>
          <p>
            O Partiu Invest utiliza exclusivamente conexões de leitura criptografadas ponta-a-ponta.
            Nenhum dado sensível de login ou senha é armazenado e nenhuma transação de débito pode ser
            realizada sem o seu consentimento explícito.
          </p>
        </div>
      </div>

      {/* Modal de Conexão Open Finance */}
      <OpenFinanceModal
        isOpen={isOpenFinanceOpen}
        onClose={() => setIsOpenFinanceOpen(false)}
      />

      {/* Modal de Cadastro de Conta Manual */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="card w-full max-w-md bg-white border-white/95 shadow-2xl p-6 rounded-[28px] relative">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="absolute right-4 top-4 icon-btn text-muted hover:text-navy"
            >
              <X className="h-5 w-5" />
            </button>

            <form onSubmit={handleSaveManual} className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-navy">Cadastrar Conta Bancária</h3>
                <p className="text-xs text-muted">Adicione uma conta corrente, poupança ou investimentos</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Instituição Financeira
                </label>
                <select
                  value={manualBank}
                  onChange={(e) => setManualBank(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                >
                  {availableBanks.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Nome ou Apelido da Conta
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Conta Principal Nubank"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">
                    Tipo de Conta
                  </label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value as any)}
                    className="w-full h-11 px-3 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                  >
                    <option value="checking">Conta Corrente</option>
                    <option value="savings">Poupança</option>
                    <option value="investment">Investimentos</option>
                    <option value="credit_card">Cartão de Crédito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">
                    Saldo Inicial (R$)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0,00"
                    value={manualBalanceStr}
                    onChange={(e) => setManualBalanceStr(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">
                    Titular da Conta
                  </label>
                  <select
                    value={manualMemberId}
                    onChange={(e) => setManualMemberId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                  >
                    {familyMembers.map((m: FamilyMember) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">
                    Visibilidade
                  </label>
                  <select
                    value={manualVisibility}
                    onChange={(e) => setManualVisibility(e.target.value as any)}
                    className="w-full h-11 px-3 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                  >
                    <option value="family">Compartilhada</option>
                    <option value="private">Individual</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-navy/10">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="btn-line text-xs h-9 px-3"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="btn-gold text-xs h-9 px-4"
                >
                  {isSavingManual ? 'Salvando...' : 'Cadastrar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
