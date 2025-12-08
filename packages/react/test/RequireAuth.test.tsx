import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, RequireAuth } from '../src';

describe('RequireAuth', () => {
  it('should render children when authenticated', () => {
    render(
      <AuthProvider config={{ initialToken: 'token', initialUser: { id: '1', email: 'test@example.com' } }}>
        <RequireAuth>
          <div>Protected Content</div>
        </RequireAuth>
      </AuthProvider>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render fallback when not authenticated', () => {
    render(
      <AuthProvider>
        <RequireAuth fallback={<div>Please Login</div>}>
          <div>Protected Content</div>
        </RequireAuth>
      </AuthProvider>
    );
    
    expect(screen.getByText('Please Login')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render nothing when not authenticated and no fallback', () => {
    const { container } = render(
      <AuthProvider>
        <RequireAuth>
          <div>Protected Content</div>
        </RequireAuth>
      </AuthProvider>
    );
    
    expect(container.textContent).toBe('');
  });
});
