/**
 * ShieldForge Query Fields
 * 
 * Exportable query field definitions that can be composed into your own GraphQL schema.
 * These are the same fields used in ShieldForge's QueryType, but exposed as a plain object
 * so you can merge them with your own query fields.
 * 
 * @example
 * import { authQueryFields } from '@shieldforge/backend/graphql';
 * import { GraphQLObjectType } from 'graphql';
 * 
 * const QueryType = new GraphQLObjectType({
 *   name: 'Query',
 *   fields: {
 *     ...authQueryFields,
 *     // Add your own query fields here
 *     myCustomQuery: { ... },
 *   },
 * });
 */

import { GraphQLNonNull, GraphQLString, GraphQLFieldConfig } from 'graphql';
import { UserType } from '../types.js';
import { getCurrentUser } from '../../services/auth.service.js';
import { ShieldForgeContext } from './context.js';

export { ShieldForgeContext } from './context.js';

/**
 * Query fields for authentication.
 * Import and spread these into your own QueryType fields.
 */
export const authQueryFields: Record<string, GraphQLFieldConfig<unknown, ShieldForgeContext>> = {
  /**
   * Get the currently authenticated user.
   * Returns null if not authenticated or token is invalid.
   */
  me: {
    type: UserType,
    description: 'Get the currently authenticated user',
    resolve: async (_parent, _args, context) => {
      if (!context.token) {
        return null;
      }
      return getCurrentUser(context.token);
    },
  },

  /**
   * Health check endpoint.
   * Returns 'OK' if the server is running.
   */
  health: {
    type: new GraphQLNonNull(GraphQLString),
    description: 'Health check endpoint',
    resolve: () => 'OK',
  },
};
