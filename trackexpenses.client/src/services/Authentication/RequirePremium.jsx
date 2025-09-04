import React, { useContext, useMemo } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthContext from "../services/Authentication/AuthContext";

const norm = (v) => String(v ?? "").trim().toUpperCase();

function isUserPremium({ roles, auth }) {
  // 1) via roles (array de strings)
  if (Array.isArray(roles) && roles.some((r) => norm(r) === "PREMIUM")) return true;

  // 2) via flags no auth (ajusta se o teu backend usar outro nome)
  const f = auth?.isPremium ?? auth?.IsPremium ?? auth?.premium ?? auth?.Premium;
  if (typeof f === "boolean") return f;

  // 3) via plan (string)
  const plan = norm(auth?.subscription?.plan ?? auth?.Subscription?.Plan ?? auth?.plan ?? auth?.Plan);
  if (["PREMIUM", "PRO", "PLUS"].includes(plan)) return true;

  return false;
}

export default function RequirePremium() {
  const { roles, auth, isAuthenticated } = useContext(AuthContext) || {};

  if (!isAuthenticated) return <Navigate to="/Login" replace />;

  const ok = useMemo(() => isUserPremium({ roles, auth }), [roles, auth]);
  if (!ok) return <Navigate to="/Premium" replace />;

  return <Outlet />;
}
