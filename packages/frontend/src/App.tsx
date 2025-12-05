import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { UserProfile } from './components/UserProfile';
import './App.css';

function App() {
  const { user, loading } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🛡️ ShieldForge</h1>
        <p>Secure Authentication System</p>
      </header>
      <main className="app-main">
        {user ? (
          <UserProfile user={user} />
        ) : isLoginView ? (
          <LoginForm onSwitchToRegister={() => setIsLoginView(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLoginView(true)} />
        )}
      </main>
    </div>
  );
}

export default App;
