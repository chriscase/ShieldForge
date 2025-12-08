/**
 * Login Form Component
 * 
 * Shows how to use ShieldForge with GraphQL mutations for login.
 */
import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useAuth } from '@appforgeapps/shieldforge-react';
import { LOGIN_MUTATION } from '../graphql/queries';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  
  const [loginMutation, { loading, error }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      // Save token and user to ShieldForge auth state
      login(data.login.token, data.login.user);
    },
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginMutation({
      variables: {
        input: { email, password }
      }
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div className="error">{error.message}</div>}
    </form>
  );
}
