import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { AuthPayloadType, MessageType } from './types.js';
import { register, login, logout } from '../services/auth.service.js';

interface Context {
  token?: string;
}

export const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Root mutation type',
  fields: {
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
    logout: {
      type: new GraphQLNonNull(MessageType),
      description: 'Logout the current user',
      resolve: async (_parent, _args, context: Context) => {
        if (!context.token) {
          return { message: 'Not authenticated', success: false };
        }
        return logout(context.token);
      },
    },
  },
});
