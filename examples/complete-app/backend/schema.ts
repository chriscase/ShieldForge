/**
 * GraphQL Schema with ShieldForge - See backend/schema.ts for full version
 */
import { typeDefs as shieldForgeTypeDefs } from '@appforgeapps/shieldforge-graphql';

const appTypeDefs = `
  extend type User {
    subscription: String
  }
`;

export const typeDefs = `${shieldForgeTypeDefs}\n${appTypeDefs}`;
