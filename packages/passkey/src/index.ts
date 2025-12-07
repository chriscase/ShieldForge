import { PasskeyConfig } from '@shieldforge/types';
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
} from './registration';
import {
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
} from './authentication';
import {
  storeChallenge,
  getChallenge,
  deleteChallenge,
  clearExpiredChallenges,
} from './challenges';

export class PasskeyService {
  private config: Required<PasskeyConfig>;

  constructor(config: PasskeyConfig) {
    this.config = {
      rpName: config.rpName,
      rpId: config.rpId,
      origin: config.origin,
      challengeTTL: config.challengeTTL || 5 * 60 * 1000, // 5 minutes default
    };
  }

  /**
   * Generate registration options
   */
  async generateRegistrationOptions(
    user: {
      id: string;
      email: string;
      name?: string;
    },
    excludeCredentials?: Array<{
      id: string;
      transports?: any[];
    }>
  ) {
    const options = await generatePasskeyRegistrationOptions(
      this.config,
      user,
      excludeCredentials
    );
    
    // Store challenge
    storeChallenge(options.challenge, user.id, this.config.challengeTTL);
    
    return options;
  }

  /**
   * Verify registration response
   */
  async verifyRegistration(response: any, expectedChallenge: string) {
    const challenge = getChallenge(expectedChallenge);
    if (!challenge) {
      throw new Error('Challenge not found or expired');
    }

    const verification = await verifyPasskeyRegistration(
      this.config,
      response,
      expectedChallenge
    );

    // Delete used challenge
    deleteChallenge(expectedChallenge);

    return verification;
  }

  /**
   * Generate authentication options
   */
  async generateAuthenticationOptions(
    allowCredentials?: Array<{
      id: string;
      transports?: any[];
    }>
  ) {
    const options = await generatePasskeyAuthenticationOptions(
      this.config,
      allowCredentials
    );

    // Store challenge
    storeChallenge(options.challenge, undefined, this.config.challengeTTL);

    return options;
  }

  /**
   * Verify authentication response
   */
  async verifyAuthentication(
    response: any,
    expectedChallenge: string,
    authenticator: {
      credentialId: string;
      publicKey: string;
      counter: number;
    }
  ) {
    const challenge = getChallenge(expectedChallenge);
    if (!challenge) {
      throw new Error('Challenge not found or expired');
    }

    const verification = await verifyPasskeyAuthentication(
      this.config,
      response,
      expectedChallenge,
      authenticator
    );

    // Delete used challenge
    deleteChallenge(expectedChallenge);

    return verification;
  }

  /**
   * Clear expired challenges manually
   */
  clearExpiredChallenges() {
    clearExpiredChallenges();
  }
}

// Export individual functions
export {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
  storeChallenge,
  getChallenge,
  deleteChallenge,
  clearExpiredChallenges,
};

export type { RegistrationOptions } from './registration';
export type { AuthenticationOptions } from './authentication';

// Re-export types
export type { PasskeyConfig, PasskeyCredential, Challenge } from '@shieldforge/types';
