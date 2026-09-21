import React, { useState } from 'react';
import { useAppStore } from '@/features/auth/useAppStore';
import { Users, UserPlus, Shield, Key, Check, Copy, Sparkles, DollarSign, Calendar } from 'lucide-react';
import { FamilyMember } from '@/core/types';
import { Money } from '@/core/Money';
import { calculateMemberPayday, formatDateBr } from '@/core/dateUtils';

export const FamilyMembersPage: React.FC = () => {
  const { familyMembers, familyName, user, setIsInitialSetupOpen } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'conjuge' | 'filho'>('conjuge');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const token = Math.random().toString(36).substring(2, 15);
    const link = `${window.location.origin}/convite?token=${token}`;
    setGeneratedInviteLink(link);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedInviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/20 text-gold-deep">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy">Gestão da {familyName || 'Família'}</h2>
            <p className="text-xs text-muted">
              Controle de membros, rendas mensais, datas de recebimento e contas compartilhadas.
            </p>
          </div>
        </div>

        {user?.role === 'chefe-familia' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsInitialSetupOpen(true)}
              className="btn-line text-xs h-[38px] px-3.5 gap-1.5 border-gold/40 text-navy font-bold hover:bg-gold/10"
            >
              <Sparkles className="h-4 w-4 text-gold-deep" />
              <span>Configurar Rendas & Salários</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-gold text-xs h-[38px] px-4 gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Convidar Membro</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {familyMembers.map((member: FamilyMember) => {
          const forecastDate = calculateMemberPayday(
            member.paydayType,
            member.payday,
            new Date().getFullYear(),
            new Date().getMonth()
          );

          return (
            <div key={member.id} className="card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="pill text-[11px]"
                    style={{
                      backgroundColor: `${member.color}20`,
                      color: member.color,
                    }}
                  >
                    {member.role === 'chefe-familia'
                      ? '👑 Chefe da Família'
                      : member.role === 'conjuge'
                      ? '💍 Cônjuge'
                      : '🎒 Filho (Perfil Menor)'}
                  </span>
                  <span className="text-[10px] text-ok font-bold bg-ok/10 px-2 py-0.5 rounded-full">
                    {member.status === 'active' ? 'Ativo' : 'Pendente'}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-white text-base shadow-sm overflow-hidden"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      member.displayName?.charAt(0) || member.name?.charAt(0) || 'M'
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-navy">{member.name || member.displayName}</h3>
                    <p className="text-xs text-muted">{member.email || 'Acesso familiar gerenciado'}</p>
                  </div>
                </div>

                {/* Bloco de Renda e Previsão Salarial */}
                <div className="mb-3 p-2.5 rounded-xl bg-navy/[0.03] border border-navy/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-ok" /> Renda Mensal:
                    </span>
                    <b className="text-ok font-bold">
                      {member.monthlyIncomeCents
                        ? Money.formatCents(member.monthlyIncomeCents)
                        : 'Não informada'}
                    </b>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-gold-deep" /> Recebimento:
                    </span>
                    <span className="font-semibold text-navy">
                      {member.paydayType === 'fifth_business_day' || !member.paydayType
                        ? '5º Dia Útil'
                        : `Dia ${member.payday || 5}`}
                    </span>
                  </div>
                  {member.monthlyIncomeCents && member.monthlyIncomeCents > 0 && (
                    <div className="text-[10px] text-muted pt-1 border-t border-navy/10 flex items-center justify-between">
                      <span>Previsão deste mês:</span>
                      <b className="text-navy">{formatDateBr(forecastDate)}</b>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-muted pt-2 border-t border-navy/10">
                  <div className="flex justify-between">
                    <span>Acesso ao total familiar:</span>
                    <span className="font-semibold text-navy">Permitido</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lançamentos individuais:</span>
                    <span className="font-semibold text-navy">Separados</span>
                  </div>
                </div>
              </div>

              {user?.role === 'chefe-familia' && member.role !== 'chefe-familia' && (
                <div className="mt-4 pt-3 border-t border-navy/10 flex justify-end gap-2">
                  <button className="link text-xs text-danger hover:text-red-700">
                    Revogar Acesso
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl bg-navy/5 border border-navy/10 p-4 flex items-start gap-3 text-xs text-muted">
        <Shield className="h-5 w-5 text-navy-soft shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-navy mb-0.5">
            Isolamento de Dados por Coleção Familiar
          </p>
          <p>
            Cada família cadastrada no Partiu Invest possui sua própria partição isolada no
            Firestore (<code className="text-navy font-semibold">families/id_familia</code>).
            Contas marcadas como individuais não expõem detalhes íntimos para dependentes.
          </p>
        </div>
      </div>

      {/* Modal de Convite */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-sm">
          <div className="card w-full max-w-md bg-white p-6 rounded-[28px] relative shadow-2xl">
            <h3 className="text-lg font-bold text-navy mb-1">Convidar Novo Membro</h3>
            <p className="text-xs text-muted mb-4">
              Gere um link exclusivo para cônjuge ou filhos entrarem na família.
            </p>

            {!generatedInviteLink ? (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">
                    Nome ou Apelido do Membro
                  </label>
                  <input
                    type="text"
                    required
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Ex: Maria (Esposa) ou Pedro"
                    className="w-full h-10 px-3 rounded-xl border border-navy/15 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">
                    Grau de Parentesco / Papel
                  </label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as 'conjuge' | 'filho')}
                    className="w-full h-10 px-3 rounded-xl border border-navy/15 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold"
                  >
                    <option value="conjuge">💍 Cônjuge (Acesso a contas e metas familiares)</option>
                    <option value="filho">🎒 Filho / Dependente (Acesso educativo e caixinhas)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-line text-xs h-9 px-3"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-gold text-xs h-9 px-4">
                    Gerar Link de Convite
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-ok/10 border border-ok/20 flex items-center gap-2 text-xs text-ok font-semibold">
                  <Key className="h-4 w-4" /> Link gerado com segurança!
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">
                    Envie este link para o membro:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedInviteLink}
                      className="w-full h-10 px-3 rounded-xl border border-navy/15 bg-navy/5 text-xs text-navy font-mono"
                    />
                    <button
                      onClick={handleCopy}
                      className="btn-gold text-xs h-10 px-3 shrink-0"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setGeneratedInviteLink('');
                    setNewMemberName('');
                  }}
                  className="btn-line w-full text-xs h-9"
                >
                  Concluir
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
