/**
 * React App with ShieldForge Authentication
 * 
 * This shows how to integrate ShieldForge into your React application.
 */
import React from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { AuthProvider } from '@appforgeapps/shieldforge-react';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { RequireAuth } from './components/ProtectedRoute';

// ============================================================================
// APOLLO CLIENT SETUP WITH AUTH TOKEN
// ============================================================================

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
});

// Add the auth token to every request
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('shieldforge.token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function App() {
  return (
    <ApolloProvider client={client}>
      {/* Wrap your app with ShieldForge AuthProvider */}
      <AuthProvider
        config={{
          // Storage key for the auth token (optional)
          storageKey: 'shieldforge.token',
          
          // Enable cross-tab synchronization (optional)
          enableCrossTabSync: true,
          
          // Session polling interval in ms (optional)
          // Set to null to disable polling
          pollInterval: 60000, // Poll every minute
        }}
        // Optional callbacks
        onLogin={(token, user) => {
          console.log('User logged in:', user);
        }}
        onLogout={() => {
          console.log('User logged out');
        }}
      >
        <div className="app">
          <header>
            <h1>My App with ShieldForge</h1>
          </header>
          
          <main>
            {/* Public route */}
            <div className="public-section">
              <h2>Login</h2>
              <LoginForm />
            </div>
            
            {/* Protected route - only visible when authenticated */}
            <RequireAuth fallback={<div>Please log in to access dashboard</div>}>
              <Dashboard />
            </RequireAuth>
          </main>
        </div>
      </AuthProvider>
    </ApolloProvider>
  );
}

/**
 * USAGE NOTES:
 * 
 * 1. The AuthProvider manages authentication state for your entire app
 * 2. Use the useAuth hook in any component to access auth state and methods
 * 3. Use RequireAuth to protect routes/components that need authentication
 * 4. The token is automatically stored in localStorage and added to GraphQL requests
 */
