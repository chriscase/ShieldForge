import { describe, it, expect, vi } from 'vitest';
import { createResolvers } from '../src/resolvers';
import type { AuthDataSource, AuthContext } from '../src/resolvers';

describe('resolvers', () => {
  const mockDataSource: AuthDataSource = {
    getUserById: vi.fn(),
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    createPasswordReset: vi.fn(),
    getPasswordReset: vi.fn(),
    deletePasswordReset: vi.fn(),
  };

  const mockAuth = {
    hashPassword: vi.fn().mockResolvedValue('hashed-password'),
    verifyPassword: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockReturnValue('test-token'),
    verifyToken: vi.fn().mockReturnValue({ userId: '123', email: 'test@example.com' }),
    calculatePasswordStrength: vi.fn().mockReturnValue({ score: 3, feedback: ['Strong password'] }),
    sanitizeUser: vi.fn((user) => {
      const { passwordHash, ...sanitized } = user;
      return sanitized;
    }),
    generateResetCode: vi.fn().mockReturnValue('123456'),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  };

  describe('Query.me', () => {
    it('should return null when not authenticated', async () => {
      const resolvers = createResolvers({ dataSource: mockDataSource, auth: mockAuth });
      const context: AuthContext = {};
      
      const result = await resolvers.Query.me({}, {}, context);
      
      expect(result).toBeNull();
    });

    it('should return user when authenticated', async () => {
      vi.mocked(mockDataSource.getUserById).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        passwordHash: 'hashed',
      });
      
      const resolvers = createResolvers({ dataSource: mockDataSource, auth: mockAuth });
      const context: AuthContext = { userId: '123' };
      
      const result = await resolvers.Query.me({}, {}, context);
      
      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect('passwordHash' in result!).toBe(false);
    });
  });

  describe('Query.checkPasswordStrength', () => {
    it('should return password strength', () => {
      const resolvers = createResolvers({ dataSource: mockDataSource, auth: mockAuth });
      
      const result = resolvers.Query.checkPasswordStrength({}, { password: 'Test123!' }, {} as AuthContext);
      
      expect(result.score).toBe(3);
      expect(result.feedback).toEqual(['Strong password']);
    });
  });

  describe('Mutation.login', () => {
    it('should throw error for invalid credentials', async () => {
      vi.mocked(mockDataSource.getUserByEmail).mockResolvedValue(null);
      
      const resolvers = createResolvers({ dataSource: mockDataSource, auth: mockAuth });
      
      await expect(
        resolvers.Mutation.login({}, { input: { email: 'test@example.com', password: 'wrong' } }, {} as AuthContext)
      ).rejects.toThrow('Invalid email or password');
    });

    it('should return auth payload on successful login', async () => {
      vi.mocked(mockDataSource.getUserByEmail).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        passwordHash: 'hashed',
      });
      vi.mocked(mockAuth.verifyPassword).mockResolvedValue(true);
      
      const resolvers = createResolvers({ dataSource: mockDataSource, auth: mockAuth });
      
      const result = await resolvers.Mutation.login(
        {},
        { input: { email: 'test@example.com', password: 'correct' } },
        {} as AuthContext
      );
      
      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBe('test-token');
    });
  });

  describe('Mutation.register', () => {
    it('should throw error if user exists', async () => {
      vi.mocked(mockDataSource.getUserByEmail).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
      });
      
      const resolvers = createResolvers({ dataSource: mockDataSource, auth: mockAuth });
      
      await expect(
        resolvers.Mutation.register(
          {},
          { input: { email: 'test@example.com', password: 'Test123!' } },
          {} as AuthContext
        )
      ).rejects.toThrow('User with this email already exists');
    });

    it('should throw error for weak password', async () => {
      vi.mocked(mockDataSource.getUserByEmail).mockResolvedValue(null);
      vi.mocked(mockAuth.calculatePasswordStrength).mockReturnValue({
        score: 1,
        feedback: ['Password is too weak'],
      });
      
      const resolvers = createResolvers({ dataSource: mockDataSource, auth: mockAuth });
      
      await expect(
        resolvers.Mutation.register(
          {},
          { input: { email: 'test@example.com', password: 'weak' } },
          {} as AuthContext
        )
      ).rejects.toThrow('Password is too weak');
    });

    it('should create user on successful registration', async () => {
      vi.mocked(mockDataSource.getUserByEmail).mockResolvedValue(null);
      vi.mocked(mockAuth.calculatePasswordStrength).mockReturnValue({
        score: 3,
        feedback: ['Strong password'],
      });
      vi.mocked(mockDataSource.createUser).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        passwordHash: 'hashed',
      });
      
      const resolvers = createResolvers({ dataSource: mockDataSource, auth: mockAuth });
      
      const result = await resolvers.Mutation.register(
        {},
        { input: { email: 'test@example.com', password: 'Test123!' } },
        {} as AuthContext
      );
      
      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBe('test-token');
    });
  });

  describe('Mutation.logout', () => {
    it('should return true', () => {
      const resolvers = createResolvers({ dataSource: mockDataSource, auth: mockAuth });
      
      const result = resolvers.Mutation.logout({}, {}, {} as AuthContext);
      
      expect(result).toBe(true);
    });
  });

  describe('Mutation.updateProfile', () => {
    it('should throw error when not authenticated', async () => {
      const resolvers = createResolvers({ dataSource: mockDataSource, auth: mockAuth });
      
      await expect(
        resolvers.Mutation.updateProfile({}, { input: { name: 'New Name' } }, {} as AuthContext)
      ).rejects.toThrow('Not authenticated');
    });

    it('should update user profile', async () => {
      vi.mocked(mockDataSource.updateUser).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        name: 'New Name',
      });
      
      const resolvers = createResolvers({ dataSource: mockDataSource, auth: mockAuth });
      const context: AuthContext = { userId: '123' };
      
      const result = await resolvers.Mutation.updateProfile(
        {},
        { input: { name: 'New Name' } },
        context
      );
      
      expect(result.name).toBe('New Name');
    });
  });
});
