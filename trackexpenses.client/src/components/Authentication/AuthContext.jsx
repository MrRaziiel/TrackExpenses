import { useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';

export default function Dashboard() {
  const { user, setUser } = useContext(AuthContext);

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user }}>
    {children}
</AuthContext.Provider>
  );
}
