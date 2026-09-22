import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/routes.js';
import { familyRoutes } from './modules/families/routes.js';
// import { openFinanceRoutes } from './modules/open-finance/routes.js';

const app = express();

// Middlewares de Segurança
app.use(helmet());
app.use(
  cors({
    origin: env.ALLOWED_ORIGINS.split(','),
    credentials: true,
  })
);

// Limiter para proteção contra abusos (ignorado em ambiente de desenvolvimento local)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'development' ? 10000 : 500,
  skip: () => env.NODE_ENV === 'development',
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
});
app.use(limiter);

app.use(express.json());

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
app.use('/v1/auth', authRoutes);
app.use('/v1/families', familyRoutes);
// app.use('/v1/open-finance', openFinanceRoutes);

// Iniciar Servidor
const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Partiu Invest API rodando na porta ${PORT} [${env.NODE_ENV}]`);
});
