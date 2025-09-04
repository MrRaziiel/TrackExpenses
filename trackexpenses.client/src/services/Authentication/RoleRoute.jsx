import React, { useContext, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AuthContext from "./AuthContext";

export default function RoleRoute({ roles: allow = [], children, redirectTo = "/" }) {
  const { roles } = useContext(AuthContext);

  const N = (v) => String(v ?? "").trim().toUpperCase();
  const toArray = (r) => (Array.isArray(r) ? r : typeof r === "string" ? r.split(/[,\s]+/) : []);

  const userRoles = useMemo(() => toArray(roles).map(N).filter(Boolean), [roles]);
  const isAdmin = userRoles.includes("ADMINISTRATOR");

  const normalizeRole = (raw) => {
    let r = N(raw);
    if (!r) r = "USER";
    if (r.startsWith("ADMIN")) r = "ADMINISTRATOR";
    if (r.startsWith("GROUP")) r = "GROUPADMINISTRATOR";
    if (["GROUP-ADMIN", "GROUP_ADMIN"].includes(r)) r = "GROUPADMINISTRATOR";
    return r;
  };

  const required = toArray(allow).map(normalizeRole);
  const ok = isAdmin || required.some((r) => userRoles.includes(r) || r === "USER");

  const loc = useLocation();
  return ok ? children : <Navigate to={redirectTo} replace state={{ from: loc, forbidden: true }} />;
}
