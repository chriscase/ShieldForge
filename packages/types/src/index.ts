/**
 * User account status enum
 */
export enum UserAccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING'
}

/**
 * Core User interface
 */
export interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  passwordHash?: string;
  accountStatus?: UserAccountStatus;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Sanitized user for client-side (no sensitive fields)
 */
export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  name?: string;
  accountStatus?: UserAccountStatus;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Session interface
 */
export interface Session {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Login input
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Register input
 */
export interface RegisterInput {
  email: string;
  password: string;
  username?: string;
  name?: string;
}

/**
 * Update profile input
 */
export interface UpdateProfileInput {
  username?: string;
  name?: string;
  email?: string;
}

/**
 * Update password input
 */
export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/**
 * Auth payload returned from authentication operations
 */
export interface AuthPayload {
  user: AuthUser;
  token: string;
}

/**
 * JWT payload structure
 */
export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Password strength result
 */
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  feedback: string[];
}

/**
 * SMTP configuration
 */
export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure?: boolean;
}

/**
 * ShieldForge core configuration
 */
export interface ShieldForgeConfig {
  jwtSecret: string;
  jwtExpiresIn?: string;
  saltRounds?: number;
  smtp?: SmtpConfig;
}

/**
 * Passkey service configuration
 */
export interface PasskeyConfig {
  rpName: string;
  rpId: string;
  origin: string;
  challengeTTL?: number;
}

/**
 * Auth provider configuration for React
 */
export interface AuthProviderConfig {
  storageKey?: string;
  pollInterval?: number;
  enableCrossTabSync?: boolean;
  initialToken?: string | null;
  initialUser?: AuthUser | null;
}

/**
 * Passkey credential
 */
export interface PasskeyCredential {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string[];
  createdAt?: Date;
}

/**
 * Challenge for WebAuthn
 */
export interface Challenge {
  challenge: string;
  userId?: string;
  createdAt: Date;
  expiresAt: Date;
}
