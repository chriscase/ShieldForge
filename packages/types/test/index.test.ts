import { describe, it, expect } from 'vitest';
import { UserAccountStatus } from '../src/index';
import type {
  User,
  AuthUser,
  Session,
  LoginInput,
  RegisterInput,
  CreateUserInput,
  UpdateProfileInput,
  UpdatePasswordInput,
  AuthPayload,
  JwtPayload,
  PasswordStrength,
  ShieldForgeConfig,
  PasskeyConfig,
  AuthProviderConfig,
  AuthDataSource,
  ChallengeStore,
  Challenge,
} from '../src/index';

describe('types', () => {
  describe('UserAccountStatus enum', () => {
    it('should have correct enum values', () => {
      expect(UserAccountStatus.ACTIVE).toBe('ACTIVE');
      expect(UserAccountStatus.INACTIVE).toBe('INACTIVE');
      expect(UserAccountStatus.SUSPENDED).toBe('SUSPENDED');
      expect(UserAccountStatus.PENDING).toBe('PENDING');
    });
  });

  describe('User interface', () => {
    it('should accept valid user object', () => {
      const user: User = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        passwordHash: 'hashed',
        accountStatus: UserAccountStatus.ACTIVE,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(user.id).toBe('123');
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('AuthUser interface', () => {
    it('should accept sanitized user object', () => {
      const authUser: AuthUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        accountStatus: UserAccountStatus.ACTIVE,
        emailVerified: true,
      };
      
      expect(authUser.id).toBe('123');
      expect('passwordHash' in authUser).toBe(false);
    });
  });

  describe('Session interface', () => {
    it('should accept valid session object', () => {
      const session: Session = {
        userId: '123',
        token: 'token-string',
        expiresAt: new Date(),
        createdAt: new Date(),
      };
      
      expect(session.userId).toBe('123');
      expect(session.token).toBe('token-string');
    });
  });

  describe('LoginInput interface', () => {
    it('should accept valid login input', () => {
      const input: LoginInput = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      expect(input.email).toBe('test@example.com');
      expect(input.password).toBe('password123');
    });
  });

  describe('RegisterInput interface', () => {
    it('should accept valid register input', () => {
      const input: RegisterInput = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        name: 'Test User',
      };
      
      expect(input.email).toBe('test@example.com');
      expect(input.username).toBe('testuser');
    });
  });

  describe('AuthPayload interface', () => {
    it('should accept valid auth payload', () => {
      const payload: AuthPayload = {
        user: {
          id: '123',
          email: 'test@example.com',
        },
        token: 'token-string',
      };
      
      expect(payload.user.id).toBe('123');
      expect(payload.token).toBe('token-string');
    });
  });

  describe('JwtPayload interface', () => {
    it('should accept valid JWT payload', () => {
      const payload: JwtPayload = {
        userId: '123',
        email: 'test@example.com',
        iat: Date.now(),
        exp: Date.now() + 3600000,
      };
      
      expect(payload.userId).toBe('123');
      expect(payload.email).toBe('test@example.com');
    });
  });

  describe('PasswordStrength interface', () => {
    it('should accept valid password strength result', () => {
      const strength: PasswordStrength = {
        score: 3,
        feedback: ['Strong password'],
      };
      
      expect(strength.score).toBe(3);
      expect(strength.feedback).toEqual(['Strong password']);
    });
  });

  describe('ShieldForgeConfig interface', () => {
    it('should accept valid config', () => {
      const config: ShieldForgeConfig = {
        jwtSecret: 'secret',
        jwtExpiresIn: '7d',
        saltRounds: 10,
        smtp: {
          host: 'smtp.example.com',
          port: 587,
          user: 'user',
          pass: 'pass',
          from: 'noreply@example.com',
        },
      };
      
      expect(config.jwtSecret).toBe('secret');
      expect(config.smtp?.host).toBe('smtp.example.com');
    });

    it('should accept minimal config', () => {
      const config: ShieldForgeConfig = {
        jwtSecret: 'secret',
      };
      
      expect(config.jwtSecret).toBe('secret');
    });
  });

  describe('PasskeyConfig interface', () => {
    it('should accept valid passkey config', () => {
      const config: PasskeyConfig = {
        rpName: 'My App',
        rpId: 'example.com',
        origin: 'https://example.com',
        challengeTTL: 300000,
      };
      
      expect(config.rpName).toBe('My App');
      expect(config.rpId).toBe('example.com');
    });
  });

  describe('AuthProviderConfig interface', () => {
    it('should accept valid auth provider config', () => {
      const config: AuthProviderConfig = {
        storageKey: 'auth.token',
        pollInterval: 60000,
        enableCrossTabSync: true,
        initialToken: null,
        initialUser: null,
      };

      expect(config.storageKey).toBe('auth.token');
      expect(config.pollInterval).toBe(60000);
    });
  });

  describe('CreateUserInput interface', () => {
    it('should NOT include plaintext password', () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        passwordHash: '$2b$12$abcdef...',
        username: 'testuser',
        name: 'Test User',
      };

      expect(input.email).toBe('test@example.com');
      expect(input.passwordHash).toBeDefined();
      expect('password' in input).toBe(false);
    });

    it('should accept minimal input (email + passwordHash)', () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        passwordHash: '$2b$12$abcdef...',
      };

      expect(input.email).toBe('test@example.com');
    });
  });

  describe('ShieldForgeConfig JWT options', () => {
    it('should accept jwtIssuer and jwtAudience', () => {
      const config: ShieldForgeConfig = {
        jwtSecret: 'secret',
        jwtIssuer: 'my-service',
        jwtAudience: 'my-frontend',
      };

      expect(config.jwtIssuer).toBe('my-service');
      expect(config.jwtAudience).toBe('my-frontend');
    });
  });

  describe('ChallengeStore interface', () => {
    it('should accept an implementation with all methods', () => {
      const store: ChallengeStore = {
        store: async () => {},
        get: async () => null,
        delete: async () => {},
        clearExpired: async () => {},
      };

      expect(store.store).toBeDefined();
      expect(store.get).toBeDefined();
      expect(store.delete).toBeDefined();
      expect(store.clearExpired).toBeDefined();
    });
  });

  describe('AuthDataSource interface', () => {
    it('createUser should accept CreateUserInput (no plaintext password)', () => {
      // This is a type-level test — verify the interface shape
      const mockDS: AuthDataSource = {
        getUserById: async () => null,
        getUserByEmail: async () => null,
        createUser: async (input: CreateUserInput) => ({ id: '1', email: input.email }),
        updateUser: async (id, input) => ({ id, email: 'test@example.com', ...input }),
        createPasswordReset: async () => {},
        getPasswordReset: async () => null,
        deletePasswordReset: async () => {},
      };

      expect(mockDS.createUser).toBeDefined();
    });
  });
});
