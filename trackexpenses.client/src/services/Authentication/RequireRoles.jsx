import React, { useContext, useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import AuthContext from "./AuthContext";

/**
 * Uso:
 * <Route element={<RequireRoles allow="GROUPADMINISTRATOR" />}>
 *   <Route path="/groups" element={<GroupsPage />} />
 * </Route>
 */
export default function RequireRoles({ allow = [], redirectTo = "/" }) {
  const { roles } = useContext(AuthContext); // <-- sem useAuth
  const loc = useLocation();

  // normalizações
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

  // regra: ADMINISTRATOR tem acesso a tudo; senão, precisa de ter pelo menos 1 das required
  const ok = isAdmin || required.some((r) => userRoles.includes(r) || r === "USER");

  return ok ? (
    <Outlet />
  ) : (
    <Navigate to={redirectTo} replace state={{ from: loc, forbidden: true }} />
  );
}
