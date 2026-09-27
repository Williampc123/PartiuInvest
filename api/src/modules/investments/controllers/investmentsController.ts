/**
 * investmentsController.ts
 * Controlador de Investimentos para o PartiuInvest
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/middleware/auth.js';
import {
  getBinanceCryptos,
  getBinanceKlines,
  getMacroRates,
  getMarketAssetsList,
  getAssetDetails,
} from '../services/marketDataService.js';
import { calculateMonthlyTaxes, generateAnnualDeclaration } from '../services/taxCalculationEngine.js';
import { parseB3FileBuffer } from '../services/b3FileParserService.js';
import { generateAIAdvisorDiagnosis } from '../services/aiAdvisorService.js';
import { db } from '../../../config/firebase.js';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';

export async function getCryptoMarket(req: AuthenticatedRequest, res: Response) {
  try {
    const data = await getBinanceCryptos();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getCryptoKlines(req: AuthenticatedRequest, res: Response) {
  try {
    const symbol = (req.query.symbol as string) || 'BTCUSDT';
    const interval = (req.query.interval as string) || '1d';
    const limit = parseInt(req.query.limit as string) || 30;

    const data = await getBinanceKlines(symbol, interval, limit);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getIndices(req: AuthenticatedRequest, res: Response) {
  try {
    const data = await getMacroRates();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAssets(req: AuthenticatedRequest, res: Response) {
  try {
    const type = (req.query.type as any) || 'ALL';
    const data = await getMarketAssetsList(type);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAssetQuote(req: AuthenticatedRequest, res: Response) {
  try {
    const ticker = req.params.ticker;
    const date = req.query.date as string | undefined;
    if (!ticker) {
      res.status(400).json({ success: false, error: 'Ticker obrigatório' });
      return;
    }
    const data = await getAssetDetails(ticker, date);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function uploadB3File(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file || !req.file.buffer) {
      res.status(400).json({ success: false, error: 'Arquivo da B3 não enviado' });
      return;
    }

    const transactions = parseB3FileBuffer(req.file.buffer);
    res.json({
      success: true,
      message: `${transactions.length} transações identificadas com sucesso no arquivo B3`,
      data: transactions,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao processar arquivo B3' });
  }
}

export async function calculateTaxes(req: AuthenticatedRequest, res: Response) {
  try {
    const { transactions, previousLosses } = req.body;
    if (!Array.isArray(transactions)) {
      res.status(400).json({ success: false, error: 'Lista de transações inválida' });
      return;
    }

    const monthlyResults = calculateMonthlyTaxes(transactions, previousLosses);
    const annualDeclaration = generateAnnualDeclaration(transactions);

    res.json({
      success: true,
      data: {
        monthlyResults,
        annualDeclaration,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function analyzePortfolioAI(req: AuthenticatedRequest, res: Response) {
  try {
    const { assets, totalPortfolioValue, targetAllocation } = req.body;
    const diagnosis = await generateAIAdvisorDiagnosis(assets, totalPortfolioValue, targetAllocation);
    res.json({ success: true, data: diagnosis });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getPortfolioData(req: AuthenticatedRequest, res: Response) {
  try {
    const familyId = req.user?.familyId || 'fam_demo_01';
    const txRef = collection(db, 'families', familyId, 'investment_transactions');
    const q = query(txRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);

    const transactions: any[] = [];
    snapshot.forEach((docSnap) => {
      transactions.push({ id: docSnap.id, ...docSnap.data() });
    });

    res.json({ success: true, data: { transactions } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function savePortfolioTransaction(req: AuthenticatedRequest, res: Response) {
  try {
    const familyId = req.user?.familyId || 'fam_demo_01';
    const transaction = req.body;

    if (!transaction || !transaction.ticker || !transaction.quantity || !transaction.price) {
      res.status(400).json({ success: false, error: 'Dados da transação incompletos' });
      return;
    }

    const txId = transaction.id || `tx_inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const txRef = doc(db, 'families', familyId, 'investment_transactions', txId);

    const dataToSave = {
      ...transaction,
      id: txId,
      familyId,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(txRef, dataToSave, { merge: true });

    res.json({ success: true, data: dataToSave });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deletePortfolioTransaction(req: AuthenticatedRequest, res: Response) {
  try {
    const familyId = req.user?.familyId || 'fam_demo_01';
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, error: 'ID da transação não fornecido' });
      return;
    }

    const txRef = doc(db, 'families', familyId, 'investment_transactions', id);
    await deleteDoc(txRef);

    res.json({ success: true, message: 'Transação excluída com sucesso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
