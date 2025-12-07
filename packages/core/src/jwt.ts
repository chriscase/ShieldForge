import jwt, { SignOptions } from 'jsonwebtoken';
import { JwtPayload } from '@shieldforge/types';

/**
 * Generate a JWT token
 */
export function generateToken(
  payload: JwtPayload,
  secret: string,
  expiresIn: string | number = '7d'
): string {
  const options: SignOptions = { expiresIn: expiresIn as any };
  return jwt.sign(payload, secret, options);
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string, secret: string): JwtPayload {
  const decoded = jwt.verify(token, secret) as JwtPayload;
  return decoded;
}

/**
 * Decode a JWT token without verification (use with caution)
 */
export function decodeToken(token: string): JwtPayload | null {
  const decoded = jwt.decode(token) as JwtPayload | null;
  return decoded;
}
