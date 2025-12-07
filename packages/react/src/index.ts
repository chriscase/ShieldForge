export { AuthProvider, useAuthContext } from './AuthProvider';
export type { AuthProviderProps } from './AuthProvider';

export { useAuth } from './useAuth';

export { RequireAuth } from './RequireAuth';
export type { RequireAuthProps } from './RequireAuth';

export { withAuth } from './withAuth';
export type { WithAuthProps } from './withAuth';

// Re-export types
export type {
  AuthUser,
  AuthProviderConfig,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  UpdatePasswordInput,
} from '@shieldforge/types';
