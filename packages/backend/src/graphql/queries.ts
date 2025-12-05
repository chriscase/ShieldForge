import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { UserType } from './types.js';
import { getCurrentUser } from '../services/auth.service.js';

interface Context {
  token?: string;
}

export const QueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Root query type',
  fields: {
    me: {
      type: UserType,
      description: 'Get the currently authenticated user',
      resolve: async (_parent, _args, context: Context) => {
        if (!context.token) {
          return null;
        }
        return getCurrentUser(context.token);
      },
    },
    health: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Health check endpoint',
      resolve: () => 'OK',
    },
  },
});
