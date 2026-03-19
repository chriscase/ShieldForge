import { useAuthContext, type AuthContextValue } from './AuthProvider';
import type { AuthUser } from '@appforgeapps/shieldforge-types';

/**
 * Hook to access authentication state and methods.
 *
 * Pass a type parameter to get app-specific user fields:
 *
 * @example
 * ```tsx
 * // Basic usage (user is AuthUser)
 * const { user, isAuthenticated, login, logout } = useAuth();
 *
 * // Extended usage (user includes custom fields)
 * interface MyUser extends AuthUser {
 *   tenantMemberships: { tenantId: string; role: string }[];
 * }
 * const { user, login } = useAuth<MyUser>();
 * // user.tenantMemberships is typed!
 * ```
 */
export function useAuth<TUser extends AuthUser = AuthUser>(): AuthContextValue<TUser> {
  return useAuthContext<TUser>();
}

export type { AuthUser } from '@appforgeapps/shieldforge-types';
