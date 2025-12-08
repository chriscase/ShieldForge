import React from 'react';
import { useAuth } from './useAuth';
import { AuthUser } from '@appforgeapps/shieldforge-types';

export interface WithAuthProps {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Higher-order component that injects auth props
 * 
 * @example
 * ```tsx
 * const MyComponent = ({ user, isAuthenticated }: WithAuthProps) => {
 *   return <div>{user?.email}</div>;
 * };
 * 
 * export default withAuth(MyComponent);
 * ```
 */
export function withAuth<P extends WithAuthProps>(
  Component: React.ComponentType<P>
): React.ComponentType<Omit<P, keyof WithAuthProps>> {
  return function WithAuthComponent(props: Omit<P, keyof WithAuthProps>) {
    const { user, isAuthenticated, isLoading } = useAuth();
    
    return (
      <Component
        {...(props as P)}
        user={user}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
      />
    );
  };
}
