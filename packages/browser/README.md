# @appforgeapps/shieldforge-browser

Client-side WebAuthn utilities for passwordless authentication in the browser.

## Installation

```bash
npm install @appforgeapps/shieldforge-browser
```

## Quick Start

```typescript
import {
  startRegistration,
  startAuthentication,
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
} from '@appforgeapps/shieldforge-browser';
```

## Registration Flow

```typescript
async function registerPasskey() {
  // Check browser support
  if (!isWebAuthnSupported()) {
    alert('WebAuthn is not supported in this browser');
    return;
  }

  try {
    // Get registration options from your server
    const options = await fetch('/api/passkey/register-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id })
    }).then(r => r.json());
    
    // Start registration
    const credential = await startRegistration(options);
    
    // Send credential to server for verification
    const response = await fetch('/api/passkey/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credential),
    });
    
    if (response.ok) {
      alert('Passkey registered successfully!');
    }
  } catch (error) {
    console.error('Registration failed:', error);
  }
}
```

## Authentication Flow

```typescript
async function authenticateWithPasskey() {
  if (!isWebAuthnSupported()) {
    alert('WebAuthn is not supported in this browser');
    return;
  }

  try {
    // Get authentication options from your server
    const options = await fetch('/api/passkey/auth-options', {
      method: 'POST',
    }).then(r => r.json());
    
    // Start authentication
    const credential = await startAuthentication(options);
    
    // Send credential to server for verification
    const response = await fetch('/api/passkey/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credential),
    });
    
    if (response.ok) {
      const { token, user } = await response.json();
      // Store token and user in your auth state
      login(token, user);
    }
  } catch (error) {
    console.error('Authentication failed:', error);
  }
}
```

## Browser Support Check

```typescript
// Check if WebAuthn is supported
if (isWebAuthnSupported()) {
  console.log('WebAuthn is supported');
}

// Check if platform authenticator is available
const hasPlatformAuth = await isPlatformAuthenticatorAvailable();
if (hasPlatformAuth) {
  console.log('Platform authenticator (Touch ID, Face ID, Windows Hello) is available');
}
```

## Encoding Utilities

```typescript
import {
  bufferToBase64Url,
  base64UrlToBuffer,
  base64UrlToUint8Array,
  uint8ArrayToBase64Url,
} from '@appforgeapps/shieldforge-browser';

// Convert buffer to base64url
const base64url = bufferToBase64Url(arrayBuffer);

// Convert base64url to buffer
const buffer = base64UrlToBuffer(base64urlString);

// Convert base64url to Uint8Array
const uint8Array = base64UrlToUint8Array(base64urlString);

// Convert Uint8Array to base64url
const base64url2 = uint8ArrayToBase64Url(uint8Array);
```

## Manual WebAuthn Flow

If you need more control:

```typescript
import {
  normalizeRegistrationOptions,
  normalizeAuthenticationOptions,
  publicKeyCredentialToJSON,
} from '@appforgeapps/shieldforge-browser';

// Registration
const normalizedOptions = normalizeRegistrationOptions(serverOptions);
const credential = await navigator.credentials.create({
  publicKey: normalizedOptions
}) as PublicKeyCredential;
const json = publicKeyCredentialToJSON(credential);

// Authentication
const normalizedAuthOptions = normalizeAuthenticationOptions(serverOptions);
const authCredential = await navigator.credentials.get({
  publicKey: normalizedAuthOptions
}) as PublicKeyCredential;
const authJson = publicKeyCredentialToJSON(authCredential);
```

## API Reference

### Registration

- `startRegistration(options)` - Start WebAuthn registration
- `normalizeRegistrationOptions(options)` - Convert server options to WebAuthn format

### Authentication

- `startAuthentication(options)` - Start WebAuthn authentication
- `normalizeAuthenticationOptions(options)` - Convert server options to WebAuthn format

### Utilities

- `isWebAuthnSupported()` - Check if WebAuthn is supported
- `isPlatformAuthenticatorAvailable()` - Check if platform authenticator is available
- `publicKeyCredentialToJSON(credential)` - Convert credential to JSON

### Encoding

- `bufferToBase64Url(buffer)` - Convert ArrayBuffer to base64url
- `base64UrlToBuffer(string)` - Convert base64url to ArrayBuffer
- `base64UrlToUint8Array(string)` - Convert base64url to Uint8Array
- `uint8ArrayToBase64Url(array)` - Convert Uint8Array to base64url

## Browser Compatibility

WebAuthn is supported in:
- Chrome 67+
- Firefox 60+
- Safari 13+
- Edge 18+

Platform authenticators (Touch ID, Face ID, Windows Hello) availability varies by device and OS.

## License

MIT
