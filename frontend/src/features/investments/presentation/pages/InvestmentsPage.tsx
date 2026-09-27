import React, { useEffect } from 'react';
import { useAppStore } from '@/features/auth/useAppStore';
import { DashboardPage } from '@/features/dashboard/presentation/pages/DashboardPage';

export const InvestmentsPage: React.FC = () => {
  const { setIsInvestmentsOpen } = useAppStore();

  useEffect(() => {
    setIsInvestmentsOpen(true);
  }, [setIsInvestmentsOpen]);

  return <DashboardPage />;
};
