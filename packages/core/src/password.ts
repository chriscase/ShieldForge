import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string, saltRounds: number = 10): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
