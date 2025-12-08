import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, withAuth } from '../src';
import type { WithAuthProps } from '../src';

interface TestComponentProps extends WithAuthProps {
  message: string;
}

function TestComponent({ user, isAuthenticated, message }: TestComponentProps) {
  return (
    <div>
      <div data-testid="message">{message}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="user">{user?.email || 'none'}</div>
    </div>
  );
}

const WrappedComponent = withAuth(TestComponent);

describe('withAuth', () => {
  it('should inject auth props when not authenticated', () => {
    render(
      <AuthProvider>
        <WrappedComponent message="Test Message" />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('message')).toHaveTextContent('Test Message');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('should inject auth props when authenticated', () => {
    render(
      <AuthProvider config={{ initialToken: 'token', initialUser: { id: '1', email: 'test@example.com' } }}>
        <WrappedComponent message="Test Message" />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('message')).toHaveTextContent('Test Message');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
  });
});
