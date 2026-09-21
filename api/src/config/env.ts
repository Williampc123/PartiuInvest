import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('8080').transform((v) => parseInt(v, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  FIREBASE_PROJECT_ID: z.string().default('partiuinvest'),
  JWT_SECRET: z.string().default('partiu_invest_jwt_secret_dev_2026_super_secure'),
  OPEN_FINANCE_PROVIDER: z.string().default('pluggy'),
  WEBHOOK_SECRET: z.string().default('webhook_dev_secret'),
});

export const env = envSchema.parse(process.env);
