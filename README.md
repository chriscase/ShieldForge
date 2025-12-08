# ShieldForge

A comprehensive, highly reusable authentication library for React/Node/GraphQL applications.

## Overview

ShieldForge provides a complete authentication solution with modular packages that can be used together or independently. Built with TypeScript for type safety and designed for easy integration into any React/Node/GraphQL project.

## Features

- 🔐 **Complete Authentication**: JWT-based auth with password hashing and strength validation
- ⚛️ **React Integration**: Hooks and components for seamless React integration
- 🚀 **GraphQL Ready**: Schema definitions and resolvers for GraphQL APIs
- 🔑 **Passkey Support**: WebAuthn/FIDO2 for passwordless authentication
- 📧 **Email Support**: Built-in password reset email functionality
- 🎯 **Type-Safe**: Full TypeScript support with exported types
- 📦 **Modular**: Use only what you need
- ⚙️ **Configurable**: Flexible configuration for all settings
- ✅ **Well-Tested**: 131 unit tests with 100% pass rate

## Packages

ShieldForge is organized as a monorepo with the following packages:

### [@shieldforge/types](./packages/types)
Shared TypeScript interfaces and types used across all packages.

```bash
npm install @shieldforge/types
```

### [@shieldforge/core](./packages/core)
Backend authentication utilities for Node.js applications.

```bash
npm install @shieldforge/core
```

**Features:**
- Password hashing with bcrypt
- JWT token generation & verification
- Password strength calculation
- User sanitization
- Reset code generation
- Email sending (nodemailer)

### [@shieldforge/react](./packages/react)
React hooks and components for authentication.

```bash
npm install @shieldforge/react
```

**Features:**
- `AuthProvider` context provider
- `useAuth` hook for accessing auth state
- `RequireAuth` component for protected routes
- `withAuth` HOC wrapper

### [@shieldforge/graphql](./packages/graphql)
GraphQL schema definitions and resolvers.

```bash
npm install @shieldforge/graphql
```

**Features:**
- Complete authentication type definitions (SDL)
- Resolver factories with dependency injection
- Query/Mutation document exports for clients
- Composable schema fragments

### [@shieldforge/passkey](./packages/passkey)
WebAuthn/FIDO2 server-side utilities.

```bash
npm install @shieldforge/passkey
```

**Features:**
- Registration options generation
- Registration verification
- Authentication options generation
- Authentication verification
- Challenge management with TTL

### [@shieldforge/browser](./packages/browser)
Client-side WebAuthn utilities.

```bash
npm install @shieldforge/browser
```

**Features:**
- Base64URL encoding/decoding
- WebAuthn options normalization
- Browser compatibility checks
- Registration and authentication flows

## Quick Start

### Basic Setup (React + Node + JWT)

#### Backend Setup

```typescript
import { ShieldForge } from '@shieldforge/core';

// Initialize ShieldForge
const auth = new ShieldForge({
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: '7d',
  saltRounds: 10,
  smtp: {
    host: process.env.SMTP_HOST!,
    port: 587,
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
    from: 'noreply@myapp.com'
  }
});

// Hash a password
const passwordHash = await auth.hashPassword('mypassword');

// Verify a password
const isValid = await auth.verifyPassword('mypassword', passwordHash);

// Generate a JWT token
const token = auth.generateToken({
  userId: user.id,
  email: user.email
});

// Verify a token
const payload = auth.verifyToken(token);
```

#### Frontend Setup (React)

```tsx
import { AuthProvider, useAuth, RequireAuth } from '@shieldforge/react';

// Wrap your app with AuthProvider
function App() {
  return (
    <AuthProvider
      config={{
        storageKey: 'myapp.token',
        enableCrossTabSync: true,
      }}
    >
      <Routes />
    </AuthProvider>
  );
}

// Use the auth hook in components
function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// Protect routes with RequireAuth
function ProtectedRoute() {
  return (
    <RequireAuth fallback={<LoginPage />}>
      <Dashboard />
    </RequireAuth>
  );
}
```

### GraphQL Integration

#### Backend (GraphQL Server)

```typescript
import { createResolvers, typeDefs } from '@shieldforge/graphql';
import { ShieldForge } from '@shieldforge/core';

const auth = new ShieldForge({
  jwtSecret: process.env.JWT_SECRET!,
});

// Create resolvers with your data source
const resolvers = createResolvers({
  dataSource: {
    getUserById: async (id) => { /* your DB logic */ },
    getUserByEmail: async (email) => { /* your DB logic */ },
    createUser: async (input) => { /* your DB logic */ },
    updateUser: async (id, input) => { /* your DB logic */ },
    createPasswordReset: async (userId, code, expiresAt) => { /* your DB logic */ },
    getPasswordReset: async (code) => { /* your DB logic */ },
    deletePasswordReset: async (code) => { /* your DB logic */ },
  },
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

// Use with Apollo Server or any GraphQL server
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
        // Invalid token
      }
    }
    return {};
  },
});
```

#### Frontend (Apollo Client)

```tsx
import { LOGIN_MUTATION, REGISTER_MUTATION, ME_QUERY } from '@shieldforge/graphql';
import { useMutation, useQuery } from '@apollo/client';

function LoginForm() {
  const [login, { loading }] = useMutation(LOGIN_MUTATION);
  const { login: authLogin } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    const { data } = await login({
      variables: { input: { email, password } }
    });
    
    authLogin(data.login.token, data.login.user);
  };

  return (/* your form JSX */);
}
```

### Adding Passkey Support

#### Backend

```typescript
import { PasskeyService } from '@shieldforge/passkey';

const passkeys = new PasskeyService({
  rpName: 'My App',
  rpId: 'myapp.com',
  origin: 'https://myapp.com',
  challengeTTL: 5 * 60 * 1000 // 5 minutes
});

// Generate registration options
const registrationOptions = await passkeys.generateRegistrationOptions({
  id: user.id,
  email: user.email,
  name: user.name,
});

// Verify registration
const verification = await passkeys.verifyRegistration(
  clientResponse,
  expectedChallenge
);
```

#### Frontend

```tsx
import { startRegistration, isWebAuthnSupported } from '@shieldforge/browser';

async function registerPasskey() {
  if (!isWebAuthnSupported()) {
    alert('WebAuthn is not supported in this browser');
    return;
  }

  // Get registration options from your server
  const options = await fetch('/api/passkey/register-options').then(r => r.json());
  
  // Start registration
  const credential = await startRegistration(options);
  
  // Send credential to server for verification
  await fetch('/api/passkey/register', {
    method: 'POST',
    body: JSON.stringify(credential),
  });
}
```

## Configuration Reference

### ShieldForge Core

```typescript
interface ShieldForgeConfig {
  jwtSecret: string;           // Required: Secret for JWT signing
  jwtExpiresIn?: string;       // Optional: Token expiration (default: '7d')
  saltRounds?: number;         // Optional: bcrypt salt rounds (default: 10)
  smtp?: {                     // Optional: SMTP configuration for emails
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    secure?: boolean;
  };
}
```

### Auth Provider

```typescript
interface AuthProviderConfig {
  storageKey?: string;                  // Token storage key (default: 'shieldforge.token')
  pollInterval?: number;                // Session polling interval in ms
  enableCrossTabSync?: boolean;         // Enable cross-tab sync (default: true)
  initialToken?: string | null;         // Initial token for SSR/testing
  initialUser?: AuthUser | null;        // Initial user for SSR/testing
}
```

### Passkey Service

```typescript
interface PasskeyConfig {
  rpName: string;           // Required: Relying party name
  rpId: string;             // Required: Relying party ID (domain)
  origin: string;           // Required: Origin URL
  challengeTTL?: number;    // Optional: Challenge TTL in ms (default: 5 minutes)
}
```

## Examples

See the [examples directory](./examples) for complete working examples:

- Basic JWT authentication
- React + Apollo Client integration
- Passkey authentication
- Password reset flow
- Protected routes

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Clean build artifacts
npm run clean

# Run tests
npm run test
```

## Testing

ShieldForge includes comprehensive unit tests for all packages:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

**Test Coverage:**
- 131 total tests across 6 packages
- 100% pass rate
- Covers all core functionality, React components, GraphQL resolvers, and WebAuthn flows

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT © chriscase

## Support

- 📖 [Documentation](./docs)
- 🐛 [Issue Tracker](https://github.com/chriscase/ShieldForge/issues)
- 💬 [Discussions](https://github.com/chriscase/ShieldForge/discussions)
