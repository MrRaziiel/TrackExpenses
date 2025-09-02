import apiCall, { syncAuthHeaderFromStorage } from "../ApiCallGeneric/apiCall";

const AUTH_KEY = "auth";
let _pulseId = null;
let _refreshing = null;
let _earlyMs = 30_000;
let _promptSent = false;
let _resumeGraceUntil = 0; // ⬅️ janela de graça após page refresh


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

/* ---------- helper: ExpiresIn -> minutes (secs if >= 90) ---------- */
function toMinutes(rawExpiresIn) {
  const raw = Number(rawExpiresIn || 1);
  return raw >= 90 ? raw / 60 : raw;
}
 
/* ---------- LOGIN: guarda payload EXACTO e o ciclo ---------- */
export function setAuthFromApiPayload(payload) {
  if (!payload?.AccessToken || !payload?.RefreshToken) {
    console.warn("[AuthTime] payload inválido:", payload);
    return;
  }
  const cycleMinutes = toMinutes(payload.ExpiresIn); // ← robusto
  const expAt = Date.now() + cycleMinutes * 60 * 1000;

  writeAuth({
    user: payload, // guarda tal como vem
    meta: { accessExpAt: expAt, cycleMinutes },
  });

  syncAuthHeaderFromStorage();                     // header Authorization imediato
  window.dispatchEvent(new Event("token-refreshed"));
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
  return expAt;
}

/* ---------- timers ---------- */
function stopPulseInternal() {
  if (_pulseId) { clearInterval(_pulseId); _pulseId = null; }
}

function tick() {
  const { accessToken, refreshToken } = getTokens();
  const expAt = getExpAt();

  // ⬅️ durante a janela de graça, não paramos (damos tempo à reidratação)
  if ((!accessToken || !refreshToken || !expAt) && Date.now() < _resumeGraceUntil) {
    return; // espera um pouco e volta a tentar no próximo tick
  }

  if (!accessToken || !refreshToken || !expAt) { 
    stopPulseInternal(); 
    return; 
  }

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
  // ⚠️ não chamamos tick() imediatamente; deixamos o 1º tick vir pelo intervalo
  stopPulseInternal();
  _promptSent = false;
  _pulseId = setInterval(tick, 1000);
}

/* ---------- API ---------- */
export function AuthTimer_start(payload, { earlyMs = 30_000 } = {}) {
  _earlyMs = earlyMs;
  setAuthFromApiPayload(payload);
  _resumeGraceUntil = 0; // não precisamos de graça num login “novo”
  startPulseInternal();
}

export function AuthTimer_resume({ earlyMs = 30_000, graceMs = 5000 } = {}) {
  // ⬅️ chamado no refresh da página: dá uma janela de graça para não parar já
  _earlyMs = earlyMs;
  _resumeGraceUntil = Date.now() + Math.max(0, graceMs);

  const { accessToken, refreshToken } = getTokens();
  const expAt = getExpAt();

  // mesmo que falte algo, iniciamos o loop; o grace evita stop precoce
  if (accessToken || refreshToken || expAt) {
    startPulseInternal();
  } else {
    // se não há nada no storage, ainda assim começamos e paramos após a graça
    startPulseInternal();
  }
}

export function AuthTimer_stop() { 
  _resumeGraceUntil = 0;
  stopPulseInternal(); 
}

export function AuthTimer_clearStorage() {
  try { localStorage.removeItem(AUTH_KEY); } catch {}
  try { syncAuthHeaderFromStorage(); } catch {}
  try { window.dispatchEvent(new Event("token-refreshed")); } catch {}
  _resumeGraceUntil = 0;
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
      ? toMinutes(data.ExpiresIn)
      : getCycleMinutes();

    updateTokens(data.AccessToken, data.RefreshToken, minutes);

    _promptSent = false;      // permite novo aviso no novo ciclo
    _resumeGraceUntil = 0;    // não precisamos de graça após refresh bem-sucedido
    startPulseInternal();
    return data.AccessToken;
  })().finally(() => { _refreshing = null; });

  return _refreshing;
}
