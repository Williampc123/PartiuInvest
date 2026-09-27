/**
 * routes.ts
 * Rotas do Módulo de Investimentos (Investidor10 Clone & Recursos PRO)
 */

import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../shared/middleware/auth.js';
import {
  getCryptoMarket,
  getCryptoKlines,
  getIndices,
  getAssets,
  getAssetQuote,
  uploadB3File,
  calculateTaxes,
  analyzePortfolioAI,
  getPortfolioData,
  savePortfolioTransaction,
  deletePortfolioTransaction,
} from './controllers/investmentsController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const investmentsRoutes = Router();

// 1. Cotações e Dados de Mercado Públicos (Sem necessidade de autenticação)
investmentsRoutes.get('/market/crypto', getCryptoMarket);
investmentsRoutes.get('/market/klines', getCryptoKlines);
investmentsRoutes.get('/market/indices', getIndices);
investmentsRoutes.get('/market/assets', getAssets);
investmentsRoutes.get('/market/quote/:ticker', getAssetQuote);

// Middleware de Autenticação para rotas privadas
investmentsRoutes.use(requireAuth);

// 2. Recursos PRO: B3, Imposto de Renda e Análise com IA
investmentsRoutes.post('/b3/upload', upload.single('file'), uploadB3File);
investmentsRoutes.post('/tax/calculate', calculateTaxes);
investmentsRoutes.post('/ai/analyze', analyzePortfolioAI);

// 3. Carteira do Usuário (Persistência no Firestore)
investmentsRoutes.get('/portfolio', getPortfolioData);
investmentsRoutes.post('/portfolio/transaction', savePortfolioTransaction);
investmentsRoutes.delete('/portfolio/transaction/:id', deletePortfolioTransaction);
