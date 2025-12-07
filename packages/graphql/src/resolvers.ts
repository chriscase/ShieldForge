import {
  User,
  AuthUser,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  UpdatePasswordInput,
  AuthPayload,
  PasswordStrength,
} from '@shieldforge/types';

/**
 * Data source functions that must be implemented by the consumer
 */
export interface AuthDataSource {
  // User operations
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(input: RegisterInput & { passwordHash: string }): Promise<User>;
  updateUser(id: string, input: Partial<User>): Promise<User>;
  
  // Password reset operations
  createPasswordReset(userId: string, code: string, expiresAt: Date): Promise<void>;
  getPasswordReset(code: string): Promise<{ userId: string; expiresAt: Date } | null>;
  deletePasswordReset(code: string): Promise<void>;
}

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

        // Hash password and create user
        const passwordHash = await auth.hashPassword(password);
        const user = await dataSource.createUser({
          email,
          password,
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
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await dataSource.createPasswordReset(user.id, resetCode, expiresAt);
        await auth.sendPasswordResetEmail(user.email, resetCode);

        return true;
      },

      resetPassword: async (
        _parent: any,
        args: { code: string; newPassword: string }
      ): Promise<boolean> => {
        const reset = await dataSource.getPasswordReset(args.code);
        if (!reset) {
          throw new Error('Invalid or expired reset code');
        }

        if (new Date() > reset.expiresAt) {
          await dataSource.deletePasswordReset(args.code);
          throw new Error('Reset code has expired');
        }

        const strength = auth.calculatePasswordStrength(args.newPassword);
        if (strength.score < 2) {
          throw new Error(`New password is too weak: ${strength.feedback.join(', ')}`);
        }

        const newPasswordHash = await auth.hashPassword(args.newPassword);
        await dataSource.updateUser(reset.userId, { passwordHash: newPasswordHash });
        await dataSource.deletePasswordReset(args.code);

        return true;
      },
    },
  };
}
