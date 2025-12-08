import { describe, it, expect } from 'vitest';
import { typeDefs } from '../src/typeDefs';

describe('typeDefs', () => {
  it('should export GraphQL schema string', () => {
    expect(typeDefs).toBeDefined();
    expect(typeof typeDefs).toBe('string');
  });

  it('should include User type', () => {
    expect(typeDefs).toContain('type User');
    expect(typeDefs).toContain('id: ID!');
    expect(typeDefs).toContain('email: String!');
  });

  it('should include UserAccountStatus enum', () => {
    expect(typeDefs).toContain('enum UserAccountStatus');
    expect(typeDefs).toContain('ACTIVE');
    expect(typeDefs).toContain('INACTIVE');
    expect(typeDefs).toContain('SUSPENDED');
    expect(typeDefs).toContain('PENDING');
  });

  it('should include AuthPayload type', () => {
    expect(typeDefs).toContain('type AuthPayload');
    expect(typeDefs).toContain('user: User!');
    expect(typeDefs).toContain('token: String!');
  });

  it('should include input types', () => {
    expect(typeDefs).toContain('input LoginInput');
    expect(typeDefs).toContain('input RegisterInput');
    expect(typeDefs).toContain('input UpdateProfileInput');
    expect(typeDefs).toContain('input UpdatePasswordInput');
  });

  it('should include PasswordStrength type', () => {
    expect(typeDefs).toContain('type PasswordStrength');
    expect(typeDefs).toContain('score: Int!');
    expect(typeDefs).toContain('feedback: [String!]!');
  });

  it('should include Query type', () => {
    expect(typeDefs).toContain('type Query');
    expect(typeDefs).toContain('me: User');
    expect(typeDefs).toContain('checkPasswordStrength');
  });

  it('should include Mutation type', () => {
    expect(typeDefs).toContain('type Mutation');
    expect(typeDefs).toContain('login(input: LoginInput!): AuthPayload!');
    expect(typeDefs).toContain('register(input: RegisterInput!): AuthPayload!');
    expect(typeDefs).toContain('logout: Boolean!');
    expect(typeDefs).toContain('updateProfile');
    expect(typeDefs).toContain('updatePassword');
    expect(typeDefs).toContain('requestPasswordReset');
    expect(typeDefs).toContain('resetPassword');
  });
});
