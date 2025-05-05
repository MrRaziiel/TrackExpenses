import { useAuth } from './AuthContext';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}