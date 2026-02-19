import {
  User,
  AuthUser,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  UpdatePasswordInput,
  AuthPayload,
  PasswordStrength,
  AuthDataSource,
} from '@appforgeapps/shieldforge-types';

// Re-export AuthDataSource for backward compatibility (moved to shieldforge-types)
export type { AuthDataSource } from '@appforgeapps/shieldforge-types';

/**
 * Context interface that must be provided to resolvers
 */
export interface AuthContext {
  userId?: string;
  token?: string;
}

/**
 * Resolver dependencies
 */
export interface ResolverDependencies {
  dataSource: AuthDataSource;
  auth: {
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    generateToken(payload: { userId: string; email: string }): string;
    verifyToken(token: string): { userId: string; email: string };
    calculatePasswordStrength(password: string): PasswordStrength;
    sanitizeUser(user: User): AuthUser;
    generateResetCode(length?: number): string;
    hashResetCode(code: string): string;
    sendPasswordResetEmail(to: string, code: string, resetUrl?: string): Promise<void>;
  };
}

/**
 * Create GraphQL resolvers with dependency injection
 */
export function createResolvers(deps: ResolverDependencies) {
  const { dataSource, auth } = deps;

  return {
    Query: {
      me: async (_parent: any, _args: any, context: AuthContext): Promise<AuthUser | null> => {
        if (!context.userId) {
          return null;
        }
        const user = await dataSource.getUserById(context.userId);
        return user ? auth.sanitizeUser(user) : null;
      },

      checkPasswordStrength: (_parent: any, args: { password: string }): PasswordStrength => {
        return auth.calculatePasswordStrength(args.password);
      },
    },

    Mutation: {
      login: async (_parent: any, args: { input: LoginInput }): Promise<AuthPayload> => {
        const { email, password } = args.input;
        
        const user = await dataSource.getUserByEmail(email);
        if (!user || !user.passwordHash) {
          throw new Error('Invalid email or password');
        }

        const isValid = await auth.verifyPassword(password, user.passwordHash);
        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        const token = auth.generateToken({ userId: user.id, email: user.email });
        
        return {
          user: auth.sanitizeUser(user),
          token,
        };
      },

      register: async (_parent: any, args: { input: RegisterInput }): Promise<AuthPayload> => {
        const { email, password, username, name } = args.input;

        // Check if user already exists
        const existingUser = await dataSource.getUserByEmail(email);
        if (existingUser) {
          throw new Error('User with this email already exists');
        }

        // Validate password strength
        const strength = auth.calculatePasswordStrength(password);
        if (strength.score < 2) {
          throw new Error(`Password is too weak: ${strength.feedback.join(', ')}`);
        }

        // Hash password and create user (plaintext password never reaches data source)
        const passwordHash = await auth.hashPassword(password);
        const user = await dataSource.createUser({
          email,
          username,
          name,
          passwordHash,
        });

        const token = auth.generateToken({ userId: user.id, email: user.email });

        return {
          user: auth.sanitizeUser(user),
          token,
        };
      },

      logout: (_parent: any, _args: any, _context: AuthContext): boolean => {
        // Logout is typically handled client-side by removing the token
        // Server-side can optionally invalidate the token if using a token blacklist
        return true;
      },

      updateProfile: async (
        _parent: any,
        args: { input: UpdateProfileInput },
        context: AuthContext
      ): Promise<AuthUser> => {
        if (!context.userId) {
          throw new Error('Not authenticated');
        }

        const user = await dataSource.updateUser(context.userId, args.input);
        return auth.sanitizeUser(user);
      },

      updatePassword: async (
        _parent: any,
        args: { input: UpdatePasswordInput },
        context: AuthContext
      ): Promise<boolean> => {
        if (!context.userId) {
          throw new Error('Not authenticated');
        }

        const user = await dataSource.getUserById(context.userId);
        if (!user || !user.passwordHash) {
          throw new Error('User not found');
        }

        const isValid = await auth.verifyPassword(args.input.currentPassword, user.passwordHash);
        if (!isValid) {
          throw new Error('Current password is incorrect');
        }

        const strength = auth.calculatePasswordStrength(args.input.newPassword);
        if (strength.score < 2) {
          throw new Error(`New password is too weak: ${strength.feedback.join(', ')}`);
        }

        const newPasswordHash = await auth.hashPassword(args.input.newPassword);
        await dataSource.updateUser(context.userId, { passwordHash: newPasswordHash });

        return true;
      },

      requestPasswordReset: async (_parent: any, args: { email: string }): Promise<boolean> => {
        const user = await dataSource.getUserByEmail(args.email);
        if (!user) {
          // Don't reveal whether the email exists
          return true;
        }

        const resetCode = auth.generateResetCode();
        const codeHash = auth.hashResetCode(resetCode);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store the hash, not the raw code
        await dataSource.createPasswordReset(user.id, codeHash, expiresAt);
        // Send the raw code to the user via email
        await auth.sendPasswordResetEmail(user.email, resetCode);

        return true;
      },

      resetPassword: async (
        _parent: any,
        args: { code: string; newPassword: string }
      ): Promise<boolean> => {
        // Look up by the hashed code
        const codeHash = auth.hashResetCode(args.code);
        const reset = await dataSource.getPasswordReset(codeHash);
        if (!reset) {
          throw new Error('Invalid or expired reset code');
        }

        if (new Date() > reset.expiresAt) {
          await dataSource.deletePasswordReset(codeHash);
          throw new Error('Reset code has expired');
        }

        const strength = auth.calculatePasswordStrength(args.newPassword);
        if (strength.score < 2) {
          throw new Error(`New password is too weak: ${strength.feedback.join(', ')}`);
        }

        const newPasswordHash = await auth.hashPassword(args.newPassword);
        await dataSource.updateUser(reset.userId, { passwordHash: newPasswordHash });
        await dataSource.deletePasswordReset(codeHash);

        return true;
      },
    },
  };
}
