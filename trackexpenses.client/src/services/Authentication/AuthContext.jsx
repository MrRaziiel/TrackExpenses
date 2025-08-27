import React, { createContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext({});

function readAuth() { try { return JSON.parse(localStorage.getItem("auth") || "{}"); } catch { return {}; } }
function getUser() { return readAuth()?.user || null; }
function hasSession() { return !!getUser()?.accessToken; }

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(hasSession());
  const [role, setRole] = useState(getUser()?.role ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sync = () => {
      const u = getUser();
      setAuth(u);
      setIsAuthenticated(!!u?.accessToken);
      setRole(u?.role ?? null);
    };
    const onStorage = (e) => { if (!e || e.key === "auth") sync(); };

    sync();
    window.addEventListener("token-refreshed", sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("token-refreshed", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const value = useMemo(() => ({
    auth, setAuth, isAuthenticated, setIsAuthenticated, role, setRole, loading, setLoading
  }), [auth, isAuthenticated, role, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
