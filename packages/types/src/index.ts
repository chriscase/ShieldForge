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
  displayName?: string;
  role?: string;
  avatarUrl?: string;
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
  displayName?: string;
  role?: string;
  avatarUrl?: string;
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
  /** JWT issuer claim — set this to your application/service name */
  jwtIssuer?: string;
  /** JWT audience claim — set this to your intended audience */
  jwtAudience?: string;
}

/**
 * Passkey service configuration
 */
export interface PasskeyConfig {
  rpName: string;
  rpId: string;
  origin: string;
  challengeTTL?: number;
  /** Optional injectable challenge store. Defaults to in-memory Map (not suitable for multi-instance). */
  challengeStore?: ChallengeStore;
}

/**
 * Auth provider configuration for React
 */
export interface AuthProviderConfig {
  /**
   * Auth mode:
   * - 'token' (default): Store JWT in localStorage, pass via Authorization header.
   * - 'cookie': Server manages httpOnly cookie. Frontend never touches the token.
   *   Uses refreshAuth to check session state via GET /auth/me.
   */
  mode?: 'token' | 'cookie';
  storageKey?: string;
  pollInterval?: number;
  enableCrossTabSync?: boolean;
  initialToken?: string | null;
  initialUser?: AuthUser | null;
}

/**
 * Input for creating a new user in the data source.
 * Deliberately excludes plaintext password — only the hash is passed to storage.
 */
export interface CreateUserInput {
  email: string;
  username?: string;
  name?: string;
  passwordHash: string;
}

/**
 * Data source interface for auth operations.
 * Implement this to connect ShieldForge to your database.
 *
 * SECURITY NOTES:
 * - `createUser` receives a `CreateUserInput` that excludes plaintext passwords.
 * - `createPasswordReset` receives a SHA-256 hash of the reset code, never the raw code.
 * - `getPasswordReset` looks up by the hashed code.
 */
export interface AuthDataSource {
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(input: CreateUserInput): Promise<User>;
  updateUser(id: string, input: Partial<User>): Promise<User>;
  createPasswordReset(userId: string, codeHash: string, expiresAt: Date): Promise<void>;
  getPasswordReset(codeHash: string): Promise<{ userId: string; expiresAt: Date } | null>;
  deletePasswordReset(codeHash: string): Promise<void>;
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

/**
 * Injectable challenge store interface for WebAuthn.
 * Implement this to use a persistent store (Redis, database, etc.)
 * instead of the default in-memory Map.
 */
export interface ChallengeStore {
  /** Store a challenge with optional user binding and TTL */
  store(challenge: string, userId?: string, ttl?: number): Promise<void> | void;
  /** Get a challenge if it exists and is not expired. Returns null otherwise. */
  get(challenge: string): Promise<Challenge | null> | Challenge | null;
  /** Delete a challenge (one-time use semantics) */
  delete(challenge: string): Promise<void> | void;
  /** Clear all expired challenges */
  clearExpired(): Promise<void> | void;
}
