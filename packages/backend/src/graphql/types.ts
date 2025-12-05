import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLID,
} from 'graphql';

export const UserType = new GraphQLObjectType({
  name: 'User',
  description: 'A user in the system',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The unique identifier of the user',
    },
    email: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The email address of the user',
    },
    name: {
      type: GraphQLString,
      description: 'The display name of the user',
    },
    createdAt: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'When the user was created',
      resolve: (user) => user.createdAt.toISOString(),
    },
    updatedAt: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'When the user was last updated',
      resolve: (user) => user.updatedAt.toISOString(),
    },
  }),
});

export const AuthPayloadType = new GraphQLObjectType({
  name: 'AuthPayload',
  description: 'Authentication response containing user and token',
  fields: () => ({
    token: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'JWT authentication token',
    },
    user: {
      type: new GraphQLNonNull(UserType),
      description: 'The authenticated user',
    },
  }),
});

export const MessageType = new GraphQLObjectType({
  name: 'Message',
  description: 'A simple message response',
  fields: () => ({
    message: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The message content',
    },
    success: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Whether the operation was successful',
      resolve: (obj) => obj.success ? 'true' : 'false',
    },
  }),
});
