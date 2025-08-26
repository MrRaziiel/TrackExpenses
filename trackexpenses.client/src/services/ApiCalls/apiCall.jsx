import axios from "axios";
import { requestTokenPopup } from "../MicroServices/tokenPopupBus";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TIMEOUT = 25000;

const REFRESH_PATH = "/User/refresh-token";
/* ===== tokens em memória (não quebram se alguém limpar localStorage) ===== */
let authMem = { accessToken: null, refreshToken: null };



const readAuthFromStorage = () => {
  try {
    const raw = localStorage.getItem("auth");
    const parsed = raw ? JSON.parse(raw) : {};
    authMem.accessToken  = parsed?.user?.accessToken  ?? null;
    authMem.refreshToken = parsed?.user?.refreshToken ?? null;
  } catch {
    authMem.accessToken = authMem.refreshToken = null;
  }
};
readAuthFromStorage();

window.addEventListener("storage", (e) => { if (e.key === "auth") readAuthFromStorage(); });

/* ================== axios principal ================== */
const apiCall = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  timeout: TIMEOUT,
  headers: { "Content-Type": "application/json" },
  validateStatus: () => true
});

const setAuthHeader = (t) => {
  if (t) apiCall.defaults.headers.Authorization = `Bearer ${t}`;
  else delete apiCall.defaults.headers.Authorization;
};
setAuthHeader(authMem.accessToken);

apiCall.interceptors.request.use((cfg) => {
  if (authMem.accessToken) cfg.headers.Authorization = `Bearer ${authMem.accessToken}`;
  else delete cfg.headers.Authorization;
  return cfg;
});

/* ================== helpers ================== */
const setNewTokenPair = ({ accessToken, refreshToken }) => {
  // memória + storage + header
  authMem.accessToken = accessToken;
  authMem.refreshToken = refreshToken;

  let parsed = {};
  try { parsed = JSON.parse(localStorage.getItem("auth") || "{}"); } catch {}
  parsed.user = { ...(parsed.user || {}), accessToken, refreshToken };
  localStorage.setItem("auth", JSON.stringify(parsed));

  setAuthHeader(accessToken);
  try { window.dispatchEvent(new Event("authTokensUpdated")); } catch {}
};

const normalizeError = (errOrRes, fallbackMsg) => {
  const isAxiosErrObj = !!errOrRes?.isAxiosError || !!errOrRes?.response || !!errOrRes?.config;
  const response = isAxiosErrObj ? errOrRes.response : errOrRes;
  const config   = isAxiosErrObj ? errOrRes.config   : errOrRes?.config;

  return {
    status: response?.status ?? null,
    code: errOrRes?.code || (response ? "HTTP_ERROR" : "NETWORK_ERROR"),
    message:
      response?.data?.message ||
      response?.data?.error ||
      (typeof response?.data === "string" ? response.data : null) ||
      (errOrRes?.message?.includes?.("timeout") ? "Pedido expirou." : fallbackMsg),
    data: response?.data ?? null,
    url: config?.url,
    method: config?.method?.toUpperCase()
  };
};

/* ===== converte minutos do backend em timestamp e emite evento ===== */
const emitExpiresAtFromMinutes = (minutes) => {
  console.log('emitExpiresAtFromMinutes', minutes);
  console.log('isfinite', Number.isFinite(minutes));
  if (!Number.isFinite(minutes)) return;
  const expiresAtMs = Date.now() + minutes * 60 * 1000;
  console.log('expiresAtMs', expiresAtMs);
  try { localStorage.setItem("authExpiresAt", String(expiresAtMs)); } catch {}
  try { window.dispatchEvent(new CustomEvent("authTokensUpdated", { detail: { expiresAtMs } })); } catch {}
};

/* ===== refresh token (axios cru) ===== */
 const raw = axios.create({
   baseURL: BASE_URL,
   timeout: TIMEOUT,
   headers: { "Content-Type": "application/json" },
   validateStatus: (s) => s >= 200 && s < 500
 });
 // Garante que NÃO vai Authorization no refresh
 raw.interceptors.request.use((cfg) => {
  if (cfg.headers) {
    delete cfg.headers.Authorization;
    delete cfg.headers.authorization;
  }
  return cfg;
});

// lê minutos do backend no REFRESH
const getAccessExpMinutes = (res) => {
  const b = res?.data || {};
  if (Number.isFinite(b.AccessTokenExpirationMinutes)) return b.AccessTokenExpirationMinutes;
  if (Number.isFinite(b.accessTokenExpirationMinutes)) return b.accessTokenExpirationMinutes;
  if (Number.isFinite(b.ExpiresIn)) return b.ExpiresIn; // já em minutos
  const h = res?.headers || {};
  const hdrMin = parseInt(h["x-access-exp-minutes"] || h["x-access-token-exp-minutes"] || "", 10);
  return Number.isFinite(hdrMin) ? hdrMin : null;
};

let refreshing = null;
const refreshAccessToken = async () => {
  if (!refreshing) {
    const rtSnapshot = authMem.refreshToken; // não confiar no storage
    refreshing = (async () => {
      if (!rtSnapshot) throw new Error("no refresh token");

      const res = await raw.post(REFRESH_PATH, { RefreshToken: rtSnapshot });
      const ok = res.status === 200 && res.data?.AccessToken && res.data?.RefreshToken;
      
      if (!ok) throw new Error("refresh failed");

      setNewTokenPair({ accessToken: res.data.AccessToken, refreshToken: res.data.RefreshToken });

      const minutes = getAccessExpMinutes(res);
      emitExpiresAtFromMinutes(minutes);

      return res.data.AccessToken;
    })().finally(() => { refreshing = null; });
  }
  return refreshing;
};

/* ===== abrir popup só quando for mesmo expiração ===== */
const isTokenExpiry401 = (res) => {
  const d = res?.data || {};
  const code = (d.errorCode || d.code || "").toString().toUpperCase();
  if (code === "TOKEN_EXPIRED" || code === "INVALID_TOKEN") return true;
  const msg = (d.message || d.error || "").toString().toLowerCase();
  return msg.includes("token expired") || msg.includes("expired token") || msg.includes("invalid token");
};

/* ===== resposta uniforme ===== */
apiCall.interceptors.response.use(
  async (res) => {
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, data: res.data, status: res.status, headers: res.headers, config: res.config };
    }

    if (res.status === 401 && !res.config._retry && isTokenExpiry401(res)) {
      const cfg = { ...res.config, _retry: true };
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${newToken}` };
          return apiCall(cfg);
        }
      } catch {
        requestTokenPopup();
      }
      return {
        ok: false,
        error: normalizeError({ response: res, config: res.config }, "Sessão expirada. Faz login novamente."),
        status: res.status,
        config: res.config
      };
    }

    let msg = "Pedido inválido.";
    if (res.status === 403) msg = "Sem permissões.";
    else if (res.status === 404) msg = "Recurso não encontrado.";
    else if (res.status === 429) msg = "Demasiados pedidos. Tenta mais tarde.";
    else if (res.status >= 500) msg = "Erro do servidor.";

    return {
      ok: false,
      error: normalizeError({ response: res, config: res.config }, msg),
      status: res.status,
      config: res.config
    };
  },
  (error) => Promise.resolve({ ok: false, error: normalizeError(error, "Falha de rede. Tenta novamente.") })
);

export default apiCall;

/* ===== APIs públicas ===== */
export function setLoginTokens(accessToken, refreshToken, accessTokenExpirationMinutes) {
  setNewTokenPair({ accessToken, refreshToken });
  if (Number.isFinite(accessTokenExpirationMinutes)) {
    emitExpiresAtFromMinutes(accessTokenExpirationMinutes); // <- isto liga o watcher
  }
}
export async function renewSession() { return refreshAccessToken(); }
export function clearAuth() {
  authMem.accessToken = null;
  authMem.refreshToken = null;
  localStorage.removeItem("auth");
  localStorage.removeItem("authExpiresAt");
  setAuthHeader(null);
}