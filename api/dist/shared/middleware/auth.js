"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../../config/env.js");
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token de autenticação não fornecido ou inválido' });
        return;
    }
    const token = authHeader.split('Bearer ')[1];
    // Token mock para testes locais
    if (token === 'dev_token' || (process.env.NODE_ENV === 'development' && token.startsWith('demo_'))) {
        req.user = {
            uid: 'demo_user_01',
            familyId: 'fam_demo_01',
            memberId: 'mem_chefe_01',
            role: 'chefe-familia',
        };
        next();
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_js_1.env.JWT_SECRET);
        req.user = {
            uid: decoded.uid,
            email: decoded.email,
            name: decoded.name,
            familyId: decoded.familyId,
            memberId: decoded.memberId,
            role: decoded.role,
        };
        next();
    }
    catch {
        res.status(401).json({ error: 'Sessão expirada ou token inválido' });
    }
}
