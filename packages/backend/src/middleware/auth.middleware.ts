import { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthUser } from '../services/auth.service.js';

export interface AuthRequest extends Request {
  user?: AuthUser;
  token?: string;
}

export async function authMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    req.token = token;
    const user = await verifyToken(token);
    if (user) {
      req.user = user;
    }
  }

  next();
}
