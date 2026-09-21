import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Calendar,
  Sparkles,
  CheckCircle2,
  DollarSign,
  HeartHandshake,
  Check,
  Crown,
} from 'lucide-react';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/firebase';
import { useAppStore } from '@/features/auth/useAppStore';
import { FamilyMember, FamilyRole, PaydayType } from '@/core/types';
import { calculateMemberPayday, formatDateBr } from '@/core/dateUtils';
import { checkAndGenerateMonthlySalaries } from '@/features/family/infrastructure/salaryService';

interface InitialSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MemberFormItem {
  id: string;
  name: string;
  role: FamilyRole;
  monthlyIncomeStr: string;
  paydayType: PaydayType;
  payday: number;
  color: string;
}

export const InitialSetupModal: React.FC<InitialSetupModalProps> = ({ isOpen, onClose }) => {
  const { user, familyName, familyMembers, transactions, setFamilyMembers } = useAppStore();

  const [membersList, setMembersList] = useState<MemberFormItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const roleColors: Record<FamilyRole, string> = {
    'chefe-familia': '#F5B82E',
    'conjuge': '#E2A11B',
    'filho': '#3F6FD8',
  };

  // Inicializa lista de membros a partir dos dados existentes ou padrão inicial
  useEffect(() => {
    if (!isOpen) return;

    if (familyMembers && familyMembers.length > 0) {
      const mapped = familyMembers.map((m) => ({
        id: m.id,
        name: m.name || m.displayName || '',
        role: m.role || 'filho',
        monthlyIncomeStr: m.monthlyIncomeCents
          ? (m.monthlyIncomeCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
          : '',
        paydayType: m.paydayType || 'fifth_business_day',
        payday: m.payday || 5,
        color: m.color || roleColors[m.role] || '#F5B82E',
      }));
      setMembersList(mapped);
    } else if (user) {
      // Cria primeiro item com o Chefe de Família
      setMembersList([
        {
          id: user.memberId || `mem_chefe_${Date.now()}`,
          name: user.displayName || '',
          role: 'chefe-familia',
          monthlyIncomeStr: '',
          paydayType: 'fifth_business_day',
          payday: 5,
          color: '#F5B82E',
        },
      ]);
    }
  }, [isOpen, familyMembers, user]);

  if (!isOpen) return null;

  const handleAddMember = (role: FamilyRole = 'conjuge') => {
    const newId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setMembersList((prev) => [
      ...prev,
      {
        id: newId,
        name: '',
        role,
        monthlyIncomeStr: '',
        paydayType: 'fifth_business_day',
        payday: 5,
        color: roleColors[role] || '#3F6FD8',
      },
    ]);
  };

  const handleRemoveMember = (id: string) => {
    setMembersList((prev) => prev.filter((m) => m.id !== id));
  };

  const handleUpdateMember = (id: string, updates: Partial<MemberFormItem>) => {
    setMembersList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const parseMoneyToCents = (valStr: string): number => {
    if (!valStr) return 0;
    const cleanStr = valStr.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : Math.round(num * 100);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.familyId) return;

    setErrorMsg('');
    setLoading(true);

    try {
      const batch = writeBatch(db);
      const updatedFamilyMembers: FamilyMember[] = [];

      for (const item of membersList) {
        if (!item.name.trim()) continue;

        const monthlyIncomeCents = parseMoneyToCents(item.monthlyIncomeStr);
        const memberRef = doc(db, `families/${user.familyId}/members`, item.id);

        const memberData: FamilyMember = {
          id: item.id,
          role: item.role,
          name: item.name.trim(),
          displayName: item.name.trim().split(' ')[0],
          color: item.color,
          isMinor: item.role === 'filho',
          status: 'active',
          monthlyIncomeCents,
          paydayType: item.paydayType,
          payday: item.paydayType === 'fixed_day' ? item.payday : 5,
          createdAt: new Date().toISOString(),
        };

        if (item.role === 'chefe-familia' && user.uid) {
          memberData.authUid = user.uid;
        }

        batch.set(memberRef, memberData, { merge: true });
        updatedFamilyMembers.push(memberData);
      }

      // Marcar configuração inicial como concluída na família
      const familyRef = doc(db, 'families', user.familyId);
      batch.set(familyRef, { initialSetupDone: true, updatedAt: new Date().toISOString() }, { merge: true });

      await batch.commit();

      // Atualizar local storage para marcar setup completo
      localStorage.setItem(`partiu_setup_done_${user.familyId}`, 'true');

      // Atualizar estado global
      setFamilyMembers(updatedFamilyMembers);

      // Gerar automaticamente as receitas salariais previstas no Firestore para o mês vigente
      await checkAndGenerateMonthlySalaries(user.familyId, updatedFamilyMembers, transactions);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Erro ao salvar configuração inicial:', err);
      setErrorMsg(err?.message || 'Erro ao salvar os membros da família.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-deep/65 backdrop-blur-md animate-in fade-in duration-200">
      <div className="card w-full max-w-2xl bg-white border-white/95 shadow-[0_40px_80px_-20px_rgba(10,31,68,.35)] p-5 sm:p-7 rounded-[32px] relative max-h-[92vh] flex flex-col">
        
        {/* Cabeçalho */}
        <div className="flex items-start gap-3.5 pb-4 border-b border-navy/10">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-gold-light to-gold text-navy-deep shadow-md shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="pill bg-gold/20 text-gold-deep text-[11px] font-bold py-0.5 px-2.5 mb-1 inline-flex items-center gap-1">
              ✨ Configuração Inicial
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-navy leading-tight">
              Família & Rendas Mensais
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Cadastre as pessoas da sua família, suas rendas e o dia do salário. O sistema lançará a previsão de receita automaticamente todo mês!
            </p>
          </div>
        </div>

        {/* Mensagens de feedback */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-danger/10 text-danger border border-danger/20 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {success ? (
          <div className="py-14 text-center space-y-3 flex-1 flex flex-col items-center justify-center">
            <div className="h-16 w-16 place-items-center rounded-full bg-ok/15 text-ok grid animate-bounce">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h3 className="text-xl font-bold text-navy">Família Configurada com Sucesso!</h3>
            <p className="text-xs text-muted max-w-sm">
              As rendas e previsões salariais foram cadastradas e refletidas no seu painel.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
            {/* Lista de Membros com Scroll */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {membersList.map((m, index) => {
                const currentForecast = calculateMemberPayday(
                  m.paydayType,
                  m.payday,
                  new Date().getFullYear(),
                  new Date().getMonth()
                );

                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl border border-navy/10 bg-navy/[0.02] hover:bg-navy/[0.04] transition-all space-y-3.5 relative"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: m.color }}
                        >
                          {m.role === 'chefe-familia' ? <Crown className="h-4 w-4" /> : index + 1}
                        </span>
                        <b className="text-sm font-bold text-navy">
                          {m.role === 'chefe-familia'
                            ? '👑 Chefe de Família (Você)'
                            : m.role === 'conjuge'
                            ? '💍 Cônjuge'
                            : '🎒 Filho / Dependente'}
                        </b>
                      </div>

                      {m.role !== 'chefe-familia' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.id)}
                          className="text-muted hover:text-danger p-1 rounded-lg transition"
                          title="Remover pessoa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Nome */}
                      <div>
                        <label className="block text-xs font-bold text-navy mb-1">
                          Nome da Pessoa
                        </label>
                        <input
                          type="text"
                          required
                          value={m.name}
                          onChange={(e) => handleUpdateMember(m.id, { name: e.target.value })}
                          placeholder="Ex: Lucas, Maria, Pedro..."
                          className="w-full h-10 px-3 rounded-xl border border-navy/15 bg-white text-xs sm:text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                        />
                      </div>

                      {/* Renda Mensal */}
                      <div>
                        <label className="block text-xs font-bold text-navy mb-1 flex items-center justify-between">
                          <span>Renda Líquida Mensal</span>
                          <span className="text-[10px] text-muted">Salário / Proventos</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                            R$
                          </span>
                          <input
                            type="text"
                            placeholder="0,00"
                            value={m.monthlyIncomeStr}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.,]/g, '');
                              handleUpdateMember(m.id, { monthlyIncomeStr: val });
                            }}
                            className="w-full h-10 pl-9 pr-3 rounded-xl border border-navy/15 bg-white text-xs sm:text-sm font-bold text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dia de Recebimento do Salário */}
                    <div className="p-3 rounded-xl bg-white border border-navy/10 space-y-2.5">
                      <label className="block text-xs font-bold text-navy flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gold-deep" />
                        <span>Quando esta pessoa recebe normalmente seu salário?</span>
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Opção 1: 5º dia útil */}
                        <button
                          type="button"
                          onClick={() => handleUpdateMember(m.id, { paydayType: 'fifth_business_day' })}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition flex items-center justify-between ${
                            m.paydayType === 'fifth_business_day'
                              ? 'border-gold-deep bg-gold/15 text-navy-deep font-bold ring-2 ring-gold/40'
                              : 'border-navy/15 bg-white text-muted hover:border-navy/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                              m.paydayType === 'fifth_business_day' ? 'border-gold-deep bg-gold text-navy' : 'border-navy/30'
                            }`}>
                              {m.paydayType === 'fifth_business_day' && <Check className="h-3 w-3 stroke-[3]" />}
                            </span>
                            <span>⭐ 5º Dia Útil</span>
                          </div>
                          <span className="text-[10px] text-gold-deep font-bold">Padrão CLT</span>
                        </button>

                        {/* Opção 2: Dia fixo do mês */}
                        <button
                          type="button"
                          onClick={() => handleUpdateMember(m.id, { paydayType: 'fixed_day' })}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition flex items-center justify-between ${
                            m.paydayType === 'fixed_day'
                              ? 'border-gold-deep bg-gold/15 text-navy-deep font-bold ring-2 ring-gold/40'
                              : 'border-navy/15 bg-white text-muted hover:border-navy/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                              m.paydayType === 'fixed_day' ? 'border-gold-deep bg-gold text-navy' : 'border-navy/30'
                            }`}>
                              {m.paydayType === 'fixed_day' && <Check className="h-3 w-3 stroke-[3]" />}
                            </span>
                            <span>📅 Dia Fixo do Mês</span>
                          </div>
                        </button>
                      </div>

                      {/* Seletor de dia fixo */}
                      {m.paydayType === 'fixed_day' && (
                        <div className="pt-1 flex items-center gap-2">
                          <span className="text-xs text-navy font-semibold">Dia do mês:</span>
                          <select
                            value={m.payday}
                            onChange={(e) => handleUpdateMember(m.id, { payday: Number(e.target.value) })}
                            className="h-8 px-3 rounded-lg border border-navy/20 bg-white text-xs font-bold text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                          >
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                              <option key={d} value={d}>
                                Dia {d}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Badge da previsão calculada */}
                      <div className="flex items-center gap-1.5 text-[11px] text-navy-soft font-medium pt-1">
                        <Sparkles className="h-3 w-3 text-gold-deep" />
                        <span>
                          Previsão para este mês:{' '}
                          <b className="text-navy font-bold">{formatDateBr(currentForecast)}</b>
                          {m.paydayType === 'fifth_business_day' && ' (5º dia útil)'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Botões para Adicionar Outras Pessoas */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleAddMember('conjuge')}
                  className="btn-line text-xs h-9 px-3 gap-1.5 border-dashed border-navy/25 hover:border-gold hover:text-gold-deep"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>+ Adicionar Cônjuge</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddMember('filho')}
                  className="btn-line text-xs h-9 px-3 gap-1.5 border-dashed border-navy/25 hover:border-gold hover:text-gold-deep"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>+ Adicionar Filho / Dependente</span>
                </button>
              </div>
            </div>

            {/* Rodapé de Ações */}
            <div className="pt-4 border-t border-navy/10 flex flex-col sm:flex-row items-center justify-between gap-3 mt-auto">
              <span className="text-[11px] text-muted text-center sm:text-left">
                💡 Você poderá ajustar esses valores a qualquer momento em <b>Minha Família</b>.
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-line text-xs h-10 px-4 flex-1 sm:flex-none"
                >
                  Configurar Depois
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold text-xs h-10 px-6 font-bold flex-1 sm:flex-none shadow-md"
                >
                  {loading ? 'Salvando...' : 'Salvar & Concluir'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
