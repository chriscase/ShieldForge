export {
  bufferToBase64Url,
  base64UrlToBuffer,
  base64UrlToUint8Array,
  uint8ArrayToBase64Url,
} from './encoding';

export {
  normalizeRegistrationOptions,
  normalizeAuthenticationOptions,
  publicKeyCredentialToJSON,
  startRegistration,
  startAuthentication,
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
} from './webauthn';
