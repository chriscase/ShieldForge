import { generateKeyPair, exportPKCS8, exportJWK, calculateJwkThumbprint } from 'jose';
import type { RealmPublicJwk } from './types.js';

/**
 * Generate an RS256 realm signing keypair plus its RFC-7638 thumbprint `kid`.
 * The private key is returned as a PKCS#8 PEM (store it as a secret, never share);
 * the public JWK is what peers pin or fetch via JWKS.
 */
export async function generateRealmKeypair(): Promise<{
  kid: string;
  privateKeyPem: string;
  publicJwk: RealmPublicJwk;
}> {
  const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
  const privateKeyPem = await exportPKCS8(privateKey);
  const jwk = (await exportJWK(publicKey)) as RealmPublicJwk;
  jwk.alg = 'RS256';
  jwk.use = 'sig';
  const kid = await calculateJwkThumbprint(jwk as Parameters<typeof calculateJwkThumbprint>[0], 'sha256');
  jwk.kid = kid;
  return { kid, privateKeyPem, publicJwk: jwk };
}
