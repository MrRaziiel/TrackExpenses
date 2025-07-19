import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from './AuthContext';

const NotRequireAuth = () => {
  const { auth } = useContext(AuthContext);

  return auth?.accessToken
    ? <Navigate to="/Dashboard" replace />
     : <Outlet />;
};

export default NotRequireAuth;