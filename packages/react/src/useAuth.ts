import { useAuthContext, type AuthContextValue } from './AuthProvider';

/**
 * Hook to access authentication state and methods
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <div>Please log in</div>;
 *   }
 *   
 *   return <div>Welcome, {user.email}!</div>;
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  return useAuthContext();
}

export type { AuthUser } from '@shieldforge/types';
