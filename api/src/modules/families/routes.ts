import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../../shared/middleware/auth.js';
import { collection, doc, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase.js';

const router = Router();

const createFamilySchema = z.object({
  familyName: z.string().min(2),
  headDisplayName: z.string().min(2),
});

// Endpoint de Onboarding do Chefe de Família
router.post('/onboarding', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { familyName, headDisplayName } = createFamilySchema.parse(req.body);
    const uid = req.user!.uid;

    const familyRef = doc(collection(db, 'families'));
    const familyId = familyRef.id;
    const memberRef = doc(collection(db, `families/${familyId}/members`));
    const memberId = memberRef.id;

    const batch = writeBatch(db);

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
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Endpoint para convidar membros (Cônjuge / Filhos)
const inviteMemberSchema = z.object({
  name: z.string().min(2),
  role: z.enum(['conjuge', 'filho']),
  isMinor: z.boolean().default(false),
});

router.post('/members/invite', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'chefe-familia') {
      res.status(403).json({ error: 'Apenas o chefe de família pode convidar novos membros.' });
      return;
    }

    const { name, role, isMinor } = inviteMemberSchema.parse(req.body);
    const familyId = req.user.familyId!;

    const inviteRef = doc(collection(db, 'invites'));
    const inviteId = inviteRef.id;

    await setDoc(inviteRef, {
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
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export const familyRoutes = router;
