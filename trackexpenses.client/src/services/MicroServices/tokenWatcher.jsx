import { requestTokenPopup } from "./tokenPopupBus";


let timer = null;
let expiresAtMs = null; 
const SAFETY_MS = 15 * 1000;     

const clearTimer = () => { if (timer) { clearTimeout(timer); timer = null; } };


function handleDue() {
  requestTokenPopup();
}

export function schedule(explicitMs) {
  clearTimer();

  if (Number.isFinite(explicitMs)) {
    expiresAtMs = explicitMs;
  } else if (!Number.isFinite(expiresAtMs)) {
    const saved = Number(localStorage.getItem("authExpiresAt"));
    if (Number.isFinite(saved)) expiresAtMs = saved;
  }

  if (!Number.isFinite(expiresAtMs)) return;

  const msUntil = expiresAtMs - Date.now() - SAFETY_MS;
  timer = setTimeout(handleDue, Math.max(0, msUntil));
}

export function startTokenWatcher() {
  schedule(); 

  const onTokensUpdated = (e) => {
    const next = e?.detail?.expiresAtMs;
    if (Number.isFinite(next)) schedule(next);
  };
  window.addEventListener("authTokensUpdated", onTokensUpdated);

  const onVis = () => { if (document.visibilityState === "visible") schedule(); };
  document.addEventListener("visibilitychange", onVis);

  return () => {
    clearTimer();
    window.removeEventListener("authTokensUpdated", onTokensUpdated);
    document.removeEventListener("visibilitychange", onVis);
  };
}
