/**
 * Dashboard Component
 * 
 * Shows how to use the useAuth hook to access auth state.
 */
import React from 'react';
import { useAuth } from '@appforgeapps/shieldforge-react';

export function Dashboard() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <p>Welcome, {user?.name || user?.email}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
