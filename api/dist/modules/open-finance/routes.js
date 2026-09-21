"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openFinanceRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_js_1 = require("../../shared/middleware/auth.js");
const firestore_1 = require("firebase/firestore");
const firebase_js_1 = require("../../config/firebase.js");
const router = (0, express_1.Router)();
// Geração de token efêmero para o widget do provedor (Pluggy / Belvo)
router.post('/connect-token', auth_js_1.requireAuth, async (_req, res) => {
    try {
        // Em produção, faz a chamada POST para o endpoint do provedor Pluggy com clientId e clientSecret
        const mockConnectToken = `mock_of_token_${Math.random().toString(36).substring(2, 12)}`;
        res.json({
            connectToken: mockConnectToken,
            expiresInSeconds: 1800,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Registro de conta bancária conectada via Open Finance
const connectAccountSchema = zod_1.z.object({
    institutionName: zod_1.z.string(),
    externalItemId: zod_1.z.string(),
    ownerMemberId: zod_1.z.string(),
    visibility: zod_1.z.enum(['family', 'private']).default('family'),
    initialBalanceCents: zod_1.z.number().default(0),
    color: zod_1.z.string().default('#3F6FD8'),
});
router.post('/items', auth_js_1.requireAuth, async (req, res) => {
    try {
        const data = connectAccountSchema.parse(req.body);
        const familyId = req.user?.familyId || 'fam_demo_01';
        const accountRef = (0, firestore_1.doc)((0, firestore_1.collection)(firebase_js_1.db, `families/${familyId}/accounts`));
        await (0, firestore_1.setDoc)(accountRef, {
            id: accountRef.id,
            ownerMemberId: data.ownerMemberId,
            visibility: data.visibility,
            name: `${data.institutionName} Conectado`,
            type: 'checking',
            source: 'open_finance',
            institutionName: data.institutionName,
            openFinanceItemId: data.externalItemId,
            balanceCents: data.initialBalanceCents,
            color: data.color,
            lastSyncedAt: new Date().toISOString(),
            deletedAt: null,
            createdAt: new Date().toISOString(),
        });
        res.status(201).json({
            message: 'Conta Open Finance registrada com sucesso!',
            accountId: accountRef.id,
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Webhook para recebimento de eventos do provedor Open Finance
router.post('/webhook', async (req, res) => {
    try {
        const payload = req.body;
        // Processamento idempotente de notificações de transações e saldos
        console.log('[Open Finance Webhook Recebido]:', payload?.event || 'transaction_update');
        res.status(200).json({ status: 'received' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.openFinanceRoutes = router;
