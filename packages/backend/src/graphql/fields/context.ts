/**
 * ShieldForge Context Types
 * 
 * Shared context interface for GraphQL resolvers.
 */

import { AuthUser } from '../../services/auth.service.js';

/**
 * Context interface for ShieldForge authentication.
 * Your GraphQL context should include these properties for authentication to work.
 * 
 * @example
 * // In your Express setup with graphql-http
 * app.all('/graphql', createHandler({
 *   schema,
 *   context: (req) => ({
 *     token: (req.raw as AuthRequest).token,
 *     user: (req.raw as AuthRequest).user,
 *   }),
 * }));
 */
export interface ShieldForgeContext {
  /** The JWT token extracted from the Authorization header */
  token?: string;
  /** The authenticated user (populated by auth middleware) */
  user?: AuthUser;
}
