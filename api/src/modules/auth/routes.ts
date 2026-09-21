import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import { env } from '../../config/env.js';
import { requireAuth, AuthenticatedRequest } from '../../shared/middleware/auth.js';

export const authRoutes = Router();

// Schemas de validação Zod
const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  familyName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

/**
 * POST /v1/auth/register
 * Cria o usuário na collection `users` e a estrutura familiar em `families` no Firestore
 */
authRoutes.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { name, email: rawEmail, password, familyName } = parseResult.data;
    const email = rawEmail.toLowerCase().trim();

    // 1. Verificar se o e-mail já existe na collection `users` do Firestore
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('email', '==', email));
    const userSnap = await getDocs(userQuery);

    if (!userSnap.empty) {
      res.status(409).json({ error: 'Este e-mail já está cadastrado. Tente entrar.' });
      return;
    }

    // 2. Gerar hash bcrypt da senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const nowIso = new Date().toISOString();
    const familyDocRef = doc(collection(db, 'families'));
    const familyId = familyDocRef.id;

    const memberDocRef = doc(collection(db, `families/${familyId}/members`));
    const memberId = memberDocRef.id;

    const userDocRef = doc(collection(db, 'users'));
    const userId = userDocRef.id;

    // 3. Documento da Família
    const familyData = {
      id: familyId,
      name: familyName || `Família ${name.split(' ')[name.split(' ').length - 1] || 'Silva'}`,
      headMemberId: memberId,
      createdAt: nowIso,
      updatedAt: nowIso,
      plan: 'free',
      currency: 'BRL',
      settings: {
        defaultView: 'consolidated',
        allowKidsViewFamilyTotals: true,
      },
    };

    // 4. Documento do Membro Chefe
    const headMember = {
      id: memberId,
      authUid: userId,
      role: 'chefe-familia' as const,
      name,
      displayName: name.split(' ')[0],
      email,
      color: '#F5B82E',
      isMinor: false,
      status: 'active' as const,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 5. Caixinhas Iniciais Padrão
    const box1DocRef = doc(collection(db, `families/${familyId}/boxes`));
    const box1 = {
      id: box1DocRef.id,
      ownerMemberId: memberId,
      visibility: 'family' as const,
      name: 'Reserva de Emergência',
      category: 'emergency' as const,
      targetAmountCents: 1800000,
      currentBalanceCents: 0,
      targetDate: '2027-12-31',
      color: '#F5B82E',
      icon: 'shield',
      createdAt: nowIso,
    };

    const box2DocRef = doc(collection(db, `families/${familyId}/boxes`));
    const box2 = {
      id: box2DocRef.id,
      ownerMemberId: memberId,
      visibility: 'family' as const,
      name: 'Investimentos',
      category: 'investment' as const,
      targetAmountCents: 5000000,
      currentBalanceCents: 0,
      color: '#0A1F44',
      icon: 'chart',
      createdAt: nowIso,
    };

    const box3DocRef = doc(collection(db, `families/${familyId}/boxes`));
    const box3 = {
      id: box3DocRef.id,
      ownerMemberId: memberId,
      visibility: 'family' as const,
      name: 'Viagem dos Sonhos',
      category: 'dream' as const,
      targetAmountCents: 800000,
      currentBalanceCents: 0,
      targetDate: '2027-07-31',
      color: '#3F6FD8',
      icon: 'plane',
      createdAt: nowIso,
    };

    const defaultBoxes = [box1, box2, box3];

    // 6. Documento do Usuário na collection `users`
    const userData = {
      id: userId,
      name,
      displayName: name.split(' ')[0],
      email,
      passwordHash,
      familyId,
      memberId,
      role: 'chefe-familia',
      color: '#F5B82E',
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 7. Gravação atômica no Firestore via Batch
    const batch = writeBatch(db);
    batch.set(userDocRef, userData);
    batch.set(familyDocRef, familyData);
    batch.set(memberDocRef, headMember);
    batch.set(box1DocRef, box1);
    batch.set(box2DocRef, box2);
    batch.set(box3DocRef, box3);

    await batch.commit();
    console.log(`✅ Família [${familyId}] e Usuário [${userId} - ${email}] gravados no Firestore com sucesso!`);

    // 8. Gerar Token JWT
    const token = jwt.sign(
      {
        uid: userId,
        email,
        name,
        familyId,
        memberId,
        role: 'chefe-familia',
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userProfile = {
      uid: userId,
      familyId,
      memberId,
      role: 'chefe-familia' as const,
      displayName: name,
      email,
      color: '#F5B82E',
      isMinor: false,
    };

    res.status(201).json({
      message: 'Usuário e família criados com sucesso no Firestore!',
      token,
      user: userProfile,
      familyMembers: [headMember],
      boxes: defaultBoxes,
      accounts: [],
    });
  } catch (error: any) {
    console.error('Erro no registro Firestore:', error);
    res.status(500).json({ error: error?.message || 'Erro ao processar cadastro no Firestore.' });
  }
});

/**
 * POST /v1/auth/login
 * Busca o usuário no Firestore, valida o hash bcrypt e retorna a família
 */
authRoutes.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { email: rawEmail, password } = parseResult.data;
    const email = rawEmail.toLowerCase().trim();

    // 1. Buscar usuário na collection `users` do Firestore
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('email', '==', email));
    const userSnap = await getDocs(userQuery);

    if (userSnap.empty) {
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    const userDoc = userSnap.docs[0];
    const userData = userDoc.data() as any;

    // 2. Comparar hash bcrypt da senha
    const isPasswordValid = await bcrypt.compare(password, userData.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    // 3. Buscar membros da família em `families/{familyId}/members`
    const familyId = userData.familyId;
    const membersSnap = await getDocs(collection(db, `families/${familyId}/members`));
    const familyMembers = membersSnap.docs.map((d) => d.data());

    // 4. Buscar caixinhas em `families/{familyId}/boxes`
    const boxesSnap = await getDocs(collection(db, `families/${familyId}/boxes`));
    const boxes = boxesSnap.docs.map((d) => d.data());

    // 5. Buscar contas em `families/{familyId}/accounts`
    const accountsSnap = await getDocs(collection(db, `families/${familyId}/accounts`));
    const accounts = accountsSnap.docs.map((d) => d.data());

    // 6. Gerar Token JWT
    const token = jwt.sign(
      {
        uid: userData.id || userDoc.id,
        email: userData.email,
        name: userData.name,
        familyId: userData.familyId,
        memberId: userData.memberId,
        role: userData.role,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userProfile = {
      uid: userData.id || userDoc.id,
      familyId: userData.familyId,
      memberId: userData.memberId,
      role: userData.role,
      displayName: userData.displayName || userData.name,
      email: userData.email,
      color: userData.color || '#F5B82E',
      isMinor: !!userData.isMinor,
    };

    console.log(`✅ Login com sucesso para [${email}] verificado no Firestore!`);

    res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: userProfile,
      familyMembers,
      boxes,
      accounts,
    });
  } catch (error: any) {
    console.error('Erro no login Firestore:', error);
    res.status(500).json({ error: error?.message || 'Erro ao processar login no Firestore.' });
  }
});

/**
 * GET /v1/auth/me
 */
authRoutes.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autorizado' });
      return;
    }

    res.json({
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter dados da sessão' });
  }
});
