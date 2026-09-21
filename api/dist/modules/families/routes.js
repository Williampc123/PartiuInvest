"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.familyRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_js_1 = require("../../shared/middleware/auth.js");
const firestore_1 = require("firebase/firestore");
const firebase_js_1 = require("../../config/firebase.js");
const router = (0, express_1.Router)();
const createFamilySchema = zod_1.z.object({
    familyName: zod_1.z.string().min(2),
    headDisplayName: zod_1.z.string().min(2),
});
// Endpoint de Onboarding do Chefe de Família
router.post('/onboarding', auth_js_1.requireAuth, async (req, res) => {
    try {
        const { familyName, headDisplayName } = createFamilySchema.parse(req.body);
        const uid = req.user.uid;
        const familyRef = (0, firestore_1.doc)((0, firestore_1.collection)(firebase_js_1.db, 'families'));
        const familyId = familyRef.id;
        const memberRef = (0, firestore_1.doc)((0, firestore_1.collection)(firebase_js_1.db, `families/${familyId}/members`));
        const memberId = memberRef.id;
        const batch = (0, firestore_1.writeBatch)(firebase_js_1.db);
        // Criação da família
        batch.set(familyRef, {
            id: familyId,
            name: familyName,
            headMemberId: memberId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            plan: 'free',
            currency: 'BRL',
        });
        // Criação do membro chefe
        batch.set(memberRef, {
            id: memberId,
            authUid: uid,
            role: 'chefe-familia',
            displayName: headDisplayName,
            color: '#F5B82E',
            isMinor: false,
            status: 'active',
            createdAt: new Date().toISOString(),
        });
        await batch.commit();
        res.status(201).json({
            message: 'Família criada com sucesso!',
            familyId,
            memberId,
            role: 'chefe-familia',
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Endpoint para convidar membros (Cônjuge / Filhos)
const inviteMemberSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    role: zod_1.z.enum(['conjuge', 'filho']),
    isMinor: zod_1.z.boolean().default(false),
});
router.post('/members/invite', auth_js_1.requireAuth, async (req, res) => {
    try {
        if (req.user?.role !== 'chefe-familia') {
            res.status(403).json({ error: 'Apenas o chefe de família pode convidar novos membros.' });
            return;
        }
        const { name, role, isMinor } = inviteMemberSchema.parse(req.body);
        const familyId = req.user.familyId;
        const inviteRef = (0, firestore_1.doc)((0, firestore_1.collection)(firebase_js_1.db, 'invites'));
        const inviteId = inviteRef.id;
        await (0, firestore_1.setDoc)(inviteRef, {
            id: inviteId,
            familyId,
            role,
            name,
            isMinor,
            status: 'pending',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
            createdAt: new Date().toISOString(),
        });
        res.status(201).json({
            message: 'Convite gerado com sucesso!',
            inviteId,
            role,
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.familyRoutes = router;
