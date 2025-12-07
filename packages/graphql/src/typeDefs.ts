/**
 * GraphQL type definitions for authentication
 */
export const typeDefs = `
  enum UserAccountStatus {
    ACTIVE
    INACTIVE
    SUSPENDED
    PENDING
  }

  type User {
    id: ID!
    email: String!
    username: String
    name: String
    accountStatus: UserAccountStatus
    emailVerified: Boolean
    createdAt: String
    updatedAt: String
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input RegisterInput {
    email: String!
    password: String!
    username: String
    name: String
  }

  input UpdateProfileInput {
    username: String
    name: String
    email: String
  }

  input UpdatePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  type PasswordStrength {
    score: Int!
    feedback: [String!]!
  }

  type Query {
    me: User
    checkPasswordStrength(password: String!): PasswordStrength!
  }

  type Mutation {
    login(input: LoginInput!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    logout: Boolean!
    updateProfile(input: UpdateProfileInput!): User!
    updatePassword(input: UpdatePasswordInput!): Boolean!
    requestPasswordReset(email: String!): Boolean!
    resetPassword(code: String!, newPassword: String!): Boolean!
  }
`;
