/**
 * types.ts
 * Modelos de dados para o módulo Investidor10 do PartiuInvest
 */

export type AssetType = 'STOCK' | 'FII' | 'CRYPTO' | 'BDR' | 'ETF' | 'FIXED_INCOME' | 'OTHER';

export interface MarketAsset {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  dy?: number;
  pl?: number | null;
  pvp?: number;
  roe?: number | null;
  lastDividend?: number;
  vacancy?: number;
  type: AssetType;
}

export interface CryptoTicker {
  symbol: string;
  ticker: string;
  name: string;
  icon: string;
  priceUsd: number;
  priceBrl: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volumeUsd: number;
  market: 'CRYPTO';
}

export interface MacroRates {
  selic: number;
  cdi: number;
  ipca12m: number;
  ibovespa: {
    points: number;
    change: number;
  };
  usd: number;
  updatedAt: string;
}

export interface InvestmentTransaction {
  id: string;
  date: string;
  ticker: string;
  name?: string;
  type: AssetType;
  operation: 'BUY' | 'SELL' | 'DIVIDEND';
  quantity: number;
  price: number;
  fees?: number;
  broker?: string;
  notes?: string;
}

export interface PortfolioPosition {
  ticker: string;
  name: string;
  type: AssetType;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalCost: number;
  totalCurrentValue: number;
  variationAmount: number;
  variationPercentage: number;
  receivedDividends: number;
  profitAmount: number;
  profitPercentage: number;
  allocationPercentage: number;
  dy?: number;
  yieldOnCost?: number;
  pvp?: number;
  vacancy?: number;
  sector?: string;
  rating?: number;
  targetPct?: number;
  annualEstimatedDividends: number;
}

export interface MonthlyTaxResult {
  yearMonth: string;
  totalSalesStock: number;
  stockProfit: number;
  stockTax: number;
  isStockExempt: boolean;
  fiiProfit: number;
  fiiTax: number;
  cryptoSales: number;
  cryptoProfit: number;
  cryptoTax: number;
  dayTradeProfit: number;
  dayTradeTax: number;
  totalDarfToPay: number;
  accumulatedLosses: {
    stockSwing: number;
    dayTrade: number;
    fii: number;
    crypto: number;
  };
}

export interface AnnualDeclarationItem {
  group: string;
  code: string;
  ticker: string;
  name: string;
  quantity: number;
  averagePrice: number;
  totalCost31Dec: number;
  description: string;
}

export interface AIAdvisorDiagnosis {
  score: number;
  rating: 'Excelente' | 'Boa' | 'Moderada' | 'Arriscada' | 'Desbalanceada';
  summary: string;
  strengths: string[];
  risks: string[];
  rebalanceSuggestions: Array<{
    ticker: string;
    action: 'BUY' | 'HOLD' | 'REDUCE';
    recommendedAmountBrl: number;
    reason: string;
  }>;
  sectorAllocation: Record<string, number>;
  passiveIncomeForecast: {
    monthlyAverageEstimated: number;
    annualYieldEstimated: number;
  };
}
