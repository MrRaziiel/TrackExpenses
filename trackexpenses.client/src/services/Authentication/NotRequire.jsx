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

export default function NotRequireAuth() {
  const [authed, setAuthed] = useState(hasSession());
  const loc = useLocation();

  useEffect(() => {
    const onChange = () => setAuthed(hasSession());
    window.addEventListener("token-refreshed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("token-refreshed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  if (authed) {
    const to = loc.state?.from?.pathname || "/Dashboard";
    return <Navigate to={to} replace />;
  }
  return <Outlet />;
}
