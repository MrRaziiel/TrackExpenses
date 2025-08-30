import apiCall, { syncAuthHeaderFromStorage } from "../ApiCallGeneric/apiCall";

const AUTH_KEY = "auth";
let _pulseId = null;
let _refreshing = null;
let _earlyMs = 30_000;
let _promptSent = false;

const log = (...a) => console.log("[AuthTime]", ...a);

/* ---------- storage ---------- */
function readAuth() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "{}"); } catch { return {}; }
}
function writeAuth(next) { localStorage.setItem(AUTH_KEY, JSON.stringify(next)); }

export function getTokens() {
  const a = readAuth();
  return {
    accessToken: a?.user?.AccessToken ?? null,
    refreshToken: a?.user?.RefreshToken ?? null,
  };
}
function getExpAt() { return readAuth()?.meta?.accessExpAt || 0; }
function getCycleMinutes() {
  const m = Number(readAuth()?.meta?.cycleMinutes);
  return Number.isFinite(m) && m > 0 ? m : null;
}

/* ---------- LOGIN: guarda payload EXACTO e o ciclo ---------- */
export function setAuthFromApiPayload(payload) {
  if (!payload?.AccessToken || !payload?.RefreshToken) {
    console.warn("[AuthTime] payload inválido:", payload);
    return;
  }
  const cycleMinutes = Number(payload.ExpiresIn || 1); // MINUTOS
  const expAt = Date.now() + cycleMinutes * 60 * 1000;

  writeAuth({
    user: payload, // guarda tal como vem: AccessToken, RefreshToken, Email, Role, ExpiresIn...
    meta: { accessExpAt: expAt, cycleMinutes },
  });

  syncAuthHeaderFromStorage();                     // header Authorization imediato
  window.dispatchEvent(new Event("token-refreshed"));
  log("login → cycle:", cycleMinutes, "min | expAt:", new Date(expAt).toLocaleTimeString());
  return expAt;
}

/* ---------- REFRESH: troca AccessToken + RefreshToken, mantém Email/Role ---------- */
function updateTokens(newAccessToken, newRefreshToken, maybeMinutes) {
  const cur = readAuth();

  const cycleMinutes =
    Number.isFinite(maybeMinutes) && maybeMinutes > 0
      ? maybeMinutes
      : (getCycleMinutes() || 1);

  const user = {
    ...(cur.user || {}),
    AccessToken: newAccessToken,
    RefreshToken: newRefreshToken,
  };

  const expAt = Date.now() + cycleMinutes * 60 * 1000;

  writeAuth({ user, meta: { ...(cur.meta || {}), accessExpAt: expAt, cycleMinutes } });
  syncAuthHeaderFromStorage();
  window.dispatchEvent(new Event("token-refreshed"));
  log("refresh → cycle:", cycleMinutes, "min | expAt:", new Date(expAt).toLocaleTimeString());
  return expAt;
}

/* ---------- timers ---------- */
function stopPulseInternal() {
  if (_pulseId) { clearInterval(_pulseId); _pulseId = null; log("pulse: stop"); }
}
function tick() {
  const { accessToken, refreshToken } = getTokens();
  const expAt = getExpAt();
  if (!accessToken || !refreshToken || !expAt) { stopPulseInternal(); return; }

  const left = expAt - Date.now();

  // expirou
  if (left <= 0) {
    stopPulseInternal();
    window.dispatchEvent(new Event("token-expired-hard"));
    return;
  }

  if (left <= _earlyMs && !_promptSent) {
    _promptSent = true;
    window.dispatchEvent(new Event("token-due"));
  }
}
function startPulseInternal() {
  stopPulseInternal();
  _promptSent = false;   // novo ciclo → permite novo popup perto do fim
  tick();                // cálculo imediato (para countdown certo)
  _pulseId = setInterval(tick, 1000);
}

/* ---------- API ---------- */
export function AuthTimer_start(payload, { earlyMs = 30_000 } = {}) {
  _earlyMs = earlyMs;
  setAuthFromApiPayload(payload);
  startPulseInternal();
}
export function AuthTimer_resume({ earlyMs = 30_000 } = {}) {
  _earlyMs = earlyMs;
  const { accessToken, refreshToken } = getTokens();
  const expAt = getExpAt();
  if (accessToken && refreshToken && expAt) startPulseInternal();
}
export function AuthTimer_stop() { stopPulseInternal(); }
export function AuthTimer_clearStorage() {
  try { localStorage.removeItem(AUTH_KEY); } catch {}
  try { syncAuthHeaderFromStorage(); } catch {}
  try { window.dispatchEvent(new Event("token-refreshed")); } catch {}
}

/* ---------- refresh imediato ---------- */
export async function AuthTimer_forceRefreshNow() {
  if (_refreshing) return _refreshing;

  const { refreshToken } = getTokens();
  if (!refreshToken) throw new Error("no_refresh_token");

  _refreshing = (async () => {
    const res = await apiCall.post("/User/Refresh-token", { RefreshToken: refreshToken });
    if (!res.ok) throw new Error(res?.error?.message || "refresh_failed");

    const data = res.data || {};
    if (!data.AccessToken || !data.RefreshToken) throw new Error("invalid_refresh_payload");

    const minutes = Number.isFinite(data.ExpiresIn) && data.ExpiresIn > 0
      ? data.ExpiresIn
      : getCycleMinutes();

    // ⬅️ agora troca os dois tokens
    updateTokens(data.AccessToken, data.RefreshToken, minutes);

    startPulseInternal();
    return data.AccessToken;
  })().finally(() => { _refreshing = null; });

  return _refreshing;
}
