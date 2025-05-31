import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from './AuthContext';

const useLogout = () => {
  const { setAuth, setIsAuthenticated, setLoading, setRole } = useContext(AuthContext);
  const navigate = useNavigate();

  const logout = () => {
    console.log("logout");
    setAuth(null);
    setIsAuthenticated(false);
    setLoading(false);
    setRole(null);
    localStorage.removeItem('auth');
    navigate('/Login');
  };

  return logout;
}; 

export default useLogout;