import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext);

  if (!auth) throw new Error('ProtectedRoute must be used within AuthContextProvider');

  const { session } = auth;

  // Still loading session — render nothing to avoid flash
  if (session === undefined) return null;

  // Not logged in — redirect to login
  if (!session) return <Navigate to="/login" replace />;

  // Logged in — render the page
  return <>{children}</>;
}

export default ProtectedRoute;