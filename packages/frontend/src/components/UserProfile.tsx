import { useAuth } from '../context/AuthContext';
import type { User } from '../graphql/types';

interface UserProfileProps {
  user: User;
}

export function UserProfile({ user }: UserProfileProps) {
  const { logout } = useAuth();

  return (
    <div className="user-profile">
      <h2>Welcome, {user.name || user.email}!</h2>
      <div className="profile-details">
        <p><strong>Email:</strong> {user.email}</p>
        {user.name && <p><strong>Name:</strong> {user.name}</p>}
        <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
      </div>
      <button onClick={logout} className="logout-button">
        Logout
      </button>
    </div>
  );
}
