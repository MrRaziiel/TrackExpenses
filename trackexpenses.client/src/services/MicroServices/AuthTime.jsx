// services/MicroServices/AuthTime.js
import apiCall from "../ApiCallGeneric/apiCall";

let _pulseId = null;
let _baseUrl = "";
let _earlyMs = 30_000;
let _refreshing = null;
let _promptSent = false;

const AUTH_KEY = "auth";
const log = (...a) => console.log("[AuthTime]", ...a);

/* ---------- storage ---------- */
export function authRead() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "{}");
  } catch {
    return {};
  }
}
export function authWrite(next) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(next));
}
export function authMergeUser(patch) {
  const cur = authRead();
  const next = { ...cur, user: { ...(cur.user || {}), ...patch } };
  authWrite(next);
  return next;
}
function getExpAt() {
  return authRead()?.meta?.accessExpAt || 0;
}
function getTokens() {
  const a = authRead();
  return {
    accessToken: a?.user?.accessToken || null,
    refreshToken: a?.user?.refreshToken || null,
  };
}

/* ---------- normalização de payload ---------- */
function normalizePayload(p = {}) {
  // aceita variações conhecidas
  const accessToken =
    p.accessToken ?? p.AccessToken ?? p.token ?? p.Token ?? null;
  const refreshToken =
    p.refreshToken ?? p.RefreshToken ?? p.refresh ?? p.Refresh ?? null;
  const email = p.email ?? p.Email ?? null;
  const role = p.role ?? p.Role ?? null;

  // expires → prioridade: minutos (ExpiresIn), depois epoch (ExpiresAt), depois segundos
  let expiresInMin = p.expiresIn ?? p.ExpiresIn;
  if (expiresInMin == null && (p.expiresAt || p.ExpiresAt)) {
    const epoch = Number(p.expiresAt ?? p.ExpiresAt);
    if (Number.isFinite(epoch)) {
      const msLeft =
        epoch > 10_000_000_000 ? epoch - Date.now() : epoch * 1000 - Date.now();
      expiresInMin = Math.max(1, Math.round(msLeft / 60000));
    }
  }
  if (expiresInMin == null) {
    const secs =
      p.expiresInSeconds ?? p.ExpiresInSeconds ?? p.expires ?? p.Expires;
    if (secs != null) expiresInMin = Math.max(1, Math.round(Number(secs) / 60));
  }
  if (expiresInMin == null) expiresInMin = 1;

  return { accessToken, refreshToken, email, role, expiresIn: expiresInMin };
}

function setAuthFromPayload(raw) {
  const n = normalizePayload(raw);
  if (!n.accessToken || !n.refreshToken) {
    console.warn("[AuthTime] setAuthFromPayload: payload inválido →", raw);
    return getExpAt(); // não altera nada
  }
  const curUser = authRead().user || {};
  const user = {
    ...curUser,
    accessToken: n.accessToken,
    refreshToken: n.refreshToken,
    email: n.email ?? curUser.email ?? null,
    role: n.role ?? curUser.role ?? null,
  };

  const mins = Number(n.expiresIn || 1); // MINUTOS
  const expAt = Date.now() + mins * 60 * 1000; // → ms

  authWrite({ user, meta: { accessExpAt: expAt } });
  log(
    "setAuthFromPayload → expiresIn(min):",
    mins,
    "| expAt:",
    new Date(expAt).toLocaleTimeString()
  );
  return expAt;
}

/* ---------- heartbeat 1s ---------- */
function stopPulse() {
  if (_pulseId) {
    clearInterval(_pulseId);
    _pulseId = null;
    log("stopPulse");
  }
  window.removeEventListener("visibilitychange", _tick);
  window.removeEventListener("focus", _tick);
  window.removeEventListener("online", _tick);
}
function startPulse() {
  stopPulse();
  _promptSent = false;
  log("startPulse → earlyMs:", _earlyMs, "ms");
  _tick();
  _pulseId = setInterval(_tick, 1000);
  window.addEventListener("visibilitychange", _tick);
  window.addEventListener("focus", _tick);
  window.addEventListener("online", _tick);
}
let _lastSec = null;
function _tick() {
  const { accessToken, refreshToken } = getTokens();
  const expAt = getExpAt();
  if (!accessToken || !refreshToken || !expAt) { stopPulse(); return; }

  const left = expAt - Date.now();
  const sec  = Math.floor(left / 1000);

  // ⬇️ NOVO: expirou → auto-logout
  if (left <= 0) {
    log("EXPIRED → token-expired (auto-logout)");
    stopPulse();
    try {
      localStorage.removeItem("auth");
      localStorage.removeItem("authExpiresAt");
      localStorage.removeItem("tokenPopupPending");
    } catch {}
    window.dispatchEvent(new CustomEvent("token-expired"));
    return;
  }

  if (_lastSec !== sec && (sec % 5 === 0 || left <= _earlyMs)) {
    log(`tick → left: ${sec}s | expAt: ${new Date(expAt).toLocaleTimeString()} | earlyMs: ${_earlyMs}`);
    _lastSec = sec;
  }
  if (left <= _earlyMs && !_promptSent) {
    _promptSent = true;
    log("DUE → token-due");
    window.dispatchEvent(new CustomEvent("token-due"));
  }
}

/* ---------- API ---------- */
export function AuthTimer_start(args) {
  const { baseUrl, earlyMs = 30_000, ...raw } = args || {};
  _baseUrl = baseUrl;
  _earlyMs = earlyMs;
  setAuthFromPayload(raw); // aceita objeto do backend diretamente
  startPulse();
}
export function AuthTimer_resume({ baseUrl, earlyMs = 30_000 } = {}) {
  if (baseUrl) _baseUrl = baseUrl;
  _earlyMs = earlyMs;
  const { accessToken, refreshToken } = getTokens();
  const expAt = getExpAt();
  log(
    "RESUME → hasTokens:",
    !!accessToken && !!refreshToken,
    "| expAt:",
    expAt ? new Date(expAt).toLocaleTimeString() : null
  );
  if (!accessToken || !refreshToken || !expAt) return;
  startPulse();
}
export function AuthTimer_stop() {
  stopPulse();
  log("STOP");
}

export async function AuthTimer_forceRefreshNow() {
  if (_refreshing) return _refreshing;
  const { refreshToken } = getTokens();
  if (!refreshToken) throw new Error("no_refresh_token");

  _refreshing = (async () => {
    log("POST /auth/refresh-token");
    const response = await apiCall.post("/User/Refresh-token", {
      RefreshToken: refreshToken,
    });
    if (!response.ok)
      throw new Error("refresh_http_ " + response.error.message);

    var data = response.data;

    log("refresh → status:", response.status);

    const norm = normalizePayload(data || {});
    if (!norm?.accessToken || !norm?.refreshToken) {
      throw new Error("refresh_invalid_payload");
    }

    setAuthFromPayload(norm);
    startPulse();
    window.dispatchEvent(new CustomEvent("token-refreshed"));
    return norm.accessToken;
  })().finally(() => {
    _refreshing = null;
  });

  return _refreshing;
}
