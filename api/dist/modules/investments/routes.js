"use strict";
/**
 * routes.ts
 * Rotas do Módulo de Investimentos (Investidor10 Clone & Recursos PRO)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.investmentsRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_js_1 = require("../../shared/middleware/auth.js");
const investmentsController_js_1 = require("./controllers/investmentsController.js");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
exports.investmentsRoutes = (0, express_1.Router)();
// 1. Cotações e Dados de Mercado Públicos (Sem necessidade de autenticação)
exports.investmentsRoutes.get('/market/crypto', investmentsController_js_1.getCryptoMarket);
exports.investmentsRoutes.get('/market/klines', investmentsController_js_1.getCryptoKlines);
exports.investmentsRoutes.get('/market/indices', investmentsController_js_1.getIndices);
exports.investmentsRoutes.get('/market/assets', investmentsController_js_1.getAssets);
exports.investmentsRoutes.get('/market/quote/:ticker', investmentsController_js_1.getAssetQuote);
// Middleware de Autenticação para rotas privadas
exports.investmentsRoutes.use(auth_js_1.requireAuth);
// 2. Recursos PRO: B3, Imposto de Renda e Análise com IA
exports.investmentsRoutes.post('/b3/upload', upload.single('file'), investmentsController_js_1.uploadB3File);
exports.investmentsRoutes.post('/tax/calculate', investmentsController_js_1.calculateTaxes);
exports.investmentsRoutes.post('/ai/analyze', investmentsController_js_1.analyzePortfolioAI);
// 3. Carteira do Usuário (Persistência no Firestore)
exports.investmentsRoutes.get('/portfolio', investmentsController_js_1.getPortfolioData);
exports.investmentsRoutes.post('/portfolio/transaction', investmentsController_js_1.savePortfolioTransaction);
exports.investmentsRoutes.delete('/portfolio/transaction/:id', investmentsController_js_1.deletePortfolioTransaction);
