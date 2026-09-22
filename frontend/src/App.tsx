import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/presentation/pages/LoginPage';
import { AppLayout } from './features/dashboard/presentation/components/AppLayout';
import { DashboardPage } from './features/dashboard/presentation/pages/DashboardPage';
import { FamilyMembersPage } from './features/family/presentation/pages/FamilyMembersPage';
import { BoxesPage } from './features/boxes/presentation/pages/BoxesPage';
import { AccountsPage } from './features/accounts/presentation/pages/AccountsPage';
import { TransactionsPage } from './features/transactions/presentation/pages/TransactionsPage';
import { CategoriesPage } from './features/categories/presentation/pages/CategoriesPage';
import { LearningPage } from './features/learning/presentation/pages/LearningPage';
import { useAppStore } from './features/auth/useAppStore';

export const App: React.FC = () => {
  const { setIsOffline } = useAppStore();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOffline]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        
        {/* Layout compartilhado com Menu Lateral e Topbar idênticos */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/boxes" element={<BoxesPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/family" element={<FamilyMembersPage />} />
          <Route path="/learning" element={<LearningPage />} />
          {/* Redirecionamento amigável */}
          <Route path="/movimentacoes" element={<Navigate to="/transactions" replace />} />
          <Route path="/categorias" element={<Navigate to="/categories" replace />} />
          <Route path="/contas" element={<Navigate to="/accounts" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
