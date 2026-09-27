"use strict";
/**
 * investmentsController.ts
 * Controlador de Investimentos para o PartiuInvest
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCryptoMarket = getCryptoMarket;
exports.getCryptoKlines = getCryptoKlines;
exports.getIndices = getIndices;
exports.getAssets = getAssets;
exports.getAssetQuote = getAssetQuote;
exports.uploadB3File = uploadB3File;
exports.calculateTaxes = calculateTaxes;
exports.analyzePortfolioAI = analyzePortfolioAI;
exports.getPortfolioData = getPortfolioData;
exports.savePortfolioTransaction = savePortfolioTransaction;
exports.deletePortfolioTransaction = deletePortfolioTransaction;
const marketDataService_js_1 = require("../services/marketDataService.js");
const taxCalculationEngine_js_1 = require("../services/taxCalculationEngine.js");
const b3FileParserService_js_1 = require("../services/b3FileParserService.js");
const aiAdvisorService_js_1 = require("../services/aiAdvisorService.js");
const firebase_js_1 = require("../../../config/firebase.js");
const firestore_1 = require("firebase/firestore");
async function getCryptoMarket(req, res) {
    try {
        const data = await (0, marketDataService_js_1.getBinanceCryptos)();
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getCryptoKlines(req, res) {
    try {
        const symbol = req.query.symbol || 'BTCUSDT';
        const interval = req.query.interval || '1d';
        const limit = parseInt(req.query.limit) || 30;
        const data = await (0, marketDataService_js_1.getBinanceKlines)(symbol, interval, limit);
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getIndices(req, res) {
    try {
        const data = await (0, marketDataService_js_1.getMacroRates)();
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getAssets(req, res) {
    try {
        const type = req.query.type || 'ALL';
        const data = await (0, marketDataService_js_1.getMarketAssetsList)(type);
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getAssetQuote(req, res) {
    try {
        const ticker = req.params.ticker;
        const date = req.query.date;
        if (!ticker) {
            res.status(400).json({ success: false, error: 'Ticker obrigatório' });
            return;
        }
        const data = await (0, marketDataService_js_1.getAssetDetails)(ticker, date);
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function uploadB3File(req, res) {
    try {
        if (!req.file || !req.file.buffer) {
            res.status(400).json({ success: false, error: 'Arquivo da B3 não enviado' });
            return;
        }
        const transactions = (0, b3FileParserService_js_1.parseB3FileBuffer)(req.file.buffer);
        res.json({
            success: true,
            message: `${transactions.length} transações identificadas com sucesso no arquivo B3`,
            data: transactions,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Erro ao processar arquivo B3' });
    }
}
async function calculateTaxes(req, res) {
    try {
        const { transactions, previousLosses } = req.body;
        if (!Array.isArray(transactions)) {
            res.status(400).json({ success: false, error: 'Lista de transações inválida' });
            return;
        }
        const monthlyResults = (0, taxCalculationEngine_js_1.calculateMonthlyTaxes)(transactions, previousLosses);
        const annualDeclaration = (0, taxCalculationEngine_js_1.generateAnnualDeclaration)(transactions);
        res.json({
            success: true,
            data: {
                monthlyResults,
                annualDeclaration,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function analyzePortfolioAI(req, res) {
    try {
        const { assets, totalPortfolioValue, targetAllocation } = req.body;
        const diagnosis = await (0, aiAdvisorService_js_1.generateAIAdvisorDiagnosis)(assets, totalPortfolioValue, targetAllocation);
        res.json({ success: true, data: diagnosis });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getPortfolioData(req, res) {
    try {
        const familyId = req.user?.familyId || 'fam_demo_01';
        const txRef = (0, firestore_1.collection)(firebase_js_1.db, 'families', familyId, 'investment_transactions');
        const q = (0, firestore_1.query)(txRef, (0, firestore_1.orderBy)('date', 'desc'));
        const snapshot = await (0, firestore_1.getDocs)(q);
        const transactions = [];
        snapshot.forEach((docSnap) => {
            transactions.push({ id: docSnap.id, ...docSnap.data() });
        });
        res.json({ success: true, data: { transactions } });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function savePortfolioTransaction(req, res) {
    try {
        const familyId = req.user?.familyId || 'fam_demo_01';
        const transaction = req.body;
        if (!transaction || !transaction.ticker || !transaction.quantity || !transaction.price) {
            res.status(400).json({ success: false, error: 'Dados da transação incompletos' });
            return;
        }
        const txId = transaction.id || `tx_inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const txRef = (0, firestore_1.doc)(firebase_js_1.db, 'families', familyId, 'investment_transactions', txId);
        const dataToSave = {
            ...transaction,
            id: txId,
            familyId,
            updatedAt: new Date().toISOString(),
        };
        await (0, firestore_1.setDoc)(txRef, dataToSave, { merge: true });
        res.json({ success: true, data: dataToSave });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function deletePortfolioTransaction(req, res) {
    try {
        const familyId = req.user?.familyId || 'fam_demo_01';
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ success: false, error: 'ID da transação não fornecido' });
            return;
        }
        const txRef = (0, firestore_1.doc)(firebase_js_1.db, 'families', familyId, 'investment_transactions', id);
        await (0, firestore_1.deleteDoc)(txRef);
        res.json({ success: true, message: 'Transação excluída com sucesso' });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
