# @shieldforge/types

Shared TypeScript types and interfaces for the ShieldForge authentication library.

## Installation

```bash
npm install @shieldforge/types
```

## Usage

```typescript
import type {
  User,
  AuthUser,
  AuthPayload,
  LoginInput,
  RegisterInput,
  UserAccountStatus,
  PasswordStrength,
  ShieldForgeConfig,
} from '@shieldforge/types';
```

## Exported Types

### User Types

- `User` - Complete user interface with all fields including sensitive data
- `AuthUser` - Sanitized user interface for client-side use (no passwordHash)
- `UserAccountStatus` - Enum for user account status (ACTIVE, INACTIVE, SUSPENDED, PENDING)

### Authentication Types

- `LoginInput` - Input type for login operations
- `RegisterInput` - Input type for registration
- `UpdateProfileInput` - Input type for profile updates
- `UpdatePasswordInput` - Input type for password changes
- `AuthPayload` - Response type for auth operations (user + token)
- `JwtPayload` - JWT token payload structure

### Configuration Types

- `ShieldForgeConfig` - Configuration for @shieldforge/core
- `AuthProviderConfig` - Configuration for @shieldforge/react
- `PasskeyConfig` - Configuration for @shieldforge/passkey
- `SmtpConfig` - SMTP configuration for email sending

### Other Types

- `Session` - Session interface
- `PasswordStrength` - Password strength result (score + feedback)
- `PasskeyCredential` - Passkey credential interface
- `Challenge` - WebAuthn challenge interface

## License

MIT
