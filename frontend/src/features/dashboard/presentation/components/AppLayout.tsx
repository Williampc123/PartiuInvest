import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
// import { OpenFinanceModal } from '@/features/open-finance/presentation/components/OpenFinanceModal';
import { NewTransactionModal } from './NewTransactionModal';
import { InitialSetupModal } from '@/features/family/presentation/components/InitialSetupModal';
import { BudgetSetupModal } from '@/features/budget/presentation/components/BudgetSetupModal';
import { InvestmentsFullScreenModal } from '@/features/investments/presentation/components/InvestmentsFullScreenModal';
import { useAppStore } from '@/features/auth/useAppStore';
import { checkAndGenerateMonthlySalaries } from '@/features/family/infrastructure/salaryService';
import {
  subscribeFamilyData,
  seedInitialFamilyDataIfEmpty,
  FamilyDataState,
} from '../../infrastructure/firestoreDataService';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    familyMembers,
    transactions,
    initialSetupDone,
    isInitialSetupOpen,
    setIsInitialSetupOpen,
    isBudgetSetupOpen,
    setIsBudgetSetupOpen,
    isInvestmentsOpen,
    setIsInvestmentsOpen,
    setAllFamilyData,
  } = useAppStore();

  const [isOpenFinanceOpen, setIsOpenFinanceOpen] = useState(false);
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Redireciona para o login caso não haja usuário logado
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Sincronização centralizada em tempo real com o Firestore para todos os módulos
  useEffect(() => {
    if (!user?.familyId) return;

    seedInitialFamilyDataIfEmpty(user.familyId, user.memberId);

    const unsubscribe = subscribeFamilyData(user.familyId, (data: FamilyDataState) => {
      setAllFamilyData(data);
    });

    return () => unsubscribe();
  }, [user?.familyId, user?.memberId, setAllFamilyData]);

  // Verificação de Primeiro Acesso: Exibir Modal de Configuração Inicial
  useEffect(() => {
    if (!user?.familyId) return;

    const localSetupDone = localStorage.getItem(`partiu_setup_done_${user.familyId}`) === 'true';

    // Se o setup ainda não foi marcado no Firestore nem no LocalStorage
    if (!initialSetupDone && !localSetupDone) {
      // Pequeno timeout para sincronização suave
      const timer = setTimeout(() => {
        setIsInitialSetupOpen(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [user?.familyId, initialSetupDone, setIsInitialSetupOpen]);

  // Virada de Mês / Verificação Automática de Salários
  useEffect(() => {
    if (!user?.familyId || !familyMembers || familyMembers.length === 0) return;

    checkAndGenerateMonthlySalaries(user.familyId, familyMembers, transactions);
  }, [user?.familyId, familyMembers, transactions]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-full p-2.5 pb-28 font-sans text-[15px] leading-[1.45] text-navy antialiased md:p-5 md:pb-5">
      {/* Moldura de Vidro Unificada para toda a Aplicação */}
      <div className="mx-auto grid max-w-[1560px] grid-cols-1 gap-3.5 rounded-[28px] border border-white/80 bg-white/65 p-2 shadow-[0_40px_80px_-40px_rgba(10,31,68,.3),inset_0_1px_0_rgba(255,255,255,.95)] backdrop-blur-[30px] backdrop-saturate-150 md:grid-cols-[78px_minmax(0,1fr)] md:rounded-[38px] md:p-3.5 xl:grid-cols-[252px_minmax(0,1fr)]">
        {/* Menu Lateral Padronizado com Suporte a Mobile Drawer */}
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onOpenOpenFinance={() => setIsOpenFinanceOpen(true)}
          onOpenInvestments={() => setIsInvestmentsOpen(true)}
        />

        {/* Área de Conteúdo */}
        <main className="flex min-w-0 flex-col gap-4 p-1 md:px-1.5">
          {/* Topbar Padronizada com Botão Hambúrguer Mobile */}
          <Header
            onOpenNewTransaction={() => setIsNewTransactionOpen(true)}
            onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          />

          {/* Renderização do Módulo Ativo */}
          <Outlet />
        </main>
      </div>

      {/* Modais Globais */}
      <InvestmentsFullScreenModal
        isOpen={isInvestmentsOpen}
        onClose={() => setIsInvestmentsOpen(false)}
      />

      <InitialSetupModal
        isOpen={isInitialSetupOpen}
        onClose={() => setIsInitialSetupOpen(false)}
      />

      <BudgetSetupModal
        isOpen={isBudgetSetupOpen}
        onClose={() => setIsBudgetSetupOpen(false)}
      />

      {/* Open Finance desativado temporariamente
      <OpenFinanceModal
        isOpen={isOpenFinanceOpen}
        onClose={() => setIsOpenFinanceOpen(false)}
      />
      */}

      <NewTransactionModal
        isOpen={isNewTransactionOpen}
        onClose={() => setIsNewTransactionOpen(false)}
      />
    </div>
  );
};
