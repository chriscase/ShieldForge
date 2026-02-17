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
    mode = 'token',
    storageKey = 'shieldforge.token',
    pollInterval,
    enableCrossTabSync = true,
    initialToken,
    initialUser,
  } = config;

  const isCookieMode = mode === 'cookie';

  // NOTE: useState initializers only run once. In SSR frameworks (Next.js),
  // they run on the server where window is undefined, and React hydration
  // does NOT re-run them on the client. So we initialize as null here and
  // use a useEffect below to hydrate from localStorage on the client.
  const [token, setToken] = useState<string | null>(() => {
    if (initialToken !== undefined) return initialToken;
    return null;
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    if (initialUser !== undefined) return initialUser;
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Hydrate auth state on client mount.
  // Token mode: reads from localStorage.
  // Cookie mode: calls refreshAuth() to check session via httpOnly cookie.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isCookieMode) {
      // Cookie mode: hydrate by asking the server for session state
      if (refreshAuthProp) {
        refreshAuthProp()
          .then((result) => {
            if (result) {
              setToken(result.token);
              setUser(result.user);
            }
          })
          .catch(() => {
            // Server unreachable or session expired — stay unauthenticated
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    } else {
      // Token mode: hydrate from localStorage
      if (initialToken === undefined) {
        const storedToken = localStorage.getItem(storageKey);
        if (storedToken) {
          setToken(storedToken);
        }
      }
      if (initialUser === undefined) {
        const storedUser = localStorage.getItem(`${storageKey}.user`);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            // Invalid JSON in storage, ignore
          }
        }
      }
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  const login = useCallback(
    (newToken: string, newUser: AuthUser) => {
      setToken(newToken);
      setUser(newUser);

      if (typeof window !== 'undefined') {
        if (!isCookieMode) {
          // Token mode: persist to localStorage
          localStorage.setItem(storageKey, newToken);
          localStorage.setItem(`${storageKey}.user`, JSON.stringify(newUser));
        }

        // Broadcast to other tabs
        if (enableCrossTabSync) {
          if (isCookieMode) {
            broadcastChannelRef.current?.postMessage({ type: 'login' });
          } else {
            localStorage.setItem(`${storageKey}.event`, JSON.stringify({ type: 'login', timestamp: Date.now() }));
          }
        }
      }

      onLogin?.(newToken, newUser);
    },
    [storageKey, enableCrossTabSync, isCookieMode, onLogin]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);

    if (typeof window !== 'undefined') {
      if (!isCookieMode) {
        // Token mode: clear localStorage
        localStorage.removeItem(storageKey);
        localStorage.removeItem(`${storageKey}.user`);
      }

      // Broadcast to other tabs
      if (enableCrossTabSync) {
        if (isCookieMode) {
          broadcastChannelRef.current?.postMessage({ type: 'logout' });
        } else {
          localStorage.setItem(`${storageKey}.event`, JSON.stringify({ type: 'logout', timestamp: Date.now() }));
        }
      }
    }

    onLogout?.();
  }, [storageKey, enableCrossTabSync, isCookieMode, onLogout]);

  const updateUser = useCallback(
    (newUser: AuthUser) => {
      setUser(newUser);
      if (typeof window !== 'undefined' && !isCookieMode) {
        localStorage.setItem(`${storageKey}.user`, JSON.stringify(newUser));
      }
    },
    [storageKey, isCookieMode]
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

    if (isCookieMode) {
      // Cookie mode: use BroadcastChannel (cookies are shared, just sync React state)
      if (typeof BroadcastChannel === 'undefined') return;
      const channel = new BroadcastChannel(`shieldforge:${storageKey}`);
      broadcastChannelRef.current = channel;
      channel.onmessage = (e: MessageEvent) => {
        if (e.data?.type === 'login' && refreshAuthProp) {
          // Another tab logged in — refresh to pick up the session
          refreshAuthProp()
            .then((result) => {
              if (result) {
                setToken(result.token);
                setUser(result.user);
              }
            })
            .catch(() => {});
        } else if (e.data?.type === 'logout') {
          setToken(null);
          setUser(null);
        }
      };
      return () => {
        channel.close();
        broadcastChannelRef.current = null;
      };
    } else {
      // Token mode: use localStorage events
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
    }
  }, [storageKey, enableCrossTabSync, isCookieMode, refreshAuthProp]);

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
    isAuthenticated: isCookieMode ? !!user : !!token && !!user,
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
