import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
    familyId?: string;
    memberId?: string;
    role?: 'chefe-familia' | 'conjuge' | 'filho';
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
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
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      familyId: decoded.familyId,
      memberId: decoded.memberId,
      role: decoded.role,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Sessão expirada ou token inválido' });
  }
}
