import React, { useState, useEffect } from 'react';
import {
  CryptoTicker,
  MacroRates,
  MarketAsset,
  InvestmentTransaction,
  PortfolioPosition,
} from '../../domain/types';
import {
  fetchCryptoMarket,
  fetchMacroRates,
  fetchMarketAssets,
  enrichMarketAssetsWithPortfolioTickers,
  getStoredTransactions,
  saveTransaction,
  deleteTransaction,
  computePortfolioPositions,
} from '../../infrastructure/investmentsService';
import { InvestidorHeader } from './InvestidorHeader';
import { ResumoTab } from './tabs/ResumoTab';
import { PosicoesTab } from './tabs/PosicoesTab';
import { ProventosTab } from './tabs/ProventosTab';
import { PatrimonioTab } from './tabs/PatrimonioTab';
import { RentabilidadeTab } from './tabs/RentabilidadeTab';
import { AnaliseTab } from './tabs/AnaliseTab';
import { LancamentosTab } from './tabs/LancamentosTab';
import { MetasTab } from './tabs/MetasTab';
import { TaxReportTab } from './tabs/TaxReportTab';
import { B3IntegrationTab } from './tabs/B3IntegrationTab';
import { AIAdvisorTab } from './tabs/AIAdvisorTab';
import { AdicionarLancamentoModal } from './modals/AdicionarLancamentoModal';
import { useAppStore } from '@/features/auth/useAppStore';
import Swal from 'sweetalert2';

interface InvestmentsFullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InvestmentsFullScreenModal: React.FC<InvestmentsFullScreenModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAppStore();
  const familyId = user?.familyId || user?.uid || 'fam_default_user';

  const [activeTab, setActiveTab] = useState<string>('resumo');
  const [hideValues, setHideValues] = useState<boolean>(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState<boolean>(false);

  // Estados de Mercado e Carteira Reais
  const [macroRates, setMacroRates] = useState<MacroRates | null>(null);
  const [cryptos, setCryptos] = useState<CryptoTicker[]>([]);
  const [marketAssets, setMarketAssets] = useState<MarketAsset[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [macro, cryptoList, assets, txList] = await Promise.all([
        fetchMacroRates(),
        fetchCryptoMarket(),
        fetchMarketAssets('ALL'),
        getStoredTransactions(familyId),
      ]);
      setMacroRates(macro);
      setCryptos(cryptoList);
      setTransactions(txList);

      // Busca cotações ao vivo de todos os ativos da carteira do usuário
      const enrichedAssets = await enrichMarketAssetsWithPortfolioTickers(txList, assets);
      setMarketAssets(enrichedAssets);
    } catch (err) {
      console.error('Erro ao carregar dados de investimentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, familyId]);

  // Tecla ESC fecha a modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isAddTransactionOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAddTransactionOpen, onClose]);

  // Salvar Nova Transação Real
  const handleSaveTransaction = async (tx: InvestmentTransaction) => {
    await saveTransaction(familyId, tx);
    setTransactions((prev) => [tx, ...prev.filter((t) => t.id !== tx.id)]);
    Swal.fire({
      icon: 'success',
      title: 'Lançamento Registrado!',
      text: `${tx.operation === 'BUY' ? 'Compra' : 'Venda'} de ${tx.quantity} ${tx.ticker} salva no Firebase.`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      background: '#0B0F17',
      color: '#fff',
    });
  };

  // Excluir Transação Real
  const handleDeleteTransaction = async (id: string) => {
    const res = await Swal.fire({
      title: 'Excluir Lançamento?',
      text: 'Esta operação removerá o lançamento da sua carteira.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      background: '#0B0F17',
      color: '#fff',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#374151',
    });

    if (res.isConfirmed) {
      await deleteTransaction(familyId, id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      Swal.fire({
        icon: 'success',
        title: 'Excluído!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        background: '#0B0F17',
        color: '#fff',
      });
    }
  };

  // Importar Transações da B3
  const handleImportB3Transactions = async (importedList: InvestmentTransaction[]) => {
    for (const tx of importedList) {
      await saveTransaction(familyId, tx);
    }
    setTransactions((prev) => [...importedList, ...prev]);
    setActiveTab('resumo');
    Swal.fire({
      icon: 'success',
      title: 'Custódia B3 Sincronizada!',
      text: `${importedList.length} lançamentos integrados na sua carteira.`,
      background: '#0B0F17',
      color: '#fff',
      confirmButtonColor: '#F5B82E',
    });
  };

  const { positions, totalPortfolioValue, totalCostBasis, totalProfitBrl, totalProfitPct } =
    computePortfolioPositions(transactions, marketAssets, cryptos);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B0F17] text-slate-100 font-sans antialiased overflow-hidden animate-in fade-in duration-200">
      {/* 1. Header com Abas e Ações */}
      <InvestidorHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewTransaction={() => setIsAddTransactionOpen(true)}
        onOpenB3Integration={() => setActiveTab('b3')}
        onClose={onClose}
        hideValues={hideValues}
        onToggleHideValues={() => setHideValues((v) => !v)}
      />

      {/* 2. Conteúdo da Aba Ativa */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-[1600px] w-full mx-auto">
        {activeTab === 'resumo' && (
          <ResumoTab
            positions={positions}
            transactions={transactions}
            totalValue={totalPortfolioValue}
            totalCost={totalCostBasis}
            totalProfitBrl={totalProfitBrl}
            totalProfitPct={totalProfitPct}
            hideValues={hideValues}
            onOpenAddModal={() => setIsAddTransactionOpen(true)}
            onOpenB3={() => setActiveTab('b3')}
          />
        )}

        {activeTab === 'posicoes' && (
          <PosicoesTab
            positions={positions}
            totalValue={totalPortfolioValue}
            totalCost={totalCostBasis}
            hideValues={hideValues}
          />
        )}

        {activeTab === 'proventos' && (
          <ProventosTab
            positions={positions}
            transactions={transactions}
            hideValues={hideValues}
          />
        )}

        {activeTab === 'patrimonio' && (
          <PatrimonioTab
            positions={positions}
            transactions={transactions}
            totalValue={totalPortfolioValue}
            totalCost={totalCostBasis}
            totalProfitBrl={totalProfitBrl}
            hideValues={hideValues}
          />
        )}

        {activeTab === 'rentabilidade' && (
          <RentabilidadeTab
            positions={positions}
            transactions={transactions}
            totalValue={totalPortfolioValue}
            totalCost={totalCostBasis}
            totalProfitBrl={totalProfitBrl}
            totalProfitPct={totalProfitPct}
            hideValues={hideValues}
          />
        )}

        {activeTab === 'analise' && (
          <AnaliseTab />
        )}

        {activeTab === 'lancamentos' && (
          <LancamentosTab
            transactions={transactions}
            onOpenAddModal={() => setIsAddTransactionOpen(true)}
            onDeleteTransaction={handleDeleteTransaction}
            hideValues={hideValues}
          />
        )}

        {(activeTab === 'darfs' || activeTab === 'irpf') && (
          <TaxReportTab transactions={transactions} />
        )}

        {activeTab === 'metas' && (
          <MetasTab
            familyId={familyId}
            positions={positions}
            totalPortfolioValue={totalPortfolioValue}
          />
        )}

        {activeTab === 'pro' && (
          <AIAdvisorTab positions={positions} totalPortfolioValue={totalPortfolioValue} />
        )}

        {activeTab === 'b3' && (
          <B3IntegrationTab onImportSuccess={handleImportB3Transactions} />
        )}
      </main>

      {/* 3. Modal de Adicionar Lançamento */}
      <AdicionarLancamentoModal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        onSave={handleSaveTransaction}
      />
    </div>
  );
};
