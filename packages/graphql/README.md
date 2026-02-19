# @appforgeapps/shieldforge-graphql

GraphQL schema definitions and resolvers for authentication.

## Installation

```bash
npm install @appforgeapps/shieldforge-graphql
```

Peer dependencies:
```bash
npm install graphql
```

## Quick Start

### Backend Setup

```typescript
import { createResolvers, typeDefs } from '@appforgeapps/shieldforge-graphql';
import { ShieldForge } from '@appforgeapps/shieldforge-core';

const auth = new ShieldForge({
  jwtSecret: process.env.JWT_SECRET!,
});

// Implement data source
const dataSource = {
  getUserById: async (id) => await db.user.findUnique({ where: { id } }),
  getUserByEmail: async (email) => await db.user.findUnique({ where: { email } }),
  createUser: async (input) => await db.user.create({ data: input }),
  updateUser: async (id, input) => await db.user.update({ where: { id }, data: input }),
  createPasswordReset: async (userId, code, expiresAt) => {
    await db.passwordReset.create({ data: { userId, code, expiresAt } });
  },
  getPasswordReset: async (code) => {
    return await db.passwordReset.findUnique({ where: { code } });
  },
  deletePasswordReset: async (code) => {
    await db.passwordReset.delete({ where: { code } });
  },
};

// Create resolvers
const resolvers = createResolvers({
  dataSource,
  auth: {
    hashPassword: (password) => auth.hashPassword(password),
    verifyPassword: (password, hash) => auth.verifyPassword(password, hash),
    generateToken: (payload) => auth.generateToken(payload),
    verifyToken: (token) => auth.verifyToken(token),
    calculatePasswordStrength: (password) => auth.calculatePasswordStrength(password),
    sanitizeUser: (user) => auth.sanitizeUser(user),
    generateResetCode: () => auth.generateResetCode(),
    sendPasswordResetEmail: (to, code) => auth.sendPasswordResetEmail(to, code),
  },
});

// Use with Apollo Server
import { ApolloServer } from '@apollo/server';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const payload = auth.verifyToken(token);
        return { userId: payload.userId, token };
      } catch (error) {
        return {};
      }
    }
    return {};
  },
});
```

### Frontend Usage

```tsx
import { LOGIN_MUTATION, REGISTER_MUTATION, ME_QUERY } from '@appforgeapps/shieldforge-graphql';
import { useMutation, useQuery } from '@apollo/client';
import { useAuth } from '@appforgeapps/shieldforge-react';

function LoginForm() {
  const [login, { loading, error }] = useMutation(LOGIN_MUTATION);
  const { login: authLogin } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    const { data } = await login({
      variables: { input: { email, password } }
    });
    
    authLogin(data.login.token, data.login.user);
  };

  return (/* your form */);
}

function Profile() {
  const { data, loading } = useQuery(ME_QUERY);
  
  if (loading) return <div>Loading...</div>;
  
  return <div>Email: {data.me.email}</div>;
}
```

## Type Definitions

The package exports complete GraphQL schema:

- `User` type
- `AuthPayload` type
- `LoginInput`, `RegisterInput`, `UpdateProfileInput`, `UpdatePasswordInput`
- `Query.me` - Get current user
- `Query.checkPasswordStrength` - Check password strength
- `Mutation.login` - Login user
- `Mutation.register` - Register user
- `Mutation.logout` - Logout user
- `Mutation.updateProfile` - Update user profile
- `Mutation.updatePassword` - Change password
- `Mutation.requestPasswordReset` - Request password reset
- `Mutation.resetPassword` - Reset password with code

## Documents

Pre-built query/mutation strings:

```typescript
import {
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  LOGOUT_MUTATION,
  ME_QUERY,
  UPDATE_PROFILE_MUTATION,
  UPDATE_PASSWORD_MUTATION,
  REQUEST_PASSWORD_RESET_MUTATION,
  RESET_PASSWORD_MUTATION,
  CHECK_PASSWORD_STRENGTH_QUERY,
  USER_FIELDS_FRAGMENT,
  AUTH_PAYLOAD_FRAGMENT,
} from '@appforgeapps/shieldforge-graphql';
```

## Extending the Schema

You can extend the User type with your own fields:

```graphql
extend type User {
  customField: String
  anotherField: Int
}
```

Then update your data source to return the additional fields.

## Data Source Interface

```typescript
interface AuthDataSource {
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(input: RegisterInput & { passwordHash: string }): Promise<User>;
  updateUser(id: string, input: Partial<User>): Promise<User>;
  createPasswordReset(userId: string, code: string, expiresAt: Date): Promise<void>;
  getPasswordReset(code: string): Promise<{ userId: string; expiresAt: Date } | null>;
  deletePasswordReset(code: string): Promise<void>;
}
```

## License

MIT
