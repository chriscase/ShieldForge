import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type GenerateRegistrationOptionsOpts,
  type VerifyRegistrationResponseOpts,
  type VerifiedRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/types';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { PasskeyConfig } from '@appforgeapps/shieldforge-types';

export interface RegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    alg: number;
    type: 'public-key';
  }>;
  timeout?: number;
  attestation?: 'none' | 'indirect' | 'direct' | 'enterprise';
  excludeCredentials?: Array<{
    id: string;
    type: 'public-key';
    transports?: AuthenticatorTransportFuture[];
  }>;
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    requireResidentKey?: boolean;
    residentKey?: 'discouraged' | 'preferred' | 'required';
    userVerification?: 'required' | 'preferred' | 'discouraged';
  };
}

/**
 * Generate registration options for WebAuthn
 */
export async function generatePasskeyRegistrationOptions(
  config: PasskeyConfig,
  user: {
    id: string;
    email: string;
    name?: string;
  },
  excludeCredentials?: Array<{
    id: string;
    transports?: AuthenticatorTransportFuture[];
  }>
): Promise<RegistrationOptions> {
  const opts: GenerateRegistrationOptionsOpts = {
    rpName: config.rpName,
    rpID: config.rpId,
    userID: user.id,
    userName: user.email,
    userDisplayName: user.name || user.email,
    attestationType: 'none',
    excludeCredentials: excludeCredentials?.map(cred => ({
      id: isoBase64URL.toBuffer(cred.id),
      type: 'public-key' as const,
      transports: cred.transports,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  };

  const options = await generateRegistrationOptions(opts);

  return {
    challenge: options.challenge,
    rp: {
      name: config.rpName,
      id: config.rpId,
    },
    user: {
      id: user.id,
      name: user.email,
      displayName: user.name || user.email,
    },
    pubKeyCredParams: options.pubKeyCredParams,
    timeout: options.timeout,
    attestation: options.attestation,
    excludeCredentials: options.excludeCredentials,
    authenticatorSelection: options.authenticatorSelection,
  };
}

/**
 * Verify registration response from WebAuthn
 */
export async function verifyPasskeyRegistration(
  config: PasskeyConfig,
  response: RegistrationResponseJSON,
  expectedChallenge: string
): Promise<VerifiedRegistrationResponse> {
  const opts: VerifyRegistrationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: config.origin,
    expectedRPID: config.rpId,
  };

  return verifyRegistrationResponse(opts);
}
