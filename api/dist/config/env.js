"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('8080').transform((v) => parseInt(v, 10)),
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    ALLOWED_ORIGINS: zod_1.z.string().default('http://localhost:5173'),
    FIREBASE_PROJECT_ID: zod_1.z.string().default('partiuinvest'),
    JWT_SECRET: zod_1.z.string().default('partiu_invest_jwt_secret_dev_2026_super_secure'),
    OPEN_FINANCE_PROVIDER: zod_1.z.string().default('pluggy'),
    WEBHOOK_SECRET: zod_1.z.string().default('webhook_dev_secret'),
});
exports.env = envSchema.parse(process.env);
