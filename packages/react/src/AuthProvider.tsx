import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AuthUser, AuthProviderConfig } from '@appforgeapps/shieldforge-types';

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
  refreshAuth?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
  config?: AuthProviderConfig;
  onLogin?: (token: string, user: AuthUser) => void;
  onLogout?: () => void;
  refreshAuth?: () => Promise<{ token: string; user: AuthUser } | null>;
}

/**
 * AuthProvider component that manages authentication state
 */
export function AuthProvider({
  children,
  config = {},
  onLogin,
  onLogout,
  refreshAuth: refreshAuthProp,
}: AuthProviderProps) {
  const {
    storageKey = 'shieldforge.token',
    pollInterval,
    enableCrossTabSync = true,
    initialToken = null,
    initialUser = null,
  } = config;

  const [token, setToken] = useState<string | null>(() => {
    if (initialToken !== undefined) return initialToken;
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey);
    }
    return null;
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    if (initialUser !== undefined) return initialUser;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`${storageKey}.user`);
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const login = useCallback(
    (newToken: string, newUser: AuthUser) => {
      setToken(newToken);
      setUser(newUser);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newToken);
        localStorage.setItem(`${storageKey}.user`, JSON.stringify(newUser));
        
        // Broadcast to other tabs
        if (enableCrossTabSync) {
          localStorage.setItem(`${storageKey}.event`, JSON.stringify({ type: 'login', timestamp: Date.now() }));
        }
      }
      
      onLogin?.(newToken, newUser);
    },
    [storageKey, enableCrossTabSync, onLogin]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}.user`);
      
      // Broadcast to other tabs
      if (enableCrossTabSync) {
        localStorage.setItem(`${storageKey}.event`, JSON.stringify({ type: 'logout', timestamp: Date.now() }));
      }
    }
    
    onLogout?.();
  }, [storageKey, enableCrossTabSync, onLogout]);

  const updateUser = useCallback(
    (newUser: AuthUser) => {
      setUser(newUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${storageKey}.user`, JSON.stringify(newUser));
      }
    },
    [storageKey]
  );

  const refreshAuth = useCallback(async () => {
    if (!refreshAuthProp) return;
    
    setIsLoading(true);
    try {
      const result = await refreshAuthProp();
      if (result) {
        login(result.token, result.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to refresh auth:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [refreshAuthProp, login, logout]);

  // Cross-tab synchronization
  useEffect(() => {
    if (!enableCrossTabSync || typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${storageKey}.event` && e.newValue) {
        try {
          const event = JSON.parse(e.newValue);
          if (event.type === 'login') {
            const newToken = localStorage.getItem(storageKey);
            const newUserStr = localStorage.getItem(`${storageKey}.user`);
            if (newToken && newUserStr) {
              setToken(newToken);
              setUser(JSON.parse(newUserStr));
            }
          } else if (event.type === 'logout') {
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Failed to parse storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey, enableCrossTabSync]);

  // Polling for session validation
  useEffect(() => {
    if (pollInterval && refreshAuth && token) {
      pollIntervalRef.current = setInterval(refreshAuth, pollInterval);
      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [pollInterval, refreshAuth, token]);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    updateUser,
    refreshAuth: refreshAuthProp ? refreshAuth : undefined,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 */
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
