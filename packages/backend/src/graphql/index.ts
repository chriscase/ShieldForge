/**
 * ShieldForge GraphQL Module
 * 
 * This module exports all GraphQL types, queries, and mutations for authentication.
 * These can be imported and composed into your own GraphQL schema.
 * 
 * @example
 * // Import types for use in your schema
 * import { UserType, AuthPayloadType, MessageType } from '@shieldforge/backend/graphql';
 * 
 * // Import field definitions to merge into your schema
 * import { authQueryFields, authMutationFields } from '@shieldforge/backend/graphql';
 * 
 * // Create your own schema with ShieldForge auth fields
 * const QueryType = new GraphQLObjectType({
 *   name: 'Query',
 *   fields: {
 *     ...authQueryFields,
 *     // Your other query fields
 *   },
 * });
 */

// Export GraphQL Types
export { UserType, AuthPayloadType, MessageType } from './types.js';

// Export complete Query and Mutation types (for standalone use)
export { QueryType } from './queries.js';
export { MutationType } from './mutations.js';

// Export the complete schema (for standalone use)
export { schema } from './schema.js';

// Export field definitions for composing into custom schemas
export { authQueryFields } from './fields/query-fields.js';
export { authMutationFields } from './fields/mutation-fields.js';

// Export shared context type
export { type ShieldForgeContext } from './fields/context.js';
