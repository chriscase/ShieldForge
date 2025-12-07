# @shieldforge/core

Backend authentication utilities for Node.js applications.

## Installation

```bash
npm install @shieldforge/core
```

Optional peer dependencies:
```bash
npm install nodemailer  # For email functionality
```

## Quick Start

```typescript
import { ShieldForge } from '@shieldforge/core';

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
```

## Features

### Password Hashing

```typescript
// Hash a password
const hash = await auth.hashPassword('mypassword');

// Verify a password
const isValid = await auth.verifyPassword('mypassword', hash);
```

### JWT Tokens

```typescript
// Generate a token
const token = auth.generateToken({
  userId: user.id,
  email: user.email
});

// Verify a token
const payload = auth.verifyToken(token);

// Decode without verification (use with caution)
const decoded = auth.decodeToken(token);
```

### Password Strength

```typescript
const strength = auth.calculatePasswordStrength('MyP@ssw0rd');
// Returns: { score: 0-4, feedback: string[] }
```

### User Sanitization

```typescript
const sanitizedUser = auth.sanitizeUser(userFromDB);
// Removes passwordHash and other sensitive fields
```

### Reset Codes

```typescript
// Generate a numeric code
const code = auth.generateResetCode(6);  // "123456"

// Generate a secure token
const token = auth.generateSecureToken(32);
```

### Email

```typescript
// Send password reset email
await auth.sendPasswordResetEmail(
  user.email,
  resetCode,
  'https://myapp.com/reset?code=' + resetCode
);

// Send custom email
await auth.sendEmail(
  user.email,
  'Welcome!',
  'Welcome to our app!',
  '<h1>Welcome to our app!</h1>'
);
```

## Tree-Shakeable Exports

You can also import individual functions for better tree-shaking:

```typescript
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  calculatePasswordStrength,
  sanitizeUser,
} from '@shieldforge/core';
```

## Configuration

```typescript
interface ShieldForgeConfig {
  jwtSecret: string;           // Required: Secret for JWT signing
  jwtExpiresIn?: string;       // Optional: Token expiration (default: '7d')
  saltRounds?: number;         // Optional: bcrypt salt rounds (default: 10)
  smtp?: {                     // Optional: SMTP configuration
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    secure?: boolean;
  };
}
```

## License

MIT
