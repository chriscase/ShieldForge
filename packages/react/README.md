# @shieldforge/react

React hooks and components for authentication.

## Installation

```bash
npm install @shieldforge/react
```

Peer dependencies:
```bash
npm install react react-dom
```

## Quick Start

### 1. Wrap your app with AuthProvider

```tsx
import { AuthProvider } from '@shieldforge/react';

function App() {
  return (
    <AuthProvider
      config={{
        storageKey: 'myapp.token',
        enableCrossTabSync: true,
      }}
    >
      <YourApp />
    </AuthProvider>
  );
}
```

### 2. Use the useAuth hook

```tsx
import { useAuth } from '@shieldforge/react';

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
```

### 3. Protect routes with RequireAuth

```tsx
import { RequireAuth } from '@shieldforge/react';

function ProtectedRoute() {
  return (
    <RequireAuth fallback={<LoginPage />}>
      <Dashboard />
    </RequireAuth>
  );
}
```

## API Reference

### AuthProvider

Props:
- `children`: React.ReactNode (required)
- `config`: AuthProviderConfig (optional)
- `onLogin`: (token, user) => void (optional)
- `onLogout`: () => void (optional)
- `refreshAuth`: () => Promise<{token, user} | null> (optional)

Config:
```typescript
interface AuthProviderConfig {
  storageKey?: string;              // Default: 'shieldforge.token'
  pollInterval?: number;            // Session polling interval in ms
  enableCrossTabSync?: boolean;     // Default: true
  initialToken?: string | null;     // For SSR/testing
  initialUser?: AuthUser | null;    // For SSR/testing
}
```

### useAuth Hook

Returns:
```typescript
{
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
  refreshAuth?: () => Promise<void>;
}
```

### RequireAuth Component

Props:
- `children`: React.ReactNode (required)
- `fallback`: React.ReactNode (optional)
- `redirectTo`: string (optional)
- `onUnauthorized`: () => void (optional)

### withAuth HOC

```tsx
import { withAuth, WithAuthProps } from '@shieldforge/react';

interface Props extends WithAuthProps {
  // your other props
}

function MyComponent({ user, isAuthenticated }: Props) {
  return <div>{user?.email}</div>;
}

export default withAuth(MyComponent);
```

## Features

### Cross-Tab Synchronization

Automatically syncs login/logout across browser tabs when `enableCrossTabSync` is enabled.

### Session Polling

Optionally poll for session validation:

```tsx
<AuthProvider
  config={{ pollInterval: 60000 }} // Poll every minute
  refreshAuth={async () => {
    const res = await fetch('/api/auth/refresh');
    if (res.ok) {
      return await res.json();
    }
    return null;
  }}
>
  {children}
</AuthProvider>
```

### SSR Support

```tsx
<AuthProvider
  config={{
    initialToken: serverToken,
    initialUser: serverUser,
  }}
>
  {children}
</AuthProvider>
```

## License

MIT
