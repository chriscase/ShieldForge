# ShieldForge

A comprehensive, highly reusable authentication library for React/Node/GraphQL applications.

## 📦 NPM Packages

All packages are published under the `@appforgeapps` scope on NPM:

```bash
# Install core authentication
npm install @appforgeapps/shieldforge-core @appforgeapps/shieldforge-types

# Install React integration
npm install @appforgeapps/shieldforge-react

# Install GraphQL support
npm install @appforgeapps/shieldforge-graphql

# Install Passkey/WebAuthn support (optional)
npm install @appforgeapps/shieldforge-passkey @appforgeapps/shieldforge-browser
```

## 🚀 Quick Start

See the [complete example](./examples/complete-app) for a full implementation guide, or follow this quick start:

### Backend Setup (Node.js + GraphQL)

```typescript
import { ShieldForge } from '@appforgeapps/shieldforge-core';
import { createResolvers, typeDefs } from '@appforgeapps/shieldforge-graphql';

// 1. Configure ShieldForge
const auth = new ShieldForge({
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: '7d',
  saltRounds: 10,
});

// 2. Create GraphQL resolvers
const resolvers = createResolvers({
  dataSource: {
    getUserById: (id) => db.findUser(id),
    getUserByEmail: (email) => db.findUserByEmail(email),
    createUser: (data) => db.createUser(data),
    // ... other database operations
  },
  auth: {
    hashPassword: (pwd) => auth.hashPassword(pwd),
    verifyPassword: (pwd, hash) => auth.verifyPassword(pwd, hash),
    generateToken: (payload) => auth.generateToken(payload),
    verifyToken: (token) => auth.verifyToken(token),
    // ... other auth operations
  },
});

// 3. Use with Apollo Server
const server = new ApolloServer({ typeDefs, resolvers });
```

### Frontend Setup (React)

```tsx
import { AuthProvider, useAuth, RequireAuth } from '@appforgeapps/shieldforge-react';
import { LOGIN_MUTATION } from '@appforgeapps/shieldforge-graphql';

// 1. Wrap your app with AuthProvider
function App() {
  return (
    <AuthProvider config={{ storageKey: 'auth.token', enableCrossTabSync: true }}>
      <YourApp />
    </AuthProvider>
  );
}

// 2. Use the useAuth hook in components
function LoginForm() {
  const { login } = useAuth();
  const [loginMutation] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => login(data.login.token, data.login.user),
  });
  // ... form implementation
}

// 3. Protect routes with RequireAuth
function Dashboard() {
  return (
    <RequireAuth fallback={<LoginPage />}>
      <ProtectedContent />
    </RequireAuth>
  );
}

// 4. Access auth state anywhere
function UserProfile() {
  const { user, isAuthenticated, logout } = useAuth();
  return <div>Welcome {user?.email}</div>;
}
```

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

ShieldForge is organized as a monorepo with the following packages, all published under `@appforgeapps` on NPM:

### [@appforgeapps/shieldforge-types](./packages/types)
Shared TypeScript interfaces and types used across all packages.

```bash
npm install @appforgeapps/shieldforge-types
```

### [@appforgeapps/shieldforge-core](./packages/core)
Backend authentication utilities for Node.js applications.

```bash
npm install @appforgeapps/shieldforge-core
```

**Features:**
- Password hashing with bcrypt
- JWT token generation & verification
- Password strength calculation
- User sanitization
- Reset code generation
- Email sending (nodemailer)

### [@appforgeapps/shieldforge-react](./packages/react)
React hooks and components for authentication.

```bash
npm install @appforgeapps/shieldforge-react
```

**Features:**
- `AuthProvider` context provider
- `useAuth` hook for accessing auth state
- `RequireAuth` component for protected routes
- `withAuth` HOC wrapper

### [@appforgeapps/shieldforge-graphql](./packages/graphql)
GraphQL schema definitions and resolvers.

```bash
npm install @appforgeapps/shieldforge-graphql
```

**Features:**
- Complete authentication type definitions (SDL)
- Resolver factories with dependency injection
- Query/Mutation document exports for clients
- Composable schema fragments

### [@appforgeapps/shieldforge-passkey](./packages/passkey)
WebAuthn/FIDO2 server-side utilities.

```bash
npm install @appforgeapps/shieldforge-passkey
```

**Features:**
- Registration options generation
- Registration verification
- Authentication options generation
- Authentication verification
- Challenge management with TTL

### [@appforgeapps/shieldforge-browser](./packages/browser)
Client-side WebAuthn utilities.

```bash
npm install @appforgeapps/shieldforge-browser
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
import { ShieldForge } from '@appforgeapps/shieldforge-core';

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
import { AuthProvider, useAuth, RequireAuth } from '@appforgeapps/shieldforge-react';

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
import { createResolvers, typeDefs } from '@appforgeapps/shieldforge-graphql';
import { ShieldForge } from '@appforgeapps/shieldforge-core';

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
import { LOGIN_MUTATION, REGISTER_MUTATION, ME_QUERY } from '@appforgeapps/shieldforge-graphql';
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
import { PasskeyService } from '@appforgeapps/shieldforge-passkey';

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
import { startRegistration, isWebAuthnSupported } from '@appforgeapps/shieldforge-browser';

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

Check out the [complete example app](./examples/complete-app) for a full implementation guide with:

- **Backend**: Express + GraphQL server with ShieldForge
- **Frontend**: React app with authentication
- **Detailed comments**: Every file extensively documented
- **Production-ready code**: Copy and adapt to your needs

The example includes:
- Login and registration
- Password reset flow
- Protected routes
- Profile management
- WebAuthn/Passkey support
- Apollo Client integration

Each file in the example is a standalone tutorial showing exactly how to use ShieldForge in your application.

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

## Publishing to NPM

This library is published to NPM under the `@appforgeapps` scope. The repository uses npm workspaces with internal package dependencies configured to use the wildcard (`*`) version, which automatically resolves to local workspace packages during development and publishes correctly to NPM.

### Internal Dependencies

All internal package dependencies use the wildcard version specifier:

```json
{
  "dependencies": {
    "@appforgeapps/shieldforge-types": "*"
  }
}
```

This ensures that:
- During development, npm automatically resolves to the local workspace package
- During publishing, npm automatically converts to the actual published version
- During NPM registry lookup, no 404 errors occur when resolving unpublished versions

**Important**: When adding new internal package dependencies, always use `"*"` for workspace packages instead of version ranges like `"^1.0.0"`.

### Automated Publishing via GitHub Actions

The repository includes a GitHub Actions workflow (`.github/workflows/publish.yml`) that automatically publishes packages when a release is created:

1. **Create a GitHub release** with a version tag (e.g., `v1.0.1`)
2. The workflow will:
   - Validate the NPM_TOKEN is configured
   - Install dependencies
   - Update version numbers in all packages
   - Build all packages
   - Run tests
   - Publish packages in dependency order (types → browser → core/graphql/passkey/react)

**Prerequisites:**
- The `NPM_TOKEN` secret must be configured in GitHub repository settings:
  1. Create an NPM access token at https://www.npmjs.com/settings/tokens/new
     - Select **Automation** token type (recommended for CI/CD workflows)
     - Grant access to the `@appforgeapps` scope (required for publishing scoped packages)
  2. Go to your repository on GitHub
  3. Navigate to **Settings** → **Secrets and variables** → **Actions**
  4. Click **New repository secret**
  5. Name: `NPM_TOKEN`
  6. Value: Paste your NPM access token
- Ensure the token is not expired

The workflow publishes packages in the correct dependency order:
1. `@appforgeapps/shieldforge-types` (no dependencies)
2. `@appforgeapps/shieldforge-browser` (no internal dependencies)
3. All other packages that depend on types

### Manual Publishing

To manually publish packages:

```bash
# Build all packages
npm run build

# Run tests
npm test

# Publish in dependency order using workspace commands
npm publish --workspace=@appforgeapps/shieldforge-types --access public
npm publish --workspace=@appforgeapps/shieldforge-browser --access public
npm publish --workspace=@appforgeapps/shieldforge-core --access public
npm publish --workspace=@appforgeapps/shieldforge-graphql --access public
npm publish --workspace=@appforgeapps/shieldforge-passkey --access public
npm publish --workspace=@appforgeapps/shieldforge-react --access public
```

**Note**: You need an NPM account with access to the `@appforgeapps` scope.

## License

MIT © chriscase

## Support

- 📖 [Documentation](./README.md)
- 📦 [NPM Packages](https://www.npmjs.com/org/appforgeapps)
- 🐛 [Issue Tracker](https://github.com/chriscase/ShieldForge/issues)
- 💬 [Discussions](https://github.com/chriscase/ShieldForge/discussions)
- 💡 [Examples](./examples/complete-app)
