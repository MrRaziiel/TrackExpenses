// src/auth/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../hooks/apiCall';

export const AuthContext = createContext({
  user: null,
  setUser: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // On initial load, attempt to refresh session
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await apiClient.post('/auth/refresh');
        if (isMounted) setUser(res.data);
      } catch {
        // not authenticated or refresh failed
        if (isMounted) setUser(null);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Central logout function
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}