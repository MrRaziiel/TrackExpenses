import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from './AuthContext';


const RequireAuth = () => {
  const { auth } = useContext(AuthContext);

  return auth?.accessToken
    ? <Outlet />
    : <Navigate to="/login" replace />;
};

export default RequireAuth;