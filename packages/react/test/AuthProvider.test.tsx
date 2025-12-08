import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../src';
import type { AuthUser } from '@appforgeapps/shieldforge-types';

// Test component that uses useAuth
function TestComponent() {
  const { user, token, isAuthenticated, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="user">{user?.email || 'none'}</div>
      <div data-testid="token">{token || 'none'}</div>
      <button onClick={() => login('test-token', { id: '1', email: 'test@example.com' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthProvider', () => {
  it('should render children', () => {
    render(
      <AuthProvider>
        <div>Test Content</div>
      </AuthProvider>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should provide initial unauthenticated state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(screen.getByTestId('token')).toHaveTextContent('none');
  });

  it('should allow login', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    const loginButton = screen.getByText('Login');
    loginButton.click();
    
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('token')).toHaveTextContent('test-token');
    });
  });

  it('should allow logout', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Login first
    const loginButton = screen.getByText('Login');
    loginButton.click();
    
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });
    
    // Then logout
    const logoutButton = screen.getByText('Logout');
    logoutButton.click();
    
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      expect(screen.getByTestId('user')).toHaveTextContent('none');
      expect(screen.getByTestId('token')).toHaveTextContent('none');
    });
  });

  it('should accept initial token and user', () => {
    const initialUser: AuthUser = {
      id: '1',
      email: 'initial@example.com',
    };
    
    render(
      <AuthProvider config={{ initialToken: 'initial-token', initialUser }}>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    expect(screen.getByTestId('user')).toHaveTextContent('initial@example.com');
    expect(screen.getByTestId('token')).toHaveTextContent('initial-token');
  });

  it('should call onLogin callback', async () => {
    const onLogin = vi.fn();
    
    render(
      <AuthProvider onLogin={onLogin}>
        <TestComponent />
      </AuthProvider>
    );
    
    const loginButton = screen.getByText('Login');
    loginButton.click();
    
    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith('test-token', { id: '1', email: 'test@example.com' });
    });
  });

  it('should call onLogout callback', async () => {
    const onLogout = vi.fn();
    
    render(
      <AuthProvider onLogout={onLogout}>
        <TestComponent />
      </AuthProvider>
    );
    
    // Login first
    const loginButton = screen.getByText('Login');
    loginButton.click();
    
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });
    
    // Then logout
    const logoutButton = screen.getByText('Logout');
    logoutButton.click();
    
    await waitFor(() => {
      expect(onLogout).toHaveBeenCalled();
    });
  });
});
