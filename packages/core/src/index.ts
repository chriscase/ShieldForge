import { ShieldForgeConfig, JwtPayload, PasswordStrength, AuthUser, User } from '@appforgeapps/shieldforge-types';
import { hashPassword, verifyPassword } from './password';
import { generateToken, verifyToken, decodeToken, type JwtVerifyOptions } from './jwt';
import { calculatePasswordStrength } from './strength';
import { sendPasswordResetEmail, sendEmail } from './email';
import { sanitizeUser, generateResetCode, generateSecureToken, hashResetCode, verifyResetCode } from './utils';

/**
 * Main ShieldForge class for authentication operations
 */
export class ShieldForge {
  private config: Required<Omit<ShieldForgeConfig, 'smtp' | 'jwtIssuer' | 'jwtAudience'>> & {
    smtp?: ShieldForgeConfig['smtp'];
    jwtIssuer?: string;
    jwtAudience?: string;
  };

  constructor(config: ShieldForgeConfig) {
    this.config = {
      jwtSecret: config.jwtSecret,
      jwtExpiresIn: config.jwtExpiresIn || '7d',
      saltRounds: config.saltRounds || 12,
      smtp: config.smtp,
      jwtIssuer: config.jwtIssuer,
      jwtAudience: config.jwtAudience,
    };
  }

  /**
   * Hash a password
   */
  async hashPassword(password: string): Promise<string> {
    return hashPassword(password, this.config.saltRounds);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return verifyPassword(password, hash);
  }

  /**
   * Generate a JWT token
   */
  generateToken(payload: JwtPayload): string {
    return generateToken(payload, this.config.jwtSecret, this.config.jwtExpiresIn, {
      issuer: this.config.jwtIssuer,
      audience: this.config.jwtAudience,
    });
  }

  /**
   * Verify a JWT token (enforces HS256 algorithm, optional issuer/audience)
   */
  verifyToken(token: string): JwtPayload {
    return verifyToken(token, this.config.jwtSecret, {
      issuer: this.config.jwtIssuer,
      audience: this.config.jwtAudience,
    });
  }

  /**
   * Decode a JWT token without verification
   */
  decodeToken(token: string): JwtPayload | null {
    return decodeToken(token);
  }

  /**
   * Calculate password strength
   */
  calculatePasswordStrength(password: string): PasswordStrength {
    return calculatePasswordStrength(password);
  }

  /**
   * Sanitize user object
   */
  sanitizeUser(user: User): AuthUser {
    return sanitizeUser(user);
  }

  /**
   * Generate a reset code
   */
  generateResetCode(length?: number): string {
    return generateResetCode(length);
  }

  /**
   * Generate a secure token
   */
  generateSecureToken(length?: number): string {
    return generateSecureToken(length);
  }

  /**
   * Hash a reset code for secure storage (SHA-256)
   */
  hashResetCode(code: string): string {
    return hashResetCode(code);
  }

  /**
   * Verify a reset code against a stored hash (constant-time)
   */
  verifyResetCode(code: string, storedHash: string): boolean {
    return verifyResetCode(code, storedHash);
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(to: string, resetCode: string, resetUrl?: string): Promise<void> {
    if (!this.config.smtp) {
      throw new Error('SMTP configuration is required to send emails');
    }
    return sendPasswordResetEmail(this.config.smtp, to, resetCode, resetUrl);
  }

  /**
   * Send a generic email
   */
  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
    if (!this.config.smtp) {
      throw new Error('SMTP configuration is required to send emails');
    }
    return sendEmail(this.config.smtp, to, subject, text, html);
  }
}

// Export individual functions for tree-shaking
export {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  decodeToken,
  calculatePasswordStrength,
  sanitizeUser,
  generateResetCode,
  generateSecureToken,
  hashResetCode,
  verifyResetCode,
  sendPasswordResetEmail,
  sendEmail,
};

// Re-export types
export type {
  ShieldForgeConfig,
  JwtPayload,
  PasswordStrength,
  AuthUser,
  User,
  SmtpConfig,
} from '@appforgeapps/shieldforge-types';
