import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from './AuthContext';

const useLogout = () => {
  const { setAuth, setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const logout = () => {
    setAuth(null),
    setIsAuthenticated(false),
    localStorage.removeItem('auth'),
    navigate('/Login')
  };

  return logout;
}; 

export default useLogout;