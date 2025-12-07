import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type GenerateAuthenticationOptionsOpts,
  type VerifyAuthenticationResponseOpts,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/types';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { PasskeyConfig } from '@shieldforge/types';

export interface AuthenticationOptions {
  challenge: string;
  timeout?: number;
  rpId: string;
  allowCredentials?: Array<{
    id: string;
    type: 'public-key';
    transports?: AuthenticatorTransportFuture[];
  }>;
  userVerification?: 'required' | 'preferred' | 'discouraged';
}

/**
 * Generate authentication options for WebAuthn
 */
export async function generatePasskeyAuthenticationOptions(
  config: PasskeyConfig,
  allowCredentials?: Array<{
    id: string;
    transports?: AuthenticatorTransportFuture[];
  }>
): Promise<AuthenticationOptions> {
  const opts: GenerateAuthenticationOptionsOpts = {
    rpID: config.rpId,
    allowCredentials: allowCredentials?.map(cred => ({
      id: isoBase64URL.toBuffer(cred.id),
      type: 'public-key' as const,
      transports: cred.transports,
    })),
    userVerification: 'preferred',
  };

  const options = await generateAuthenticationOptions(opts);

  return {
    challenge: options.challenge,
    timeout: options.timeout,
    rpId: config.rpId,
    allowCredentials: options.allowCredentials,
    userVerification: options.userVerification,
  };
}

/**
 * Verify authentication response from WebAuthn
 */
export async function verifyPasskeyAuthentication(
  config: PasskeyConfig,
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  authenticator: {
    credentialId: string;
    publicKey: string;
    counter: number;
  }
): Promise<VerifiedAuthenticationResponse> {
  // Convert base64url string to Uint8Array
  const credentialPublicKey = isoBase64URL.toBuffer(authenticator.publicKey);
  const credentialID = isoBase64URL.toBuffer(authenticator.credentialId);

  const opts: VerifyAuthenticationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: config.origin,
    expectedRPID: config.rpId,
    authenticator: {
      credentialID,
      credentialPublicKey,
      counter: authenticator.counter,
    },
  };

  return verifyAuthenticationResponse(opts);
}
