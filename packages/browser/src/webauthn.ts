import { base64UrlToBuffer, base64UrlToUint8Array, bufferToBase64Url } from './encoding';

/**
 * Normalize registration options from server
 * Converts base64url strings to Uint8Array for WebAuthn API
 */
export function normalizeRegistrationOptions(options: any): PublicKeyCredentialCreationOptions {
  return {
    ...options,
    challenge: base64UrlToUint8Array(options.challenge),
    user: {
      ...options.user,
      id: base64UrlToUint8Array(options.user.id),
    },
    excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
      ...cred,
      id: base64UrlToUint8Array(cred.id),
    })),
  };
}

/**
 * Normalize authentication options from server
 * Converts base64url strings to Uint8Array for WebAuthn API
 */
export function normalizeAuthenticationOptions(options: any): PublicKeyCredentialRequestOptions {
  return {
    ...options,
    challenge: base64UrlToUint8Array(options.challenge),
    allowCredentials: options.allowCredentials?.map((cred: any) => ({
      ...cred,
      id: base64UrlToUint8Array(cred.id),
    })),
  };
}

/**
 * Convert PublicKeyCredential to JSON-serializable format
 */
export function publicKeyCredentialToJSON(credential: PublicKeyCredential): any {
  const response = credential.response as AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;
  
  if ('attestationObject' in response) {
    // Registration response
    return {
      id: credential.id,
      rawId: bufferToBase64Url(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: bufferToBase64Url(response.clientDataJSON),
        attestationObject: bufferToBase64Url(response.attestationObject),
        transports: (response as AuthenticatorAttestationResponse).getTransports?.() || [],
      },
    };
  } else {
    // Authentication response
    const assertionResponse = response as AuthenticatorAssertionResponse;
    return {
      id: credential.id,
      rawId: bufferToBase64Url(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: bufferToBase64Url(assertionResponse.clientDataJSON),
        authenticatorData: bufferToBase64Url(assertionResponse.authenticatorData),
        signature: bufferToBase64Url(assertionResponse.signature),
        userHandle: assertionResponse.userHandle ? bufferToBase64Url(assertionResponse.userHandle) : null,
      },
    };
  }
}

/**
 * Start WebAuthn registration flow
 */
export async function startRegistration(options: any): Promise<any> {
  const normalizedOptions = normalizeRegistrationOptions(options);
  
  const credential = await navigator.credentials.create({
    publicKey: normalizedOptions,
  }) as PublicKeyCredential;

  if (!credential) {
    throw new Error('Failed to create credential');
  }

  return publicKeyCredentialToJSON(credential);
}

/**
 * Start WebAuthn authentication flow
 */
export async function startAuthentication(options: any): Promise<any> {
  const normalizedOptions = normalizeAuthenticationOptions(options);
  
  const credential = await navigator.credentials.get({
    publicKey: normalizedOptions,
  }) as PublicKeyCredential;

  if (!credential) {
    throw new Error('Failed to get credential');
  }

  return publicKeyCredentialToJSON(credential);
}

/**
 * Check if WebAuthn is supported in the browser
 */
export function isWebAuthnSupported(): boolean {
  return !!(
    typeof navigator !== 'undefined' &&
    navigator.credentials &&
    typeof navigator.credentials.create === 'function' &&
    typeof navigator.credentials.get === 'function' &&
    typeof window !== 'undefined' &&
    window.PublicKeyCredential
  );
}

/**
 * Check if platform authenticator is available (e.g., Touch ID, Face ID, Windows Hello)
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false;
  }

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}
