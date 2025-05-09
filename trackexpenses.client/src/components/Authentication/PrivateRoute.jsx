import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext);  // read auth state :contentReference[oaicite:8]{index=8}
  return user ? children : <Navigate to="/login" replace />;
}