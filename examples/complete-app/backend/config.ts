/**
 * ShieldForge Configuration Example
 * 
 * This file shows how to configure ShieldForge for your application.
 * Store sensitive values in environment variables!
 */

import { ShieldForge } from '@appforgeapps/shieldforge-core';
import { PasskeyService } from '@appforgeapps/shieldforge-passkey';

// ============================================================================
// CORE AUTHENTICATION CONFIGURATION
// ============================================================================

/**
 * Initialize ShieldForge with your configuration.
 * All these values should come from environment variables in production.
 */
export const auth = new ShieldForge({
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET!, // REQUIRED: Strong secret for JWT signing
  jwtExpiresIn: '7d', // Optional: Token expiration (default: '7d')
  
  // Password Configuration
  saltRounds: 10, // Optional: bcrypt salt rounds (default: 10)
  
  // Email Configuration (optional - only if you want password reset emails)
  smtp: {
    host: process.env.SMTP_HOST!, // e.g., 'smtp.gmail.com'
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER!, // Your email account
    pass: process.env.SMTP_PASS!, // Your email password or app-specific password
    from: process.env.SMTP_FROM || 'noreply@myapp.com', // Sender address
  }
});

// ============================================================================
// PASSKEY CONFIGURATION (Optional - only if you want WebAuthn/Passkey support)
// ============================================================================

/**
 * Initialize PasskeyService for WebAuthn authentication.
 * This enables passwordless authentication with biometrics.
 */
export const passkeyService = new PasskeyService({
  rpName: 'My Application', // Your app name shown to users
  rpId: process.env.DOMAIN || 'localhost', // Your domain (no protocol)
  origin: process.env.ORIGIN || 'http://localhost:3000', // Full origin URL
  challengeTTL: 5 * 60 * 1000, // Optional: Challenge timeout (default: 5 minutes)
});

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: Hash a password during registration
 */
export async function hashUserPassword(password: string) {
  return await auth.hashPassword(password);
}

/**
 * Example: Verify a password during login
 */
export async function verifyUserPassword(password: string, hash: string) {
  return await auth.verifyPassword(password, hash);
}

/**
 * Example: Generate a JWT token
 */
export function generateAuthToken(userId: string, email: string) {
  return auth.generateToken({ userId, email });
}

/**
 * Example: Verify and decode a JWT token
 */
export function verifyAuthToken(token: string) {
  try {
    return auth.verifyToken(token);
  } catch (error) {
    return null; // Invalid or expired token
  }
}

/**
 * Example: Check password strength before allowing registration
 */
export function checkPasswordStrength(password: string) {
  const result = auth.calculatePasswordStrength(password);
  // result.score: 0-4 (0=very weak, 4=very strong)
  // result.feedback: array of improvement suggestions
  return result;
}

/**
 * Example: Sanitize user data before sending to client
 * Removes passwordHash and other sensitive fields
 */
export function sanitizeUserData(user: any) {
  return auth.sanitizeUser(user);
}

/**
 * Example: Generate a password reset code
 */
export function generatePasswordResetCode() {
  return auth.generateResetCode(6); // 6-digit code
}

/**
 * Example: Send password reset email
 */
export async function sendPasswordResetEmail(email: string, code: string) {
  await auth.sendPasswordResetEmail(email, code);
}

// ============================================================================
// ENVIRONMENT VARIABLES TEMPLATE
// ============================================================================

/**
 * Create a .env file with these variables:
 * 
 * # JWT Configuration (REQUIRED)
 * JWT_SECRET=your-super-secret-key-change-this-in-production
 * 
 * # SMTP Configuration (Optional - for password reset emails)
 * SMTP_HOST=smtp.gmail.com
 * SMTP_PORT=587
 * SMTP_USER=your-email@gmail.com
 * SMTP_PASS=your-app-specific-password
 * SMTP_FROM=noreply@myapp.com
 * 
 * # Passkey Configuration (Optional - for WebAuthn)
 * DOMAIN=myapp.com
 * ORIGIN=https://myapp.com
 */
