/**
 * GraphQL Resolvers with ShieldForge - See backend/resolvers.ts for full version
 */
import { createResolvers } from '@appforgeapps/shieldforge-graphql';
import { auth } from './config';
import * as db from './database';

export const authResolvers = createResolvers({
  dataSource: {
    getUserById: (id: string) => db.findUserById(id),
    getUserByEmail: (email: string) => db.findUserByEmail(email),
    createUser: (userData: any) => db.createUser(userData),
    updateUser: (id: string, userData: any) => db.updateUser(id, userData),
    createPasswordReset: (email: string, code: string, expiresAt: Date) => 
      db.createPasswordReset(email, code, expiresAt),
    getPasswordReset: (email: string, code: string) => db.getPasswordReset(email, code),
    deletePasswordReset: (email: string) => db.deletePasswordReset(email),
  },
  auth: {
    hashPassword: (password: string) => auth.hashPassword(password),
    verifyPassword: (password: string, hash: string) => auth.verifyPassword(password, hash),
    generateToken: (payload: any) => auth.generateToken(payload),
    verifyToken: (token: string) => auth.verifyToken(token),
    calculatePasswordStrength: (password: string) => auth.calculatePasswordStrength(password),
    sanitizeUser: (user: any) => auth.sanitizeUser(user),
    generateResetCode: () => auth.generateResetCode(),
    sendPasswordResetEmail: (email: string, code: string) => auth.sendPasswordResetEmail(email, code),
  },
});

export const resolvers = { ...authResolvers };

export async function createContext({ req }: any) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  let userId: string | undefined;
  if (token) {
    try {
      const decoded = auth.verifyToken(token);
      userId = decoded.userId;
    } catch (error) {
      userId = undefined;
    }
  }
  return { userId };
}
