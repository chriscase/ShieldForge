import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useMutation, useLazyQuery } from '@apollo/client';
import { LOGIN_MUTATION, REGISTER_MUTATION, LOGOUT_MUTATION } from '../graphql/mutations';
import { ME_QUERY } from '../graphql/queries';
import type { User, AuthContextType, AuthPayload } from '../graphql/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'shieldforge_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const [loginMutation] = useMutation<{ login: AuthPayload }>(LOGIN_MUTATION);
  const [registerMutation] = useMutation<{ register: AuthPayload }>(REGISTER_MUTATION);
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);
  const [fetchMe] = useLazyQuery<{ me: User | null }>(ME_QUERY);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const { data } = await fetchMe();
          if (data?.me) {
            setUser(data.me);
          } else {
            localStorage.removeItem(TOKEN_KEY);
            setToken(null);
          }
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token, fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await loginMutation({
      variables: { email, password },
    });

    if (data?.login) {
      localStorage.setItem(TOKEN_KEY, data.login.token);
      setToken(data.login.token);
      setUser(data.login.user);
    }
  }, [loginMutation]);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const { data } = await registerMutation({
      variables: { email, password, name },
    });

    if (data?.register) {
      localStorage.setItem(TOKEN_KEY, data.register.token);
      setToken(data.register.token);
      setUser(data.register.user);
    }
  }, [registerMutation]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation();
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  }, [logoutMutation]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
