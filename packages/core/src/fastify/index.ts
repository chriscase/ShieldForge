import type { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify';
import type {
  User,
  AuthUser,
  AuthDataSource,
  JwtPayload,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  UpdatePasswordInput,
  PasswordStrength,
} from '@appforgeapps/shieldforge-types';
import { ShieldForge } from '../index';

/**
 * Configuration for the ShieldForge Fastify plugin
 */
export interface ShieldForgeFastifyOptions {
  /** ShieldForge instance (provides JWT, password hashing, etc.) */
  shieldForge: ShieldForge;

  /** Data source for user CRUD operations */
  dataSource: AuthDataSource;

  /** Cookie configuration for httpOnly session cookies */
  cookie?: {
    /** Cookie name (default: 'sf_session') */
    name?: string;
    /** httpOnly flag (default: true) */
    httpOnly?: boolean;
    /** Secure flag — requires HTTPS (default: true in production) */
    secure?: boolean;
    /** SameSite attribute (default: 'lax') */
    sameSite?: 'strict' | 'lax' | 'none';
    /** Max age in seconds (default: 604800 — 7 days) */
    maxAge?: number;
    /** Cookie path (default: '/') */
    path?: string;
  };

  /** Route prefix (default: '/auth') */
  prefix?: string;

  /** Register pre-built auth routes (default: true) */
  enableRoutes?: boolean;

  /** Control which routes are registered (all true by default) */
  routes?: {
    login?: boolean;
    register?: boolean;
    logout?: boolean;
    me?: boolean;
    updateProfile?: boolean;
    changePassword?: boolean;
    requestReset?: boolean;
    resetPassword?: boolean;
    passwordStrength?: boolean;
  };

  /** Hook called before registration — throw to reject */
  onBeforeRegister?: (input: RegisterInput, request: FastifyRequest) => Promise<void>;

  /** Hook called after successful registration */
  onAfterRegister?: (user: AuthUser, request: FastifyRequest) => Promise<void>;

  /** Hook called after successful login */
  onAfterLogin?: (user: AuthUser, request: FastifyRequest) => Promise<void>;
}

// Augment Fastify types
declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser | null;
  }

  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (...roles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Resolve cookie config with defaults
 */
function resolveCookieConfig(opts?: ShieldForgeFastifyOptions['cookie']) {
  return {
    name: opts?.name ?? 'sf_session',
    httpOnly: opts?.httpOnly ?? true,
    secure: opts?.secure ?? (process.env.NODE_ENV === 'production'),
    sameSite: opts?.sameSite ?? 'lax' as const,
    maxAge: opts?.maxAge ?? 604800,
    path: opts?.path ?? '/',
  };
}

/**
 * ShieldForge Fastify plugin.
 *
 * Provides:
 * - `request.user` decoration (populated from JWT in cookie or Authorization header)
 * - `fastify.requireAuth` preHandler hook
 * - `fastify.requireRole(...roles)` preHandler hook factory
 * - Optional pre-built auth routes (login, register, logout, me, etc.)
 *
 * @example
 * ```typescript
 * import { ShieldForge } from '@appforgeapps/shieldforge-core';
 * import { shieldForgeFastify } from '@appforgeapps/shieldforge-core/fastify';
 *
 * const sf = new ShieldForge({ jwtSecret: process.env.JWT_SECRET! });
 *
 * await app.register(shieldForgeFastify, {
 *   shieldForge: sf,
 *   dataSource: myPrismaDataSource,
 *   prefix: '/api/auth',
 * });
 *
 * // Protected route
 * app.get('/api/protected', { preHandler: [app.requireAuth] }, (req, reply) => {
 *   reply.send({ user: req.user });
 * });
 *
 * // Admin-only route
 * app.get('/api/admin', { preHandler: [app.requireRole('admin')] }, (req, reply) => {
 *   reply.send({ admin: true });
 * });
 * ```
 */
const shieldForgeFastifyPlugin: FastifyPluginAsync<ShieldForgeFastifyOptions> = async (
  fastify: FastifyInstance,
  opts: ShieldForgeFastifyOptions,
) => {
  const { shieldForge, dataSource } = opts;
  const cookieConfig = resolveCookieConfig(opts.cookie);
  const enableRoutes = opts.enableRoutes ?? true;
  const routeConfig = {
    login: true,
    register: true,
    logout: true,
    me: true,
    updateProfile: true,
    changePassword: true,
    requestReset: true,
    resetPassword: true,
    passwordStrength: true,
    ...opts.routes,
  };

  // --- Decorators ---

  // Decorate request with user (null until auth middleware runs)
  fastify.decorateRequest('user', null);

  // --- Auth extraction hook (runs on every request) ---

  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    let token: string | undefined;

    // Try cookie first
    const cookieHeader = request.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${cookieConfig.name}=([^;]+)`));
      if (match) {
        token = match[1];
      }
    }

    // Fall back to Authorization header
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (token) {
      try {
        const payload: JwtPayload = shieldForge.verifyToken(token);
        const user = await dataSource.getUserById(payload.userId);
        if (user) {
          request.user = shieldForge.sanitizeUser(user);
        }
      } catch {
        // Invalid token — request.user stays null
      }
    }
  });

  // --- Decorator methods ---

  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      reply.status(401).send({ error: 'Authentication required' });
    }
  };

  const requireRole = (...roles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        reply.status(401).send({ error: 'Authentication required' });
        return;
      }
      if (!request.user.role || !roles.includes(request.user.role)) {
        reply.status(403).send({ error: 'Insufficient permissions' });
      }
    };
  };

  fastify.decorate('requireAuth', requireAuth);
  fastify.decorate('requireRole', requireRole);

  // --- Helper: set session cookie ---

  function setSessionCookie(reply: FastifyReply, token: string) {
    const parts = [
      `${cookieConfig.name}=${token}`,
      `Path=${cookieConfig.path}`,
      `Max-Age=${cookieConfig.maxAge}`,
      `SameSite=${cookieConfig.sameSite.charAt(0).toUpperCase() + cookieConfig.sameSite.slice(1)}`,
    ];
    if (cookieConfig.httpOnly) parts.push('HttpOnly');
    if (cookieConfig.secure) parts.push('Secure');
    reply.header('Set-Cookie', parts.join('; '));
  }

  function clearSessionCookie(reply: FastifyReply) {
    const parts = [
      `${cookieConfig.name}=`,
      `Path=${cookieConfig.path}`,
      'Max-Age=0',
    ];
    reply.header('Set-Cookie', parts.join('; '));
  }

  // --- Routes ---

  if (!enableRoutes) return;

  if (routeConfig.login) {
    fastify.post<{ Body: LoginInput }>('/login', async (request, reply) => {
      const { email, password } = request.body;

      const user = await dataSource.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }

      const valid = await shieldForge.verifyPassword(password, user.passwordHash);
      if (!valid) {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }

      const token = shieldForge.generateToken({ userId: user.id, email: user.email });
      const sanitized = shieldForge.sanitizeUser(user);

      setSessionCookie(reply, token);
      await opts.onAfterLogin?.(sanitized, request);

      return { user: sanitized, token };
    });
  }

  if (routeConfig.register) {
    fastify.post<{ Body: RegisterInput }>('/register', async (request, reply) => {
      const { email, password, username, name } = request.body;

      const existing = await dataSource.getUserByEmail(email);
      if (existing) {
        return reply.status(409).send({ error: 'User with this email already exists' });
      }

      const strength = shieldForge.calculatePasswordStrength(password);
      if (strength.score < 2) {
        return reply.status(400).send({ error: 'Password too weak', feedback: strength.feedback });
      }

      await opts.onBeforeRegister?.({ email, password, username, name }, request);

      const passwordHash = await shieldForge.hashPassword(password);
      const user = await dataSource.createUser({ email, password, username, name, passwordHash });
      const token = shieldForge.generateToken({ userId: user.id, email: user.email });
      const sanitized = shieldForge.sanitizeUser(user);

      setSessionCookie(reply, token);
      await opts.onAfterRegister?.(sanitized, request);

      reply.status(201);
      return { user: sanitized, token };
    });
  }

  if (routeConfig.logout) {
    fastify.post('/logout', async (_request, reply) => {
      clearSessionCookie(reply);
      return { success: true };
    });
  }

  if (routeConfig.me) {
    fastify.get('/me', async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }
      return { user: request.user };
    });
  }

  if (routeConfig.updateProfile) {
    fastify.patch<{ Body: UpdateProfileInput }>('/me', {
      preHandler: [requireAuth],
    }, async (request) => {
      const updated = await dataSource.updateUser(request.user!.id, request.body);
      return { user: shieldForge.sanitizeUser(updated) };
    });
  }

  if (routeConfig.changePassword) {
    fastify.patch<{ Body: UpdatePasswordInput }>('/password', {
      preHandler: [requireAuth],
    }, async (request, reply) => {
      const { currentPassword, newPassword } = request.body;

      const user = await dataSource.getUserById(request.user!.id);
      if (!user || !user.passwordHash) {
        return reply.status(404).send({ error: 'User not found' });
      }

      const valid = await shieldForge.verifyPassword(currentPassword, user.passwordHash);
      if (!valid) {
        return reply.status(401).send({ error: 'Current password is incorrect' });
      }

      const strength = shieldForge.calculatePasswordStrength(newPassword);
      if (strength.score < 2) {
        return reply.status(400).send({ error: 'Password too weak', feedback: strength.feedback });
      }

      const newHash = await shieldForge.hashPassword(newPassword);
      await dataSource.updateUser(user.id, { passwordHash: newHash });

      return { success: true };
    });
  }

  if (routeConfig.requestReset) {
    fastify.post<{ Body: { email: string } }>('/reset-request', async (request) => {
      const user = await dataSource.getUserByEmail(request.body.email);
      if (user) {
        const code = shieldForge.generateResetCode();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await dataSource.createPasswordReset(user.id, code, expiresAt);
        try {
          await shieldForge.sendPasswordResetEmail(user.email, code);
        } catch {
          // Don't expose email sending failures
        }
      }
      // Always return success to prevent email enumeration
      return { success: true };
    });
  }

  if (routeConfig.resetPassword) {
    fastify.post<{ Body: { code: string; newPassword: string } }>('/reset-password', async (request, reply) => {
      const { code, newPassword } = request.body;

      const reset = await dataSource.getPasswordReset(code);
      if (!reset) {
        return reply.status(400).send({ error: 'Invalid or expired reset code' });
      }

      if (new Date() > reset.expiresAt) {
        await dataSource.deletePasswordReset(code);
        return reply.status(400).send({ error: 'Reset code has expired' });
      }

      const strength = shieldForge.calculatePasswordStrength(newPassword);
      if (strength.score < 2) {
        return reply.status(400).send({ error: 'Password too weak', feedback: strength.feedback });
      }

      const newHash = await shieldForge.hashPassword(newPassword);
      await dataSource.updateUser(reset.userId, { passwordHash: newHash });
      await dataSource.deletePasswordReset(code);

      return { success: true };
    });
  }

  if (routeConfig.passwordStrength) {
    fastify.post<{ Body: { password: string } }>('/password-strength', async (request) => {
      return shieldForge.calculatePasswordStrength(request.body.password);
    });
  }
};

// Named export for the plugin
export const shieldForgeFastify = shieldForgeFastifyPlugin;

// Re-export types for convenience
export type { AuthDataSource, AuthUser, User, JwtPayload } from '@appforgeapps/shieldforge-types';
