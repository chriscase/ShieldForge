import React, { useEffect } from 'react';
import { useAuth } from './useAuth';

export interface RequireAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  onUnauthorized?: () => void;
}

/**
 * Component that requires authentication to render children
 * 
 * @example
 * ```tsx
 * <RequireAuth fallback={<LoginPage />}>
 *   <ProtectedContent />
 * </RequireAuth>
 * ```
 */
export function RequireAuth({
  children,
  fallback,
  redirectTo,
  onUnauthorized,
}: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (redirectTo && typeof window !== 'undefined') {
        window.location.href = redirectTo;
      } else if (onUnauthorized) {
        onUnauthorized();
      }
    }
  }, [isAuthenticated, isLoading, redirectTo, onUnauthorized]);

  if (isLoading) {
    return fallback || null;
  }

  if (!isAuthenticated) {
    return fallback || null;
  }

  return <>{children}</>;
}
