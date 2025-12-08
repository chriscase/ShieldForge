import { PasswordStrength } from '@appforgeapps/shieldforge-types';

/**
 * Calculate password strength
 * Returns a score from 0-4 and feedback array
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Check length
  if (password.length < 8) {
    feedback.push('Password should be at least 8 characters long');
  } else if (password.length >= 8) {
    score++;
  }

  if (password.length >= 12) {
    score++;
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    feedback.push('Password should contain lowercase letters');
  } else {
    score++;
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    feedback.push('Password should contain uppercase letters');
  } else {
    score++;
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    feedback.push('Password should contain numbers');
  } else {
    score++;
  }

  // Check for special characters
  if (!/[^a-zA-Z0-9]/.test(password)) {
    feedback.push('Password should contain special characters');
  } else {
    score++;
  }

  // Check for common patterns
  const commonPatterns = ['password', '123456', 'qwerty', 'abc123', 'letmein'];
  const lowerPassword = password.toLowerCase();
  if (commonPatterns.some(pattern => lowerPassword.includes(pattern))) {
    feedback.push('Password contains common patterns');
    score = Math.max(0, score - 2);
  }

  // Normalize score to 0-4
  const normalizedScore = Math.min(4, Math.max(0, Math.floor(score / 1.5))) as 0 | 1 | 2 | 3 | 4;

  return {
    score: normalizedScore,
    feedback: feedback.length > 0 ? feedback : ['Strong password']
  };
}
