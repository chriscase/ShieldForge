/**
 * ShieldForge Mutation Fields
 * 
 * Exportable mutation field definitions that can be composed into your own GraphQL schema.
 * These are the same fields used in ShieldForge's MutationType, but exposed as a plain object
 * so you can merge them with your own mutation fields.
 * 
 * @example
 * import { authMutationFields } from '@shieldforge/backend/graphql';
 * import { GraphQLObjectType } from 'graphql';
 * 
 * const MutationType = new GraphQLObjectType({
 *   name: 'Mutation',
 *   fields: {
 *     ...authMutationFields,
 *     // Add your own mutation fields here
 *     myCustomMutation: { ... },
 *   },
 * });
 */

import { GraphQLNonNull, GraphQLString, GraphQLFieldConfig } from 'graphql';
import { AuthPayloadType, MessageType } from '../types.js';
import { register, login, logout } from '../../services/auth.service.js';
import { ShieldForgeContext } from './context.js';

/**
 * Mutation fields for authentication.
 * Import and spread these into your own MutationType fields.
 */
export const authMutationFields: Record<string, GraphQLFieldConfig<unknown, ShieldForgeContext>> = {
  /**
   * Register a new user account.
   * Returns the JWT token and user information on success.
   */
  register: {
    type: new GraphQLNonNull(AuthPayloadType),
    description: 'Register a new user',
    args: {
      email: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'The email address of the user',
      },
      password: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'The password for the user',
      },
      name: {
        type: GraphQLString,
        description: 'The display name of the user',
      },
    },
    resolve: async (_parent, args: { email: string; password: string; name?: string }) => {
      return register(args.email, args.password, args.name);
    },
  },

  /**
   * Login with email and password.
   * Returns the JWT token and user information on success.
   */
  login: {
    type: new GraphQLNonNull(AuthPayloadType),
    description: 'Login with email and password',
    args: {
      email: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'The email address of the user',
      },
      password: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'The password for the user',
      },
    },
    resolve: async (_parent, args: { email: string; password: string }) => {
      return login(args.email, args.password);
    },
  },

  /**
   * Logout the current user.
   * Invalidates the current session token.
   */
  logout: {
    type: new GraphQLNonNull(MessageType),
    description: 'Logout the current user',
    resolve: async (_parent, _args, context) => {
      if (!context.token) {
        return { message: 'Not authenticated', success: false };
      }
      return logout(context.token);
    },
  },
};
