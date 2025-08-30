import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthContext from "./AuthContext";

export default function RequirePremium() {
  const { role, isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/Login" replace />;
  }

  if (role !== "PREMIUM") {
    return <Navigate to="/Premium" replace />;
  }

  return <Outlet />;
}
