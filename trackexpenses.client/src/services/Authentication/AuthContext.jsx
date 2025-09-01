import { createContext, useEffect, useState } from "react";

const AuthContext = createContext({});

function readAuth() {
  try {
    return JSON.parse(localStorage.getItem("auth") || "{}");
  } catch {
    return {};
  }
}
function hasSession() {
  try {
    return !!readAuth()?.user?.AccessToken;
  } catch {
    return false;
  }
}

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null); // guarda payload do backend (AccessToken, RefreshToken, Email, Role, ExpiresIn)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  // Arranque
  useEffect(() => {
    const a = readAuth();
    const ok = !!a?.user?.AccessToken;
    setAuth(ok ? a.user : null);
    setRole(ok ? a.user?.Role ?? null : null);
    setIsAuthenticated(ok);
    setLoading(false);
  }, []);

  // Sincroniza quando o login/refresh/logout acontece noutro sítio da app
  useEffect(() => {
    const sync = () => {
      const a = readAuth();
      const ok = !!a?.user?.AccessToken;
      setAuth(ok ? a.user : null);
      setRole(ok ? a.user?.Role ?? null : null);
      setIsAuthenticated(ok);
    };
    window.addEventListener("token-refreshed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("token-refreshed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth,
        isAuthenticated,
        setIsAuthenticated,
        role,
        setRole,
        loading,
        setLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
