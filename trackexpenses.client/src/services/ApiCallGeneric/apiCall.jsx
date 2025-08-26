// src/apiCall.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TIMEOUT = 25000;

/* ================== storage helpers ================== */
const AUTH_KEY = "auth";

const getStoredAuth = () => {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "{}"); }
  catch { return {}; }
};
const getStoredToken = () => {
  try { return getStoredAuth()?.user?.accessToken ?? null; }
  catch { return null; }
};
const getStoredRefreshToken = () => {
  try { return getStoredAuth()?.user?.refreshToken ?? null; }
  catch { return null; }
};
const hasTokens = () => !!getStoredToken() && !!getStoredRefreshToken();

const setNewTokenPair = ({ accessToken, refreshToken }) => {
  const auth = getStoredAuth();
  const updated = { ...auth, user: { ...(auth.user || {}), accessToken, refreshToken } };
  localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
  setAuthToken(accessToken);
};

export function setLoginTokens(accessToken, refreshToken) {
  setNewTokenPair({ accessToken, refreshToken });
}
export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
  setAuthToken(null);
}

/* ================== axios base ================== */
const apiCall = axios.create({
  baseURL: BASE_URL,
  withCredentials: false, // sem cookies
  timeout: TIMEOUT,
  headers: { "Content-Type": "application/json" },
  validateStatus: () => true // devolvemos sempre {ok:true/false}
});

export const setAuthToken = (token) => {
  if (token) apiCall.defaults.headers.Authorization = `Bearer ${token}`;
  else delete apiCall.defaults.headers.Authorization;
};
setAuthToken(getStoredToken());

apiCall.interceptors.request.use((cfg) => {
  const t = getStoredToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  else delete cfg.headers.Authorization;
  return cfg;
});

/* ================== fila + popup guards ================== */
// Fila de pedidos que deram 401 para “replay” após renovação
const pendingQueue = []; // items: { cfg, resolve, reject }

// Guard anti-repetição do popup (por refreshToken)
let popupGuard = { shownForRefresh: null, ts: 0 };
const POPUP_THROTTLE_MS = 60000; // 60s sem repetir

function shouldShowPopup(resConfig) {
  const rt = getStoredRefreshToken();
  if (!rt) return false;

  // só se a request LEVAVA Authorization (evita 401 de rotas públicas)
  const hadAuth =
    !!(resConfig?.headers && resConfig.headers.Authorization) ||
    !!(resConfig?._headers && resConfig._headers.Authorization);
  if (!hadAuth) return false;

  // não abrir em endpoints de auth
  const url = (resConfig?.url || "").toLowerCase();
  if (url.includes("/auth/login") || url.includes("/auth/refresh-token")) return false;

  const now = Date.now();
  if (popupGuard.shownForRefresh === rt && now - popupGuard.ts < POPUP_THROTTLE_MS) {
    return false; // já abrimos há pouco para este RT
  }
  popupGuard = { shownForRefresh: rt, ts: now };
  return true;
}

// dispara o popup globalmente
function openTokenPopup() {
  window.dispatchEvent(new CustomEvent("tokenPopup", { detail: { reason: "access_expired" } }));
}

/* ================== refresh manual (chamado pelo popup) ================== */
// usamos um axios “cru” para evitar loops com interceptors
const raw = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: { "Content-Type": "application/json" },
  validateStatus: (s) => s >= 200 && s < 500
});

export async function manualRefreshFromPopup() {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return false;

  const res = await raw.post("/auth/refresh-token", { refreshToken });
  const ok = res.status === 200 && res.data?.accessToken && res.data?.refreshToken;
  if (!ok) return false;

  // guarda novo par e reenvia fila
  setNewTokenPair({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken });

  const items = pendingQueue.splice(0);
  for (const { cfg, resolve, reject } of items) {
    apiCall(cfg).then(resolve).catch(reject);
  }
  return true;
}

export function abortQueueAndClearAuth() {
  const items = pendingQueue.splice(0);
  for (const { reject } of items) reject(new Error("logout"));
  clearAuth();
}

/* ================== erros normalizados ================== */
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

/* ================== response interceptor ================== */
apiCall.interceptors.response.use(
  // sucesso de transporte (mas pode ter 4xx/5xx por validateStatus)
  async (res) => {
    // 2xx -> ok:true
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, data: res.data, status: res.status, headers: res.headers, config: res.config };
    }

    // 401 -> não renovamos automaticamente
    // Enfileiramos a request e abrimos popup UMA vez para o RT atual
if (res.status === 401 && !res.config._retry) {
  const cfg = { ...res.config, _retry: true };

  try {
    // tenta refresh silencioso
    const newToken = await refreshAccessToken();   // <- já tens esta função no ficheiro
    if (newToken) {
      cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${newToken}` };
      return apiCall(cfg); // reenvia a chamada original, sem popup
    }
  } catch {
    // refresh falhou -> só aqui podemos abrir o popup
  }

  // opcional: evita spam em navegação rápida
  if (!/\/auth\/(login|refresh-token)/i.test(cfg.url || "")) {
    window.dispatchEvent(new Event("tokenPopup"));
  }

  return {
    ok: false,
    error: normalizeError({ response: res, config: res.config }, "Sessão expirada. Faz login novamente."),
    status: res.status,
    config: res.config
  };
}

    // Mapas de mensagens “amigáveis”
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
  // falha de transporte (rede/timeout/abort) -> ok:false (resolve em vez de rejeitar)
  (error) => {
    return Promise.resolve({
      ok: false,
      error: normalizeError(error, "Falha de rede. Tenta novamente.")
    });
  }
);

export default apiCall;
