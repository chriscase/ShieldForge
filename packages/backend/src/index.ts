/**
 * ShieldForge - Modular Authentication Library
 * 
 * A highly reusable authentication system for Node.js/GraphQL applications.
 * 
 * ## Quick Start - Standalone Server
 * 
 * ```bash
 * npm run dev
 * ```
 * 
 * ## Quick Start - As a Library
 * 
 * ```typescript
 * // Import GraphQL types and fields to compose into your schema
 * import { 
 *   UserType, 
 *   AuthPayloadType, 
 *   authQueryFields, 
 *   authMutationFields 
 * } from '@shieldforge/backend';
 * 
 * // Or use the complete schema
 * import { schema } from '@shieldforge/backend';
 * 
 * // Or import auth services directly
 * import { register, login, logout, verifyToken } from '@shieldforge/backend';
 * ```
 * 
 * @packageDocumentation
 */

// ============================================================================
// GraphQL Exports
// ============================================================================

// GraphQL Types - Use these to build your own schema
export { UserType, AuthPayloadType, MessageType } from './graphql/types.js';

// GraphQL Field Definitions - Compose these into your own Query/Mutation types
export { authQueryFields } from './graphql/fields/query-fields.js';
export { authMutationFields } from './graphql/fields/mutation-fields.js';
export { type ShieldForgeContext } from './graphql/fields/context.js';

// Complete GraphQL Types - Use these for standalone schemas
export { QueryType } from './graphql/queries.js';
export { MutationType } from './graphql/mutations.js';

// Complete Schema - Ready to use with graphql-http or similar
export { schema } from './graphql/schema.js';

// ============================================================================
// Service Exports
// ============================================================================

// Authentication Service Functions
export {
  register,
  login,
  logout,
  verifyToken,
  getCurrentUser,
  type AuthUser,
  type AuthPayload,
  type JwtPayload,
} from './services/auth.service.js';

// ============================================================================
// Middleware Exports
// ============================================================================

// Express Middleware for extracting auth from requests
export { 
  authMiddleware, 
  type AuthRequest 
} from './middleware/auth.middleware.js';

// ============================================================================
// Database Exports
// ============================================================================

// Prisma client instance (requires DATABASE_URL environment variable)
export { default as prisma } from './db.js';
