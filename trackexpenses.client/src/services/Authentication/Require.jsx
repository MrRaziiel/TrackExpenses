import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

function hasSession() {
  try {
    return !!JSON.parse(localStorage.getItem("auth") || "{}")?.user
      ?.AccessToken;
  } catch {
    return false;
  }
}

export default function RequireAuth() {
  const [ok, setOk] = useState(hasSession());
  const loc = useLocation();

  useEffect(() => {
    const onChange = () => setOk(hasSession());
    window.addEventListener("token-refreshed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("token-refreshed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return ok ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: loc }} />
  );
}
