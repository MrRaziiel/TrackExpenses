import { createContext, useState, useEffect } from "react";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null); // Ex: { email, accessToken }
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // <- NOVO

  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        setAuth(parsed);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem("auth");
      }
    }
    setLoading(false); // <- MARCA COMO CONCLUÍDO
  }, []);

  return (
    <AuthContext.Provider
      value={{ auth, setAuth, isAuthenticated, setIsAuthenticated, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;