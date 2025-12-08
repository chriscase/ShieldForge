export { typeDefs } from './typeDefs';
export { createResolvers } from './resolvers';
export type { AuthDataSource, AuthContext, ResolverDependencies } from './resolvers';

export {
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  LOGOUT_MUTATION,
  ME_QUERY,
  UPDATE_PROFILE_MUTATION,
  UPDATE_PASSWORD_MUTATION,
  REQUEST_PASSWORD_RESET_MUTATION,
  RESET_PASSWORD_MUTATION,
  CHECK_PASSWORD_STRENGTH_QUERY,
  USER_FIELDS_FRAGMENT,
  AUTH_PAYLOAD_FRAGMENT,
} from './documents';

// Re-export types
export type {
  User,
  AuthUser,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  UpdatePasswordInput,
  AuthPayload,
  PasswordStrength,
} from '@appforgeapps/shieldforge-types';
