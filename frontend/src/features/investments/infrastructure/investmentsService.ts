/**
 * investmentsService.ts
 * Serviço de comunicação com a API Node.js e Firebase Firestore para o módulo de Investimentos
 */

import {
  AssetType,
  CryptoTicker,
  MacroRates,
  MarketAsset,
  InvestmentTransaction,
  PortfolioPosition,
  MonthlyTaxResult,
  AnnualDeclarationItem,
  AIAdvisorDiagnosis,
} from '../domain/types';
import { db } from '@/infrastructure/firebase/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { KNOWN_DIVIDENDS_CATALOG, getCustodyOnDate } from './dividendService';

export interface InvestmentGoal {
  id: string;
  type: 'patrimonio' | 'ativos' | 'proventos';
  title: string;
  category?: string;
  targetAmount: number;
  monthlyDeposit?: number;
  annualRate?: number;
  currentAmount?: number;
  assetType?: string;
  ticker?: string;
  selectedAssetTypes?: string[];
  createdAt?: string;
}

const getEnv = (key: string, fallback: string) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {}
  return fallback;
};

const API_BASE =
  (getEnv('VITE_API_BASE_URL', '') ? `${getEnv('VITE_API_BASE_URL', '')}/v1/investments` : '') ||
  (getEnv('VITE_API_URL', '') ? `${getEnv('VITE_API_URL', '')}/v1/investments` : '') ||
  'http://localhost:3333/v1/investments';

// Catálogo abrangente para busca e autocomplete instantâneo
export const POPULAR_TICKERS_CATALOG: {
  ticker: string;
  name: string;
  type: AssetType;
  defaultPrice: number;
  category: string;
}[] = [
  // Ações B3
  { ticker: 'PETR4', name: 'Petrobras PN', type: 'STOCK', defaultPrice: 56.00, category: 'Ações' },
  { ticker: 'PETR3', name: 'Petrobras ON', type: 'STOCK', defaultPrice: 58.50, category: 'Ações' },
  { ticker: 'VALE3', name: 'Vale ON', type: 'STOCK', defaultPrice: 67.90, category: 'Ações' },
  { ticker: 'ITUB4', name: 'Itaú Unibanco PN', type: 'STOCK', defaultPrice: 34.20, category: 'Ações' },
  { ticker: 'BBDC4', name: 'Bradesco PN', type: 'STOCK', defaultPrice: 17.83, category: 'Ações' },
  { ticker: 'BBDC3', name: 'Bradesco ON', type: 'STOCK', defaultPrice: 15.76, category: 'Ações' },
  { ticker: 'BBAS3', name: 'Banco do Brasil ON', type: 'STOCK', defaultPrice: 21.61, category: 'Ações' },
  { ticker: 'WEGE3', name: 'WEG ON', type: 'STOCK', defaultPrice: 52.40, category: 'Ações' },
  { ticker: 'TAEE11', name: 'Taesa Unit', type: 'STOCK', defaultPrice: 40.93, category: 'Ações' },
  { ticker: 'TAEE3', name: 'Taesa ON', type: 'STOCK', defaultPrice: 15.31, category: 'Ações' },
  { ticker: 'TAEE4', name: 'Taesa PN', type: 'STOCK', defaultPrice: 13.78, category: 'Ações' },
  { ticker: 'CMIG4', name: 'Cemig PN', type: 'STOCK', defaultPrice: 10.90, category: 'Ações' },
  { ticker: 'CMIG3', name: 'Cemig ON', type: 'STOCK', defaultPrice: 18.41, category: 'Ações' },
  { ticker: 'CSMG3', name: 'Copasa ON', type: 'STOCK', defaultPrice: 57.95, category: 'Ações' },
  { ticker: 'GGBR3', name: 'Gerdau ON', type: 'STOCK', defaultPrice: 21.10, category: 'Ações' },
  { ticker: 'LEVE3', name: 'Mahle Metal Leve', type: 'STOCK', defaultPrice: 33.51, category: 'Ações' },
  { ticker: 'BBSE3', name: 'BB Seguridade ON', type: 'STOCK', defaultPrice: 39.01, category: 'Ações' },
  { ticker: 'CPLE6', name: 'Copel PNB', type: 'STOCK', defaultPrice: 9.85, category: 'Ações' },
  { ticker: 'ELET3', name: 'Eletrobras ON', type: 'STOCK', defaultPrice: 41.50, category: 'Ações' },
  { ticker: 'MGLU3', name: 'Magazine Luiza ON', type: 'STOCK', defaultPrice: 10.20, category: 'Ações' },
  { ticker: 'RENT3', name: 'Localiza ON', type: 'STOCK', defaultPrice: 45.30, category: 'Ações' },
  { ticker: 'PRIO3', name: 'PRIO ON', type: 'STOCK', defaultPrice: 46.10, category: 'Ações' },
  { ticker: 'KLBN11', name: 'Klabin Unit', type: 'STOCK', defaultPrice: 21.60, category: 'Ações' },
  { ticker: 'SUZB3', name: 'Suzano ON', type: 'STOCK', defaultPrice: 55.40, category: 'Ações' },

  // FIIs (Fundos Imobiliários)
  { ticker: 'MXRF11', name: 'Maxi Renda FII', type: 'FII', defaultPrice: 9.09, category: 'FIIs' },
  { ticker: 'HGLG11', name: 'CSHG Logística FII', type: 'FII', defaultPrice: 147.88, category: 'FIIs' },
  { ticker: 'KNCR11', name: 'Kinea Rendimentos FII', type: 'FII', defaultPrice: 102.50, category: 'FIIs' },
  { ticker: 'XPML11', name: 'XP Malls FII', type: 'FII', defaultPrice: 98.68, category: 'FIIs' },
  { ticker: 'XPLG11', name: 'XP Log FII', type: 'FII', defaultPrice: 92.54, category: 'FIIs' },
  { ticker: 'VISC11', name: 'Vinci Shopping Centers', type: 'FII', defaultPrice: 103.74, category: 'FIIs' },
  { ticker: 'BTLG11', name: 'BTG Pactual Logística', type: 'FII', defaultPrice: 101.40, category: 'FIIs' },
  { ticker: 'CPTS11', name: 'Capitânia Securities FII', type: 'FII', defaultPrice: 7.95, category: 'FIIs' },
  { ticker: 'TGAR11', name: 'TG Ativo Real FII', type: 'FII', defaultPrice: 119.50, category: 'FIIs' },
  { ticker: 'RURA11', name: 'Itaú Asset Rural Fiagro', type: 'FII', defaultPrice: 8.09, category: 'FIIs' },
  { ticker: 'SNAG11', name: 'Suno Agro Fiagro', type: 'FII', defaultPrice: 9.82, category: 'FIIs' },
  { ticker: 'SNEL11', name: 'Suno Energias Limpas', type: 'FII', defaultPrice: 8.04, category: 'FIIs' },
  { ticker: 'CACR11', name: 'Cartesia FII', type: 'FII', defaultPrice: 15.00, category: 'FIIs' },
  { ticker: 'VSLH11', name: 'Versalhes Recebíveis FII', type: 'FII', defaultPrice: 1.63, category: 'FIIs' },

  // Criptomoedas
  { ticker: 'BTC', name: 'Bitcoin', type: 'CRYPTO', defaultPrice: 350162.0, category: 'Criptomoedas' },
  { ticker: 'ETH', name: 'Ethereum', type: 'CRYPTO', defaultPrice: 18966.0, category: 'Criptomoedas' },
  { ticker: 'SOL', name: 'Solana', type: 'CRYPTO', defaultPrice: 840.39, category: 'Criptomoedas' },
  { ticker: 'BNB', name: 'Binance Coin', type: 'CRYPTO', defaultPrice: 3229.12, category: 'Criptomoedas' },
  { ticker: 'USDT', name: 'Tether USD', type: 'CRYPTO', defaultPrice: 5.45, category: 'Criptomoedas' },
  { ticker: 'XRP', name: 'Ripple', type: 'CRYPTO', defaultPrice: 3.15, category: 'Criptomoedas' },
  { ticker: 'ADA', name: 'Cardano', type: 'CRYPTO', defaultPrice: 2.10, category: 'Criptomoedas' },

  // Stocks & BDRs
  { ticker: 'AAPL34', name: 'Apple Inc BDR', type: 'BDR', defaultPrice: 62.50, category: 'Stocks' },
  { ticker: 'NVDC34', name: 'Nvidia Corp BDR', type: 'BDR', defaultPrice: 14.80, category: 'Stocks' },
  { ticker: 'MSFT34', name: 'Microsoft BDR', type: 'BDR', defaultPrice: 88.20, category: 'Stocks' },
  { ticker: 'GOGL34', name: 'Alphabet Google BDR', type: 'BDR', defaultPrice: 65.40, category: 'Stocks' },
  { ticker: 'AMZO34', name: 'Amazon BDR', type: 'BDR', defaultPrice: 52.80, category: 'Stocks' },
  { ticker: 'TSLA34', name: 'Tesla BDR', type: 'BDR', defaultPrice: 42.10, category: 'Stocks' },
  { ticker: 'IVVB11', name: 'iShares S&P 500 ETF', type: 'ETF', defaultPrice: 345.00, category: 'ETFs Intern.' },
];

export async function fetchLiveAssetQuote(
  ticker: string,
  targetDateStr?: string
): Promise<{
  ticker: string;
  name: string;
  price: number;
  type: AssetType;
  category: string;
} | null> {
  if (!ticker || !ticker.trim()) return null;
  const cleanTicker = ticker.trim().toUpperCase();

  // 1. Tentar endpoint da API Node.js (que consulta Yahoo / Brapi no backend sem restrições de CORS)
  const candidateUrls = [
    targetDateStr
      ? `${API_BASE}/market/quote/${cleanTicker}?date=${encodeURIComponent(targetDateStr)}`
      : `${API_BASE}/market/quote/${cleanTicker}`,
    targetDateStr
      ? `/v1/investments/market/quote/${cleanTicker}?date=${encodeURIComponent(targetDateStr)}`
      : `/v1/investments/market/quote/${cleanTicker}`,
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        headers: getAuthHeader(),
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.price) {
          return {
            ticker: cleanTicker,
            name: json.data.name || cleanTicker,
            price: Number(json.data.price),
            type: json.data.type || 'STOCK',
            category: json.data.type === 'FII' ? 'FIIs' : json.data.type === 'CRYPTO' ? 'Criptomoedas' : 'Ações',
          };
        }
      }
    } catch {}
  }

  // 2. Para criptomoedas, Binance é 100% pública e suporta CORS no browser
  if (['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE'].includes(cleanTicker)) {
    try {
      const bRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${cleanTicker}USDT`, {
        signal: AbortSignal.timeout(3000),
      });
      if (bRes.ok) {
        const bData: any = await bRes.json();
        const priceBrl = parseFloat(bData.price) * 5.45;
        return {
          ticker: cleanTicker,
          name: cleanTicker,
          price: Number(priceBrl.toFixed(2)),
          type: 'CRYPTO',
          category: 'Criptomoedas',
        };
      }
    } catch {}
  }

  // 3. Fallback seguro no catálogo local pré-carregado
  const localMatch = POPULAR_TICKERS_CATALOG.find((m) => m.ticker === cleanTicker);
  if (localMatch) {
    return {
      ticker: localMatch.ticker,
      name: localMatch.name,
      price: localMatch.defaultPrice,
      type: localMatch.type,
      category: localMatch.category,
    };
  }

  return null;
}

export async function searchMarketTickers(
  searchTerm: string,
  targetDateStr?: string
): Promise<typeof POPULAR_TICKERS_CATALOG> {
  if (!searchTerm || searchTerm.trim().length === 0) return [];
  const term = searchTerm.trim().toUpperCase();

  // 1. Busca no catálogo local instantâneo
  const localMatches = POPULAR_TICKERS_CATALOG.filter(
    (item) => item.ticker.includes(term) || item.name.toUpperCase().includes(term)
  );

  // 2. Se o usuário digitou um ticker com pelo menos 3 caracteres, busca a cotação oficial da data
  if (term.length >= 3) {
    try {
      const live = await fetchLiveAssetQuote(term, targetDateStr);
      if (live && live.price > 0) {
        const matchIdx = localMatches.findIndex((m) => m.ticker === live.ticker);
        if (matchIdx >= 0) {
          localMatches[matchIdx] = {
            ...localMatches[matchIdx],
            defaultPrice: live.price,
            name: live.name,
          };
        } else {
          localMatches.unshift({
            ticker: live.ticker,
            name: live.name,
            type: live.type,
            defaultPrice: live.price,
            category: live.category,
          });
        }
      }
    } catch {}
  }

  return localMatches;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('partiu_jwt_token') || 'demo_token';
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// 1. Criptomoedas da Binance ao Vivo
export async function fetchCryptoMarket(): Promise<CryptoTicker[]> {
  try {
    const res = await fetch(`${API_BASE}/market/crypto`, {
      headers: getAuthHeader(),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) return json.data;
    }
  } catch {}

  // Fallback direto na Binance API pública se o backend local não estiver rodando
  try {
    const symbols = '["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","ADAUSDT","DOGEUSDT","AVAXUSDT","LINKUSDT","DOTUSDT"]';
    const directRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbols)}`);
    if (directRes.ok) {
      const tickers: any[] = await directRes.json();
      const meta: Record<string, { name: string; ticker: string; icon: string }> = {
        BTCUSDT: { name: 'Bitcoin', ticker: 'BTC', icon: '₿' },
        ETHUSDT: { name: 'Ethereum', ticker: 'ETH', icon: 'Ξ' },
        SOLUSDT: { name: 'Solana', ticker: 'SOL', icon: '◎' },
        BNBUSDT: { name: 'BNB', ticker: 'BNB', icon: '🟡' },
        XRPUSDT: { name: 'XRP', ticker: 'XRP', icon: '✕' },
        ADAUSDT: { name: 'Cardano', ticker: 'ADA', icon: '₳' },
        DOGEUSDT: { name: 'Dogecoin', ticker: 'DOGE', icon: 'Ð' },
        AVAXUSDT: { name: 'Avalanche', ticker: 'AVAX', icon: '🔺' },
        LINKUSDT: { name: 'Chainlink', ticker: 'LINK', icon: '🔗' },
        DOTUSDT: { name: 'Polkadot', ticker: 'DOT', icon: '●' },
      };

      return tickers.map((t) => {
        const p = meta[t.symbol] || { name: t.symbol, ticker: t.symbol, icon: '🪙' };
        const priceUsd = parseFloat(t.lastPrice || '0');
        return {
          symbol: t.symbol,
          ticker: p.ticker,
          name: p.name,
          icon: p.icon,
          priceUsd,
          priceBrl: priceUsd * 5.45,
          change24h: parseFloat(t.priceChangePercent || '0'),
          high24h: parseFloat(t.highPrice || '0'),
          low24h: parseFloat(t.lowPrice || '0'),
          volumeUsd: parseFloat(t.quoteVolume || '0'),
          market: 'CRYPTO' as const,
        };
      });
    }
  } catch {}

  return [];
}

// 2. Indicadores Macroeconômicos (Selic, CDI, IPCA, Ibovespa, Dólar)
export async function fetchMacroRates(): Promise<MacroRates> {
  try {
    const res = await fetch(`${API_BASE}/market/indices`, { headers: getAuthHeader() });
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch {}

  return {
    selic: 10.50,
    cdi: 10.40,
    ipca12m: 4.25,
    ibovespa: { points: 132600, change: 0.72 },
    usd: 5.45,
    updatedAt: new Date().toISOString(),
  };
}

/// 3. Ações e FIIs do Mercado Aberto
export async function fetchMarketAssets(type: 'STOCKS' | 'FIIS' | 'ALL' = 'ALL'): Promise<MarketAsset[]> {
  try {
    const res = await fetch(`${API_BASE}/market/assets?type=${type}`, { headers: getAuthHeader() });
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) return json.data;
    }
  } catch {}

  const defaultAssets: MarketAsset[] = [
    // Ações
    { ticker: 'CSMG3', name: 'Copasa ON', sector: 'Saneamento', price: 57.95, change: 1.25, dy: 3.44, pl: 6.8, pvp: 1.12, type: 'STOCK' },
    { ticker: 'PETR4', name: 'Petrobras PN', sector: 'Petróleo e Gás', price: 47.97, change: 0.85, dy: 7.54, pl: 4.8, pvp: 1.05, type: 'STOCK' },
    { ticker: 'ITSA4', name: 'Itaúsa PN', sector: 'Holdings / Bancos', price: 14.00, change: 0.45, dy: 8.18, pl: 6.5, pvp: 1.15, type: 'STOCK' },
    { ticker: 'VALE3', name: 'Vale ON', sector: 'Mineração', price: 70.80, change: -0.35, dy: 7.93, pl: 5.9, pvp: 1.22, type: 'STOCK' },
    { ticker: 'GGBR3', name: 'Gerdau ON', sector: 'Siderurgia', price: 21.10, change: 0.15, dy: 3.74, pl: 7.2, pvp: 0.92, type: 'STOCK' },
    { ticker: 'LEVE3', name: 'Mahle Metal Leve', sector: 'Auto / Peças', price: 33.51, change: 0.60, dy: 8.51, pl: 7.8, pvp: 1.85, type: 'STOCK' },
    { ticker: 'CMIG4', name: 'Cemig PN', sector: 'Energia Elétrica', price: 10.90, change: -0.20, dy: 12.40, pl: 5.4, pvp: 1.08, type: 'STOCK' },
    { ticker: 'BBSE3', name: 'BB Seguridade ON', sector: 'Seguros', price: 39.01, change: 0.70, dy: 11.63, pl: 8.9, pvp: 5.80, type: 'STOCK' },
    { ticker: 'BBAS3', name: 'Banco do Brasil ON', sector: 'Financeiro / Bancos', price: 21.61, change: -0.80, dy: 3.16, pl: 4.2, pvp: 0.78, type: 'STOCK' },
    { ticker: 'BBDC4', name: 'Bradesco PN', sector: 'Financeiro / Bancos', price: 17.83, change: 0.50, dy: 8.70, pl: 8.2, pvp: 1.05, type: 'STOCK' },
    { ticker: 'BBDC3', name: 'Bradesco ON', sector: 'Financeiro / Bancos', price: 15.76, change: 0.40, dy: 8.97, pl: 7.9, pvp: 0.98, type: 'STOCK' },
    { ticker: 'TAEE11', name: 'Taesa Unit', sector: 'Energia Elétrica', price: 40.93, change: 0.30, dy: 7.37, pl: 9.2, pvp: 1.75, type: 'STOCK' },
    { ticker: 'TAEE4', name: 'Taesa PN', sector: 'Energia Elétrica', price: 13.78, change: 0.25, dy: 8.72, pl: 9.1, pvp: 1.74, type: 'STOCK' },
    { ticker: 'ITUB4', name: 'Itaú Unibanco PN', sector: 'Financeiro / Bancos', price: 34.20, change: 0.88, dy: 7.20, pl: 7.9, pvp: 1.62, type: 'STOCK' },
    { ticker: 'WEGE3', name: 'WEG ON', sector: 'Bens Industriais', price: 52.40, change: 2.15, dy: 1.80, pl: 32.5, pvp: 9.20, type: 'STOCK' },

    // FIIs
    { ticker: 'RURA11', name: 'Itaú Asset Rural Fiagro', sector: 'Fiagro / Agro', price: 8.09, change: 0.89, dy: 16.66, pvp: 0.79, lastDividend: 0.11, vacancy: 0.0, type: 'FII' },
    { ticker: 'VISC11', name: 'Vinci Shopping Centers', sector: 'Shopping Centers', price: 103.74, change: 3.66, dy: 9.60, pvp: 0.90, lastDividend: 0.82, vacancy: 6.0, type: 'FII' },
    { ticker: 'SNAG11', name: 'Suno Agro Fiagro', sector: 'Fiagro / Agro', price: 9.82, change: 4.41, dy: 16.09, pvp: 0.97, lastDividend: 0.12, vacancy: 0.0, type: 'FII' },
    { ticker: 'XPML11', name: 'XP Malls FII', sector: 'Shopping Centers', price: 98.68, change: -3.93, dy: 11.19, pvp: 0.90, lastDividend: 0.92, vacancy: 4.9, type: 'FII' },
    { ticker: 'HGLG11', name: 'CSHG Logística', sector: 'Logística / Galpões', price: 147.88, change: -3.04, dy: 9.02, pvp: 0.89, lastDividend: 1.10, vacancy: 2.9, type: 'FII' },
    { ticker: 'SNEL11', name: 'Suno Energias Limpas', sector: 'Energia / Infra', price: 8.04, change: -7.53, dy: 14.93, pvp: 0.83, lastDividend: 0.10, vacancy: 0.0, type: 'FII' },
    { ticker: 'MXRF11', name: 'Maxi Renda FII', sector: 'Papel / CRIs', price: 9.09, change: -7.81, dy: 13.15, pvp: 0.98, lastDividend: 0.10, vacancy: 0.0, type: 'FII' },
    { ticker: 'XPLG11', name: 'XP Log FII', sector: 'Logística / Galpões', price: 92.54, change: -2.23, dy: 10.63, pvp: 0.88, lastDividend: 0.82, vacancy: 8.8, type: 'FII' },
    { ticker: 'CACR11', name: 'Cartesia FII', sector: 'Papel / CRIs', price: 15.00, change: -84.56, dy: 69.00, pvp: 0.16, lastDividend: 1.50, vacancy: 0.0, type: 'FII' },
    { ticker: 'KNCR11', name: 'Kinea Rendimentos', sector: 'Papel / CDI', price: 102.50, change: 0.15, dy: 11.80, pvp: 1.01, lastDividend: 1.00, vacancy: 0.0, type: 'FII' },
    { ticker: 'BTLG11', name: 'BTG Pactual Logística', sector: 'Logística', price: 101.40, change: 0.10, dy: 9.40, pvp: 0.99, lastDividend: 0.78, vacancy: 2.0, type: 'FII' },
  ];

  if (type === 'STOCKS') return defaultAssets.filter((a) => a.type === 'STOCK');
  if (type === 'FIIS') return defaultAssets.filter((a) => a.type === 'FII');
  return defaultAssets;
}

export async function enrichMarketAssetsWithPortfolioTickers(
  txList: InvestmentTransaction[],
  existingAssets: MarketAsset[]
): Promise<MarketAsset[]> {
  if (!txList || txList.length === 0) return existingAssets;
  const uniqueTickers = Array.from(new Set(txList.map((t) => t.ticker.toUpperCase().trim()))).filter(
    (t) => !['WIN', 'WDO', 'IND', 'DOL'].some((p) => t.startsWith(p))
  );

  const existingMap = new Map(existingAssets.map((a) => [a.ticker.toUpperCase(), a]));
  const missingTickers = uniqueTickers.filter((t) => !existingMap.has(t));

  if (missingTickers.length === 0) return existingAssets;

  const quotePromises = missingTickers.map(async (ticker) => {
    try {
      const quote = await fetchLiveAssetQuote(ticker);
      if (quote && quote.price > 0) {
        return {
          ticker: quote.ticker,
          name: quote.name,
          sector: quote.category || 'Geral',
          price: quote.price,
          change: 0,
          dy: quote.type === 'FII' ? 12.0 : 8.0,
          type: (quote.type as AssetType) || 'STOCK',
        } as MarketAsset;
      }
    } catch {}
    return null;
  });

  const results = await Promise.allSettled(quotePromises);
  const newAssets = [...existingAssets];

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      newAssets.push(r.value);
    }
  }

  return newAssets;
}

// 4. Firestore: Transações Reais da Família/Usuário
export async function getStoredTransactions(familyId: string): Promise<InvestmentTransaction[]> {
  if (!familyId) return [];

  try {
    const txRef = collection(db, 'families', familyId, 'investment_transactions');
    const q = query(txRef, orderBy('date', 'desc'));
    const snap = await getDocs(q);
    const list: InvestmentTransaction[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
    if (list.length > 0) {
      localStorage.setItem(`partiu_invest_txs_${familyId}`, JSON.stringify(list));
      return list;
    }
  } catch (err) {
    console.error('Erro ao buscar transações do Firestore:', err);
  }

  // Fallback LocalStorage exclusivo do usuário (sem dados falsos pré-carregados)
  const cached = localStorage.getItem(`partiu_invest_txs_${familyId}`);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  return [];
}

export async function saveTransaction(familyId: string, transaction: InvestmentTransaction): Promise<void> {
  if (!familyId) return;

  try {
    const txRef = doc(db, 'families', familyId, 'investment_transactions', transaction.id);
    await setDoc(txRef, transaction, { merge: true });
  } catch (err) {
    console.error('Erro ao salvar transação no Firestore:', err);
  }

  const current = await getStoredTransactions(familyId);
  const updated = [transaction, ...current.filter((t) => t.id !== transaction.id)];
  localStorage.setItem(`partiu_invest_txs_${familyId}`, JSON.stringify(updated));
}

export async function deleteTransaction(familyId: string, id: string): Promise<void> {
  if (!familyId) return;

  try {
    const txRef = doc(db, 'families', familyId, 'investment_transactions', id);
    await deleteDoc(txRef);
  } catch (err) {
    console.error('Erro ao remover transação no Firestore:', err);
  }

  const current = await getStoredTransactions(familyId);
  const updated = current.filter((t) => t.id !== id);
  localStorage.setItem(`partiu_invest_txs_${familyId}`, JSON.stringify(updated));
}

// 5. Firestore: Metas Reais da Carteira
export async function getStoredGoals(familyId: string): Promise<InvestmentGoal[]> {
  if (!familyId) return [];

  try {
    const goalsRef = collection(db, 'families', familyId, 'investment_goals');
    const snap = await getDocs(goalsRef);
    const list: InvestmentGoal[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
    if (list.length > 0) {
      localStorage.setItem(`partiu_invest_goals_${familyId}`, JSON.stringify(list));
      return list;
    }
  } catch (err) {
    console.error('Erro ao buscar metas do Firestore:', err);
  }

  const cached = localStorage.getItem(`partiu_invest_goals_${familyId}`);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  return [];
}

export async function saveGoal(familyId: string, goal: InvestmentGoal): Promise<void> {
  if (!familyId) return;

  try {
    const goalRef = doc(db, 'families', familyId, 'investment_goals', goal.id);
    await setDoc(goalRef, goal, { merge: true });
  } catch (err) {
    console.error('Erro ao salvar meta no Firestore:', err);
  }

  const current = await getStoredGoals(familyId);
  const updated = [goal, ...current.filter((g) => g.id !== goal.id)];
  localStorage.setItem(`partiu_invest_goals_${familyId}`, JSON.stringify(updated));
}

export async function deleteGoal(familyId: string, id: string): Promise<void> {
  if (!familyId) return;

  try {
    const goalRef = doc(db, 'families', familyId, 'investment_goals', id);
    await deleteDoc(goalRef);
  } catch (err) {
    console.error('Erro ao excluir meta no Firestore:', err);
  }

  const current = await getStoredGoals(familyId);
  const updated = current.filter((g) => g.id !== id);
  localStorage.setItem(`partiu_invest_goals_${familyId}`, JSON.stringify(updated));
}

// 6. Consolidação de Carteira a partir das Transações Reais
export function computePortfolioPositions(
  transactions: InvestmentTransaction[],
  marketAssets: MarketAsset[],
  cryptoTickers: CryptoTicker[]
): {
  positions: PortfolioPosition[];
  totalPortfolioValue: number;
  totalCostBasis: number;
  totalVariationBrl: number;
  totalVariationPct: number;
  totalReceivedDividends: number;
  totalProfitBrl: number;
  totalProfitPct: number;
} {
  if (!transactions || transactions.length === 0) {
    return {
      positions: [],
      totalPortfolioValue: 0,
      totalCostBasis: 0,
      totalVariationBrl: 0,
      totalVariationPct: 0,
      totalReceivedDividends: 0,
      totalProfitBrl: 0,
      totalProfitPct: 0,
    };
  }

  const map: Record<
    string,
    {
      quantity: number;
      totalCost: number;
      type: any;
      ticker: string;
      name?: string;
      receivedDividends: number;
      buyLots: Array<{ date: string; quantity: number; price: number }>;
    }
  > = {};

  // Ordena cronologicamente para calcular o preço médio e proventos corretos
  const sorted = [...transactions].sort((a, b) => (a.date > b.date ? 1 : -1));

  for (const t of sorted) {
    const tickerKey = t.ticker.toUpperCase().trim();
    if (!map[tickerKey]) {
      map[tickerKey] = {
        quantity: 0,
        totalCost: 0,
        type: t.type || 'STOCK',
        ticker: tickerKey,
        name: t.name || tickerKey,
        receivedDividends: 0,
        buyLots: [],
      };
    }
    const item = map[tickerKey];
    if (t.operation === 'BUY') {
      item.quantity += t.quantity;
      item.totalCost += t.quantity * t.price + (t.fees || 0);
      item.buyLots.push({ date: t.date || new Date().toISOString().split('T')[0], quantity: t.quantity, price: t.price });
    } else if (t.operation === 'SELL') {
      const avg = item.quantity > 0 ? item.totalCost / item.quantity : 0;
      item.quantity = Math.max(0, item.quantity - t.quantity);
      item.totalCost = item.quantity * avg;
    } else if (t.operation === 'DIVIDEND') {
      // Provento recebido no ativo (dividendo, jcp ou rendimento)
      const divAmount = t.quantity > 1 && t.price > 0 && t.price < 50 ? t.quantity * t.price : (t.price || t.quantity || 0);
      item.receivedDividends += divAmount;
    }
  }

  let totalPortfolioValue = 0;
  let totalCostBasis = 0;
  let totalReceivedDividends = 0;
  const tempPositions: any[] = [];
  const now = new Date();

  for (const [ticker, item] of Object.entries(map)) {
    if (item.quantity <= 0.000001 && item.receivedDividends <= 0.000001) continue;

    const averagePrice = item.quantity > 0 ? item.totalCost / item.quantity : 0;
    let currentPrice = averagePrice;
    let name = item.name || ticker;
    let dy = 0;
    let pvp = 1.0;
    let vacancy = 0;
    let sector = 'Geral';

    // Fallback de métricas para quando a API de cotação não retornar indicadores secundários
    const fallbackAssetMetrics: Record<string, { price?: number; dy?: number; pvp?: number; vacancy?: number }> = {
      BBAS3: { price: 21.61, dy: 3.16, pvp: 0.78 },
      BBDC3: { price: 15.76, dy: 8.97, pvp: 0.98 },
      BBDC4: { price: 17.83, dy: 8.70, pvp: 1.05 },
      BBSE3: { price: 39.01, dy: 11.63, pvp: 5.80 },
      CMIG4: { price: 10.90, dy: 12.40, pvp: 1.08 },
      CSMG3: { price: 57.95, dy: 3.44, pvp: 1.12 },
      GGBR3: { price: 21.10, dy: 3.74, pvp: 0.92 },
      ITSA4: { price: 14.00, dy: 8.18, pvp: 1.15 },
      LEVE3: { price: 33.51, dy: 8.51, pvp: 1.85 },
      PETR4: { price: 47.97, dy: 7.54, pvp: 1.05 },
      TAEE11: { price: 40.93, dy: 7.37, pvp: 1.75 },
      TAEE4: { price: 13.78, dy: 7.27, pvp: 1.74 },
      VALE3: { price: 70.80, dy: 7.93, pvp: 1.22 },
      CACR11: { price: 15.00, dy: 69.00, pvp: 0.16, vacancy: 0.0 },
      HGLG11: { price: 147.88, dy: 9.02, pvp: 0.89, vacancy: 2.9 },
      KNCR11: { price: 102.50, dy: 11.80, pvp: 1.01, vacancy: 0.0 },
      MXRF11: { price: 9.09, dy: 13.15, pvp: 0.98, vacancy: 0.0 },
      RURA11: { price: 8.09, dy: 16.66, pvp: 0.79, vacancy: 0.0 },
      SNAG11: { price: 9.82, dy: 16.09, pvp: 0.97, vacancy: 0.0 },
      SNEL11: { price: 8.04, dy: 14.93, pvp: 0.83, vacancy: 0.0 },
      VISC11: { price: 103.74, dy: 9.60, pvp: 0.90, vacancy: 6.0 },
      XPLG11: { price: 92.54, dy: 10.63, pvp: 0.88, vacancy: 8.8 },
      XPML11: { price: 98.68, dy: 11.19, pvp: 0.90, vacancy: 4.9 },
      BTLG11: { price: 101.40, dy: 9.40, pvp: 0.99, vacancy: 2.0 },
    };

    if (item.type === 'CRYPTO') {
      const foundCrypto = cryptoTickers.find(
        (c) => c.ticker.toUpperCase() === ticker || c.symbol.toUpperCase().startsWith(ticker)
      );
      if (foundCrypto) {
        currentPrice = foundCrypto.priceBrl;
        name = foundCrypto.name;
        dy = 0;
      }
    } else {
      const foundMarket = marketAssets.find((m) => m.ticker.toUpperCase() === ticker);
      if (foundMarket) {
        currentPrice = foundMarket.price;
        name = foundMarket.name;
        dy = foundMarket.dy || 0;
        pvp = foundMarket.pvp || 1.0;
        vacancy = foundMarket.vacancy || 0;
        sector = foundMarket.sector || 'Geral';
      }

      // Aplica fallback apenas se faltar cotação ao vivo ou indicadores
      if (fallbackAssetMetrics[ticker]) {
        const fm = fallbackAssetMetrics[ticker];
        if (dy === 0 && fm.dy !== undefined) dy = fm.dy;
        if ((currentPrice === 0 || currentPrice === averagePrice) && fm.price !== undefined) {
          currentPrice = fm.price;
        }
        if (pvp === 1.0 && fm.pvp !== undefined) pvp = fm.pvp;
        if (vacancy === 0 && fm.vacancy !== undefined) vacancy = fm.vacancy;
      }
    }

    const totalCurrentValue = item.quantity * currentPrice;
    const variationAmount = totalCurrentValue - item.totalCost;
    const variationPercentage = item.totalCost > 0 ? (variationAmount / item.totalCost) * 100 : 0;

    // Proventos recebidos: soma das transações reais e eventos de proventos com base na Data COM
    let receivedDividends = item.receivedDividends;
    if (receivedDividends <= 0 && item.quantity > 0) {
      // 1. Tentar calcular exatamente a partir do catálogo oficial com Data COM
      const knownEvents = KNOWN_DIVIDENDS_CATALOG[ticker] || [];
      const todayIso = new Date().toISOString().slice(0, 10);
      let calculatedFromCatalog = 0;

      for (const ev of knownEvents) {
        if (ev.paymentDate <= todayIso) {
          const qtyOnCom = getCustodyOnDate(transactions, ticker, ev.dateCom);
          if (qtyOnCom > 0) {
            calculatedFromCatalog += qtyOnCom * ev.rate;
          }
        }
      }

      if (calculatedFromCatalog > 0) {
        receivedDividends = Number(calculatedFromCatalog.toFixed(2));
      } else if (dy > 0) {
        // Fallback secundário baseado no histórico de custódia
        let accumulatedFromHoldings = 0;
        for (const lot of item.buyLots) {
          const buyDate = new Date(lot.date);
          const months = Math.max(
            1,
            (now.getFullYear() - buyDate.getFullYear()) * 12 + (now.getMonth() - buyDate.getMonth())
          );
          const monthlyYieldPerShare = (averagePrice * (dy / 100)) / 12;
          accumulatedFromHoldings += Math.min(lot.quantity, item.quantity) * monthlyYieldPerShare * months;
        }
        receivedDividends = Number(accumulatedFromHoldings.toFixed(2));
      }
    }

    // Fórmula canônica Investidor 10: Lucro Total = Variação de Capital + Proventos Recebidos
    const profitAmount = variationAmount + receivedDividends;
    const profitPercentage = item.totalCost > 0 ? (profitAmount / item.totalCost) * 100 : 0;

    // Fórmula exata do Investidor 10: Yield On Cost = (currentPrice * (dy / 100) / averagePrice) * 100
    const yieldOnCost = averagePrice > 0 ? ((currentPrice * (dy / 100)) / averagePrice) * 100 : 0;
    const annualEstimatedDividends = totalCurrentValue * (dy / 100);

    totalPortfolioValue += totalCurrentValue;
    totalCostBasis += item.totalCost;
    totalReceivedDividends += receivedDividends;

    tempPositions.push({
      ticker,
      name,
      type: item.type,
      quantity: item.quantity,
      averagePrice,
      currentPrice,
      totalCost: item.totalCost,
      totalCurrentValue,
      variationAmount,
      variationPercentage,
      receivedDividends,
      profitAmount,
      profitPercentage,
      yieldOnCost,
      pvp,
      vacancy,
      sector,
      rating: 10,
      dy,
      annualEstimatedDividends,
      allocationPercentage: 0,
    });
  }

  const positions: PortfolioPosition[] = tempPositions.map((pos) => ({
    ...pos,
    allocationPercentage: totalPortfolioValue > 0 ? (pos.totalCurrentValue / totalPortfolioValue) * 100 : 0,
  }));

  const totalVariationBrl = totalPortfolioValue - totalCostBasis;
  const totalVariationPct = totalCostBasis > 0 ? (totalVariationBrl / totalCostBasis) * 100 : 0;
  const totalProfitBrl = totalVariationBrl + totalReceivedDividends;
  const totalProfitPct = totalCostBasis > 0 ? (totalProfitBrl / totalCostBasis) * 100 : 0;

  return {
    positions,
    totalPortfolioValue,
    totalCostBasis,
    totalVariationBrl,
    totalVariationPct,
    totalReceivedDividends,
    totalProfitBrl,
    totalProfitPct,
  };
}

// 7. Agrupamento Real por Classes de Ativos
export interface RealAssetClassGroup {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  count: number;
  totalValue: number;
  totalCost: number;
  variationBrl: number;
  variationPct: number;
  totalDividends: number;
  profitBrl: number;
  returnPct: number;
  currentPct: number;
  targetPct: number;
  color: string;
  items: {
    ticker: string;
    name: string;
    qty: number;
    subType: string;
    avgPrice: number;
    curPrice: number;
    variationPct: number;
    returnPct: number;
    vacancy: number;
    total: number;
    receivedDividends: number;
    pvp: number;
    dy: number;
    yieldOnCost: number;
    rating: number;
    currentPct: number;
    targetPct: number;
    shouldBuy: boolean;
  }[];
}

export function groupPositionsByClass(
  positions: PortfolioPosition[],
  totalPortfolioValue: number
): RealAssetClassGroup[] {
  if (!positions || positions.length === 0) return [];

  const classConfigs: Record<string, { name: string; icon: string; iconColor: string; color: string; targetPct: number }> = {
    STOCK: { name: 'Ações', icon: 'S', iconColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', color: '#34D399', targetPct: 20 },
    FII: { name: 'FIIs', icon: '🏢', iconColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/30', color: '#C084FC', targetPct: 20 },
    BDR: { name: 'BDRs', icon: '🌎', iconColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', color: '#FDBA74', targetPct: 15 },
    STOCK_US: { name: 'Stocks', icon: '🌎$', iconColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', color: '#FDBA74', targetPct: 15 },
    REIT: { name: 'Reits', icon: '🏢$', iconColor: 'bg-teal-500/20 text-teal-400 border border-teal-500/30', color: '#A7F3D0', targetPct: 10 },
    ETF: { name: 'ETFs', icon: '🌐', iconColor: 'bg-pink-500/20 text-pink-400 border border-pink-500/30', color: '#F472B6', targetPct: 10 },
    FIXED_INCOME: { name: 'Renda Fixa', icon: '📈', iconColor: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30', color: '#FDE68A', targetPct: 10 },
    CRYPTO: { name: 'Criptomoedas', icon: '₿', iconColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', color: '#60A5FA', targetPct: 0 },
    OTHER: { name: 'Outros', icon: '📁', iconColor: 'bg-slate-500/20 text-slate-400 border border-slate-500/30', color: '#94A3B8', targetPct: 0 },
  };

  const groups: Record<string, RealAssetClassGroup> = {};

  for (const pos of positions) {
    const typeKey = (pos.type || 'OTHER').toUpperCase();
    const cfg = classConfigs[typeKey] || classConfigs.OTHER;

    if (!groups[typeKey]) {
      groups[typeKey] = {
        id: typeKey.toLowerCase(),
        name: cfg.name,
        icon: cfg.icon,
        iconColor: cfg.iconColor,
        color: cfg.color,
        targetPct: cfg.targetPct,
        count: 0,
        totalValue: 0,
        totalCost: 0,
        variationBrl: 0,
        variationPct: 0,
        totalDividends: 0,
        profitBrl: 0,
        returnPct: 0,
        currentPct: 0,
        items: [],
      };
    }

    const g = groups[typeKey];
    g.count += 1;
    g.totalValue += pos.totalCurrentValue;
    g.totalCost += pos.totalCost;
    g.variationBrl += pos.variationAmount;
    g.totalDividends += pos.receivedDividends;
    g.profitBrl += pos.profitAmount;
  }

  // Segunda passada para preencher os itens com % Carteira e % Ideal calculados
  for (const pos of positions) {
    const typeKey = (pos.type || 'OTHER').toUpperCase();
    const g = groups[typeKey];
    if (!g) continue;

    const currentPct = totalPortfolioValue > 0 ? Number(((pos.totalCurrentValue / totalPortfolioValue) * 100).toFixed(2)) : 0;
    const targetPct = g.count > 0 ? Number((g.targetPct / g.count).toFixed(2)) : 0;
    const shouldBuy = currentPct < targetPct;

    g.items.push({
      ticker: pos.ticker,
      name: pos.name,
      qty: pos.quantity,
      subType: pos.sector || (typeKey === 'FII' ? 'Papel' : 'Ações'),
      avgPrice: pos.averagePrice,
      curPrice: pos.currentPrice,
      variationPct: pos.variationPercentage,
      returnPct: pos.profitPercentage,
      vacancy: pos.vacancy || 0,
      total: pos.totalCurrentValue,
      receivedDividends: pos.receivedDividends,
      pvp: pos.pvp !== undefined ? pos.pvp : 1.0,
      dy: pos.dy || 0,
      yieldOnCost: pos.yieldOnCost || 0,
      rating: pos.rating || 10,
      currentPct,
      targetPct,
      shouldBuy,
    });
  }

  return Object.values(groups).map((g) => {
    const returnPct = g.totalCost > 0 ? (g.profitBrl / g.totalCost) * 100 : 0;
    const variationPct = g.totalCost > 0 ? (g.variationBrl / g.totalCost) * 100 : 0;
    return {
      ...g,
      variationPct,
      returnPct,
      currentPct: totalPortfolioValue > 0 ? (g.totalValue / totalPortfolioValue) * 100 : 0,
    };
  });
}

// 8. Cálculo de Evolução Histórica a partir dos Lançamentos Reais
export function computeEvolutionHistory(
  transactions: InvestmentTransaction[],
  totalCostBasis: number,
  totalProfitBrl: number
): { label: string; applied: number; profit: number }[] {
  if (!transactions || transactions.length === 0) {
    const currentYM = new Date();
    const list: { label: string; applied: number; profit: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYM.getFullYear(), currentYM.getMonth() - i, 1);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      list.push({ label: `${mm}/${yy}`, applied: 0, profit: 0 });
    }
    return list;
  }

  // Agrupa transações por mês cronológico
  const monthlyCumulative: Record<string, number> = {};
  const sorted = [...transactions].sort((a, b) => (a.date > b.date ? 1 : -1));

  let runningApplied = 0;
  for (const tx of sorted) {
    const ym = tx.date.slice(0, 7); // '2026-09'
    const val = tx.operation === 'BUY' ? tx.quantity * tx.price : -(tx.quantity * tx.price);
    runningApplied = Math.max(0, runningApplied + val);
    monthlyCumulative[ym] = runningApplied;
  }

  const now = new Date();
  const result: { label: string; applied: number; profit: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const fullYm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;

    // Busca valor aplicado até aquele mês
    let applied = 0;
    const pastMonths = Object.keys(monthlyCumulative)
      .filter((k) => k <= fullYm)
      .sort();
    if (pastMonths.length > 0) {
      applied = monthlyCumulative[pastMonths[pastMonths.length - 1]] || 0;
    }

    // No mês atual, usa os totais consolidados
    if (i === 0) {
      applied = totalCostBasis;
      result.push({
        label,
        applied: totalCostBasis,
        profit: totalProfitBrl,
      });
    } else {
      const estimatedProfit = applied > 0 && totalCostBasis > 0 ? (applied / totalCostBasis) * totalProfitBrl : 0;
      result.push({
        label,
        applied,
        profit: estimatedProfit,
      });
    }
  }

  return result;
}

// 9. [PRO] Imposto de Renda e DARF
export async function calculateTaxReport(transactions: InvestmentTransaction[]): Promise<{
  monthlyResults: MonthlyTaxResult[];
  annualDeclaration: AnnualDeclarationItem[];
}> {
  try {
    const res = await fetch(`${API_BASE}/tax/calculate`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ transactions }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch {}

  const currentYM = new Date().toISOString().slice(0, 7);
  return {
    monthlyResults: [
      {
        yearMonth: currentYM,
        totalSalesStock: 0,
        stockProfit: 0,
        stockTax: 0,
        isStockExempt: true,
        fiiProfit: 0,
        fiiTax: 0,
        cryptoSales: 0,
        cryptoProfit: 0,
        cryptoTax: 0,
        dayTradeProfit: 0,
        dayTradeTax: 0,
        totalDarfToPay: 0,
        accumulatedLosses: { stockSwing: 0, dayTrade: 0, fii: 0, crypto: 0 },
      },
    ],
    annualDeclaration: transactions.map((t) => ({
      group: t.type === 'FII' ? '07 - Fundos' : t.type === 'CRYPTO' ? '08 - Criptoativos' : '03 - Participações Societárias',
      code: t.type === 'FII' ? '03 - FII' : t.type === 'CRYPTO' ? '01 - Criptomoeda' : '01 - Ações',
      ticker: t.ticker,
      name: t.name || t.ticker,
      quantity: t.quantity,
      averagePrice: t.price,
      totalCost31Dec: t.quantity * t.price,
      description: `${t.quantity} cotas/ações de ${t.ticker} custodiadas na corretora. Custo médio: R$ ${t.price.toFixed(2)}.`,
    })),
  };
}

// 10. [PRO] Upload e Integração B3
export async function uploadB3FileToServer(file: File): Promise<InvestmentTransaction[]> {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('partiu_jwt_token') || 'demo_token';
  const res = await fetch(`${API_BASE}/b3/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Falha ao processar arquivo da B3 no servidor.');
  }

  const json = await res.json();
  return json.data || [];
}

// 11. [PRO] Diagnóstico de Carteira com IA
export async function runAIPortfolioDiagnosis(
  positions: PortfolioPosition[],
  totalPortfolioValue: number
): Promise<AIAdvisorDiagnosis> {
  if (!positions || positions.length === 0) {
    return {
      score: 0,
      rating: 'Moderada',
      summary: 'Cadastre seus primeiros ativos ou importe da B3 para gerar a análise inteligente de IA da sua carteira.',
      strengths: [],
      risks: ['Carteira sem posições ativas cadastradas.'],
      rebalanceSuggestions: [],
      sectorAllocation: {},
      passiveIncomeForecast: {
        monthlyAverageEstimated: 0,
        annualYieldEstimated: 0,
      },
    };
  }

  try {
    const assetsSummary = positions.map((p) => ({
      ticker: p.ticker,
      type: p.type,
      quantity: p.quantity,
      averagePrice: p.averagePrice,
      currentPrice: p.currentPrice,
      totalValue: p.totalCurrentValue,
      percentage: p.allocationPercentage,
      dy: p.dy,
    }));

    const res = await fetch(`${API_BASE}/ai/analyze`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({
        assets: assetsSummary,
        totalPortfolioValue,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch {}

  const fiiPct = positions.filter((p) => p.type === 'FII').reduce((sum, p) => sum + p.allocationPercentage, 0);
  const cryptoPct = positions.filter((p) => p.type === 'CRYPTO').reduce((sum, p) => sum + p.allocationPercentage, 0);
  const stockPct = positions.filter((p) => p.type === 'STOCK').reduce((sum, p) => sum + p.allocationPercentage, 0);
  const totalAnnualDiv = positions.reduce((sum, p) => sum + (p.annualEstimatedDividends || 0), 0);

  return {
    score: Math.min(95, Math.max(50, Math.round(positions.length * 15 + (fiiPct > 0 ? 20 : 0)))),
    rating: positions.length >= 3 ? 'Boa' : 'Moderada',
    summary: `Diagnóstico IA: Sua carteira possui ${positions.length} ativo(s) com valor total de R$ ${totalPortfolioValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
    strengths: [
      stockPct > 0 ? `Exposição em Ações (${stockPct.toFixed(1)}%) focada em crescimento.` : '',
      fiiPct > 0 ? `Alocação em FIIs (${fiiPct.toFixed(1)}%) gerando renda passiva regular.` : '',
      cryptoPct > 0 ? `Criptomoedas (${cryptoPct.toFixed(1)}%) agregando assimetria de retorno.` : '',
    ].filter(Boolean),
    risks: [
      positions.length < 5 ? 'Considere diversificar em mais ativos para diluir o risco específico.' : '',
    ].filter(Boolean),
    rebalanceSuggestions: [],
    sectorAllocation: {
      Ações: stockPct,
      'Fundos Imobiliários': fiiPct,
      Criptoativos: cryptoPct,
    },
    passiveIncomeForecast: {
      monthlyAverageEstimated: totalAnnualDiv / 12,
      annualYieldEstimated: totalPortfolioValue > 0 ? (totalAnnualDiv / totalPortfolioValue) * 100 : 0,
    },
  };
}
