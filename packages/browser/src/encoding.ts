/**
 * Encode a buffer to base64url
 */
export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decode a base64url string to buffer
 */
export function base64UrlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  return bytes.buffer;
}

/**
 * Convert base64url string to Uint8Array
 */
export function base64UrlToUint8Array(base64url: string): Uint8Array {
  return new Uint8Array(base64UrlToBuffer(base64url));
}

/**
 * Convert Uint8Array to base64url string
 */
export function uint8ArrayToBase64Url(uint8Array: Uint8Array): string {
  return bufferToBase64Url(uint8Array.buffer as ArrayBuffer);
}
