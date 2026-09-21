import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../../shared/middleware/auth.js';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase.js';

const router = Router();

// Geração de token efêmero para o widget do provedor (Pluggy / Belvo)
router.post('/connect-token', requireAuth, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Em produção, faz a chamada POST para o endpoint do provedor Pluggy com clientId e clientSecret
    const mockConnectToken = `mock_of_token_${Math.random().toString(36).substring(2, 12)}`;

    res.json({
      connectToken: mockConnectToken,
      expiresInSeconds: 1800,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Registro de conta bancária conectada via Open Finance
const connectAccountSchema = z.object({
  institutionName: z.string(),
  externalItemId: z.string(),
  ownerMemberId: z.string(),
  visibility: z.enum(['family', 'private']).default('family'),
  initialBalanceCents: z.number().default(0),
  color: z.string().default('#3F6FD8'),
});

router.post('/items', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = connectAccountSchema.parse(req.body);
    const familyId = req.user?.familyId || 'fam_demo_01';

    const accountRef = doc(collection(db, `families/${familyId}/accounts`));

    await setDoc(accountRef, {
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
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Webhook para recebimento de eventos do provedor Open Finance
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    // Processamento idempotente de notificações de transações e saldos
    console.log('[Open Finance Webhook Recebido]:', payload?.event || 'transaction_update');

    res.status(200).json({ status: 'received' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export const openFinanceRoutes = router;
