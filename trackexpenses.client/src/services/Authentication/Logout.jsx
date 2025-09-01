import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiCall from "../ApiCallGeneric/apiCall";
import {
  AuthTimer_stop,
  AuthTimer_clearStorage,
} from "../MicroServices/AuthTime";

function getRefreshToken() {
  try {
    return (
      JSON.parse(localStorage.getItem("auth") || "{}")?.user?.RefreshToken ??
      null
    );
  } catch {
    return null;
  }
}

export async function logoutRequest() {
  // 1) tenta avisar o servidor (não trava o fluxo se falhar)
  try {
    const rt = getRefreshToken();
    await apiCall.post("/User/Logout", rt ? { RefreshToken: rt } : {});
  } catch {}

  // 2) pára timers e limpa storage (só aqui!)
  AuthTimer_stop();
  AuthTimer_clearStorage();

  // 3) remove Authorization default do axios (se existir)
  try {
    delete apiCall.defaults.headers.Authorization;
  } catch {}

  // 4) emite evento para contexts/guards sincronizarem (AuthTimer_clearStorage já emite)
  try {
    window.dispatchEvent(new Event("token-refreshed"));
  } catch {}
}

export default function useLogout() {
  const navigate = useNavigate();
  return useCallback(async () => {
    await logoutRequest();
    navigate("/login", { replace: true });
  }, [navigate]);
}
