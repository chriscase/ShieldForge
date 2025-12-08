/**
 * Mock Database Layer - Replace with your actual database
 */
import type { User } from '@appforgeapps/shieldforge-types';

const users: Map<string, User> = new Map();
const passwordResets: Map<string, { code: string; expiresAt: Date }> = new Map();

export async function findUserById(id: string): Promise<User | null> {
  return users.get(id) || null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  for (const user of users.values()) {
    if (user.email === email) return user;
  }
  return null;
}

export async function createUser(userData: Partial<User>): Promise<User> {
  const user: User = {
    id: Math.random().toString(36),
    email: userData.email!,
    username: userData.username,
    name: userData.name,
    passwordHash: userData.passwordHash!,
    accountStatus: 'ACTIVE' as any,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  users.set(user.id, user);
  return user;
}

export async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
  const user = users.get(id);
  if (!user) return null;
  const updated = { ...user, ...userData, updatedAt: new Date() };
  users.set(id, updated);
  return updated;
}

export async function createPasswordReset(email: string, code: string, expiresAt: Date): Promise<boolean> {
  passwordResets.set(email, { code, expiresAt });
  return true;
}

export async function getPasswordReset(email: string, code: string) {
  const reset = passwordResets.get(email);
  if (!reset || reset.code !== code || reset.expiresAt < new Date()) return null;
  return { email, ...reset };
}

export async function deletePasswordReset(email: string): Promise<boolean> {
  return passwordResets.delete(email);
}
