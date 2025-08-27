// services/Authentication/Logout.js
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiCall, { setAuthHeader } from "../ApiCallGeneric/apiCall";
import { AuthTimer_stop } from "../MicroServices/AuthTime";

// util para ler o refresh do localStorage
function getRefreshToken() {
  try { return JSON.parse(localStorage.getItem("auth") || "{}")?.user?.refreshToken ?? null; }
  catch { return null; }
}


export async function logoutRequest() {
  // 1) tenta avisar o servidor (não bloqueia caso falhe)
  try {
    const rt = getRefreshToken();
    await apiCall.post("/User/Logout", rt ? { RefreshToken: rt } : {});
  } catch (e) {
    // opcional: console.warn("Logout server-side falhou:", e);
  }

  // 2) parar timers/heartbeats
  try { AuthTimer_stop?.(); } catch {}

  // 3) limpar header do axios
  try { setAuthHeader?.(null); } catch {}

  // 4) limpar storage relacionado com auth
  try {
    localStorage.removeItem("auth");
    localStorage.removeItem("authExpiresAt");   // chaves antigas se existirem
    localStorage.removeItem("tokenPopupPending");
  } catch {}

  // 5) notificar a app (contexts/guards reagem)
  try { window.dispatchEvent(new Event("token-refreshed")); } catch {}
}

/**
 * Hook de logout para usar em botões/UX.
 * Garante navegação para /login depois de limpar tudo.
 */
export default function useLogout() {
  const navigate = useNavigate();
  return useCallback(async () => {
    await logoutRequest();
    navigate("/login", { replace: true });
  }, [navigate]);
}
