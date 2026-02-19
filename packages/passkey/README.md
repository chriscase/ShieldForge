# @appforgeapps/shieldforge-passkey

WebAuthn/FIDO2 server-side utilities for passwordless authentication.

## Installation

```bash
npm install @appforgeapps/shieldforge-passkey
```

## Quick Start

```typescript
import { PasskeyService } from '@appforgeapps/shieldforge-passkey';

const passkeys = new PasskeyService({
  rpName: 'My App',
  rpId: 'myapp.com',
  origin: 'https://myapp.com',
  challengeTTL: 5 * 60 * 1000 // 5 minutes
});
```

## Registration Flow

### 1. Generate Registration Options

```typescript
const options = await passkeys.generateRegistrationOptions({
  id: user.id,
  email: user.email,
  name: user.name,
}, excludeCredentials);

// Send options to client
res.json(options);
```

### 2. Verify Registration Response

```typescript
const verification = await passkeys.verifyRegistration(
  clientResponse,
  expectedChallenge
);

if (verification.verified) {
  // Store credential in database
  await db.credential.create({
    data: {
      userId: user.id,
      credentialId: verification.registrationInfo.credentialID,
      publicKey: Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64'),
      counter: verification.registrationInfo.counter,
    }
  });
}
```

## Authentication Flow

### 1. Generate Authentication Options

```typescript
const options = await passkeys.generateAuthenticationOptions(
  allowCredentials // Optional: limit to specific credentials
);

res.json(options);
```

### 2. Verify Authentication Response

```typescript
// Get credential from database
const credential = await db.credential.findUnique({
  where: { credentialId: clientResponse.id }
});

const verification = await passkeys.verifyAuthentication(
  clientResponse,
  expectedChallenge,
  {
    credentialId: credential.credentialId,
    publicKey: credential.publicKey,
    counter: credential.counter,
  }
);

if (verification.verified) {
  // Update counter
  await db.credential.update({
    where: { id: credential.id },
    data: { counter: verification.authenticationInfo.newCounter }
  });
  
  // Generate session token
  const token = generateToken({ userId: credential.userId });
  res.json({ token });
}
```

## Configuration

```typescript
interface PasskeyConfig {
  rpName: string;           // Relying party name (e.g., "My App")
  rpId: string;             // Domain (e.g., "myapp.com")
  origin: string;           // Full origin URL (e.g., "https://myapp.com")
  challengeTTL?: number;    // Challenge TTL in ms (default: 5 minutes)
}
```

## Challenge Management

Challenges are automatically stored and validated:

```typescript
// Manually clear expired challenges
passkeys.clearExpiredChallenges();

// Or use individual functions
import { storeChallenge, getChallenge, deleteChallenge } from '@appforgeapps/shieldforge-passkey';

storeChallenge(challenge, userId, ttl);
const stored = getChallenge(challenge);
deleteChallenge(challenge);
```

## API Reference

### PasskeyService

- `generateRegistrationOptions(user, excludeCredentials?)` - Generate registration options
- `verifyRegistration(response, expectedChallenge)` - Verify registration
- `generateAuthenticationOptions(allowCredentials?)` - Generate authentication options
- `verifyAuthentication(response, expectedChallenge, authenticator)` - Verify authentication
- `clearExpiredChallenges()` - Clear expired challenges

### Individual Functions

```typescript
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
} from '@appforgeapps/shieldforge-passkey';
```

## Security Considerations

1. Always validate the challenge before verification
2. Store challenges with appropriate TTL (5 minutes recommended)
3. Update the credential counter after each authentication
4. Validate the origin and RP ID match your configuration
5. Consider rate limiting registration/authentication attempts

## License

MIT
