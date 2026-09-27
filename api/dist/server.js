"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_js_1 = require("./config/env.js");
const routes_js_1 = require("./modules/auth/routes.js");
const routes_js_2 = require("./modules/families/routes.js");
const routes_js_3 = require("./modules/investments/routes.js");
// import { openFinanceRoutes } from './modules/open-finance/routes.js';
const app = (0, express_1.default)();
// Middlewares de Segurança
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_js_1.env.ALLOWED_ORIGINS.split(','),
    credentials: true,
}));
// Limiter para proteção contra abusos (ignorado em ambiente de desenvolvimento local)
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: env_js_1.env.NODE_ENV === 'development' ? 10000 : 500,
    skip: () => env_js_1.env.NODE_ENV === 'development',
    message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
});
app.use(limiter);
app.use(express_1.default.json());
// Healthcheck
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        project: 'Partiu Invest API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});
// Rotas Versionadas
app.use('/v1/auth', routes_js_1.authRoutes);
app.use('/v1/families', routes_js_2.familyRoutes);
app.use('/v1/investments', routes_js_3.investmentsRoutes);
// app.use('/v1/open-finance', openFinanceRoutes);
// Iniciar Servidor
const PORT = env_js_1.env.PORT;
app.listen(PORT, () => {
    console.log(`🚀 Partiu Invest API rodando na porta ${PORT} [${env_js_1.env.NODE_ENV}]`);
});
