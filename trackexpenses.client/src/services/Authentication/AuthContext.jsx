import { createContext, useState, useEffect } from "react";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); 
  const [role, setRole] = useState(null); 

  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");
    console.log("storedAuth", storedAuth);
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        setAuth(parsed.user);
        setIsAuthenticated(true);
        setLoading(true);
        setRole(parsed?.user?.role);
      } catch (error) {
        localStorage.removeItem("auth");
      }
    }
    setLoading(false); 
  }, []);

  return (
    <AuthContext.Provider
      value={{ auth, setAuth, isAuthenticated, setIsAuthenticated, setLoading, loading, role, setRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;