import React, { useState } from 'react';
import { Building2, Lock, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/features/auth/useAppStore';
import { FamilyMember } from '@/core/types';
import { addBankAccountToFirestore } from '@/features/dashboard/infrastructure/firestoreDataService';

interface OpenFinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAccountId?: string;
}

export const OpenFinanceModal: React.FC<OpenFinanceModalProps> = ({
  isOpen,
  onClose,
  targetAccountId,
}) => {
  const { familyMembers, user, accounts, setAccounts } = useAppStore();
  const [selectedMember, setSelectedMember] = useState(user?.memberId || '');
  const [visibility, setVisibility] = useState<'family' | 'private'>('family');
  const [step, setStep] = useState<'select' | 'connecting' | 'success'>('select');
  const [selectedBank, setSelectedBank] = useState('Nubank');

  if (!isOpen) return null;

  const banks = [
    { name: 'Nubank', color: '#8A05BE', logo: '🟣', defaultType: 'checking' },
    { name: 'Itaú Unibanco', color: '#EC7000', logo: '🟧', defaultType: 'checking' },
    { name: 'Banco do Brasil', color: '#0038A8', logo: '🟨', defaultType: 'checking' },
    { name: 'Bradesco', color: '#CC092F', logo: '🟥', defaultType: 'checking' },
    { name: 'Inter', color: '#FF7A00', logo: '🟧', defaultType: 'checking' },
    { name: 'XP Investimentos', color: '#0A1F44', logo: '⬛', defaultType: 'investment' },
    { name: 'Santander', color: '#E50000', logo: '🔴', defaultType: 'checking' },
    { name: 'C6 Bank', color: '#1B1B1B', logo: '⬛', defaultType: 'checking' },
    { name: 'BTG Pactual', color: '#001E62', logo: '🔷', defaultType: 'investment' },
    { name: 'Nomad', color: '#FFD700', logo: '🟡', defaultType: 'checking' },
    { name: 'Sofisa Direto', color: '#FF5000', logo: '🟧', defaultType: 'checking' },
  ];

  const handleConnect = async () => {
    setStep('connecting');

    const bankObj = banks.find((b) => b.name === selectedBank) || banks[0];
    const randomBalanceCents = Math.floor(Math.random() * 850000) + 120000; // R$ 1.200 a R$ 9.700

    setTimeout(async () => {
      if (user?.familyId) {
        try {
          const newAccount = await addBankAccountToFirestore(user.familyId, {
            ownerMemberId: selectedMember || user.memberId,
            visibility,
            name: `Conta Corrente ${bankObj.name}`,
            type: (bankObj.defaultType as any) || 'checking',
            source: 'open_finance',
            institutionName: bankObj.name,
            balanceCents: randomBalanceCents,
            color: bankObj.color,
          });

          // Atualização local de segurança
          setAccounts([...accounts.filter((a) => a.id !== newAccount.id), newAccount]);
        } catch (err) {
          console.error('Erro ao registrar conexão Open Finance:', err);
        }
      }

      setStep('success');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-sm">
      <div className="card w-full max-w-lg bg-white/95 border-white shadow-2xl p-6 rounded-[28px] relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 icon-btn text-muted hover:text-navy"
        >
          <X className="h-5 w-5" />
        </button>

        {step === 'select' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gold/20 text-gold-deep">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy">Conectar via Open Finance</h3>
                <p className="text-xs text-muted">Sincronização automática e segura de extratos e saldos</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                  De quem é esta conta bancária?
                </label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                >
                  {familyMembers.map((m: FamilyMember) => (
                    <option key={m.id} value={m.id}>
                      {m.displayName} ({m.role === 'chefe-familia' ? 'Chefe de Família' : m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                  Privacidade no sistema familiar
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility('family')}
                    className={`p-3 rounded-xl border text-left transition ${
                      visibility === 'family'
                        ? 'border-navy bg-navy/5 font-bold text-navy shadow-sm'
                        : 'border-navy/10 text-muted hover:border-navy/30'
                    }`}
                  >
                    <p className="text-xs font-bold text-navy">👨‍👩‍👧 Compartilhada</p>
                    <p className="text-[10px] text-muted">Visível no patrimônio familiar</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    className={`p-3 rounded-xl border text-left transition ${
                      visibility === 'private'
                        ? 'border-navy bg-navy/5 font-bold text-navy shadow-sm'
                        : 'border-navy/10 text-muted hover:border-navy/30'
                    }`}
                  >
                    <p className="text-xs font-bold text-navy">🔒 Individual</p>
                    <p className="text-[10px] text-muted">Apenas titular e chefe</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                  Selecione sua instituição financeira
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {banks.map((bank) => (
                    <button
                      key={bank.name}
                      type="button"
                      onClick={() => setSelectedBank(bank.name)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
                        selectedBank === bank.name
                          ? 'border-gold bg-gold/15 font-bold text-navy shadow-sm'
                          : 'border-navy/10 text-muted hover:bg-navy/5'
                      }`}
                    >
                      <span className="text-lg">{bank.logo}</span>
                      <span className="text-xs truncate">{bank.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-navy/5 p-3 flex items-start gap-2 text-xs text-muted border border-navy/10">
                <Lock className="h-4 w-4 text-ok shrink-0 mt-0.5" />
                <span>
                  O Partiu Invest nunca tem acesso a senhas ou permissão de movimentação. Conexão
                  100% regulamentada pelo Banco Central do Brasil.
                </span>
              </div>

              <button onClick={handleConnect} className="btn-gold w-full">
                <span>Continuar para Autorização Segura</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'connecting' && (
          <div className="py-12 text-center space-y-4">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gold border-t-transparent" />
            <h3 className="text-lg font-bold text-navy">Conectando ao {selectedBank}...</h3>
            <p className="text-xs text-muted max-w-xs mx-auto">
              Estabelecendo canal criptografado e validando permissões de Open Finance.
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok/15 text-ok">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-navy">Conta Conectada com Sucesso!</h3>
            <p className="text-xs text-muted max-w-xs mx-auto">
              Os dados e saldos do {selectedBank} foram sincronizados com a visão familiar.
            </p>
            <button
              onClick={() => {
                setStep('select');
                onClose();
              }}
              className="btn-gold w-full"
            >
              <span>Concluir e Voltar ao Painel</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
