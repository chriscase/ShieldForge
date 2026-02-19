import jwt, { SignOptions, VerifyOptions, Algorithm } from 'jsonwebtoken';
import { JwtPayload } from '@appforgeapps/shieldforge-types';

/**
 * Options for JWT verification constraints.
 */
export interface JwtVerifyOptions {
  /** Allowed algorithms (default: ['HS256']). Prevents algorithm confusion attacks. */
  algorithms?: Algorithm[];
  /** Expected issuer — if set, tokens with a different `iss` claim are rejected. */
  issuer?: string;
  /** Expected audience — if set, tokens with a different `aud` claim are rejected. */
  audience?: string;
}

/**
 * Default verification options. Only HS256 is allowed by default to prevent
 * algorithm confusion attacks (e.g., switching to 'none' or RSA).
 */
const DEFAULT_VERIFY_OPTIONS: Required<Pick<JwtVerifyOptions, 'algorithms'>> = {
  algorithms: ['HS256'],
};

/**
 * Generate a JWT token
 */
export function generateToken(
  payload: JwtPayload,
  secret: string,
  expiresIn: string | number = '7d',
  options?: { issuer?: string; audience?: string }
): string {
  const signOptions: SignOptions = {
    expiresIn: expiresIn as any,
    algorithm: 'HS256',
  };
  if (options?.issuer) signOptions.issuer = options.issuer;
  if (options?.audience) signOptions.audience = options.audience;
  return jwt.sign(payload, secret, signOptions);
}

/**
 * Verify and decode a JWT token.
 *
 * By default, only HS256 is allowed to prevent algorithm confusion attacks.
 * Optionally validates issuer and audience claims.
 */
export function verifyToken(
  token: string,
  secret: string,
  options?: JwtVerifyOptions
): JwtPayload {
  const verifyOpts: VerifyOptions = {
    algorithms: options?.algorithms ?? DEFAULT_VERIFY_OPTIONS.algorithms,
  };
  if (options?.issuer) verifyOpts.issuer = options.issuer;
  if (options?.audience) verifyOpts.audience = options.audience;
  const decoded = jwt.verify(token, secret, verifyOpts) as JwtPayload;
  return decoded;
}

/**
 * Decode a JWT token without verification (use with caution)
 */
export function decodeToken(token: string): JwtPayload | null {
  const decoded = jwt.decode(token) as JwtPayload | null;
  return decoded;
}
