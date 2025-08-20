import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TIMEOUT = 25000;

/* ================== auth utils ================== */
const getStoredToken = () => {
  try {
    const raw = localStorage.getItem("auth");
    return raw ? JSON.parse(raw)?.user?.accessToken ?? null : null;
  } catch { return null; }
};

const apiCall = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: TIMEOUT,
  headers: { "Content-Type": "application/json" },
  // <- resolve SEMPRE (mesmo 4xx/5xx)
  validateStatus: () => true
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

/* ================== refresh token ================== */
let refreshing = null;
const refreshAccessToken = async () => {
  if (!refreshing) {
    refreshing = (async () => {
      // TODO: chama a tua rota real de refresh
      const newToken = null; // <- substitui por chamada real
      if (!newToken) throw new Error("no token");
      const auth = JSON.parse(localStorage.getItem("auth") || "{}");
      const updated = { ...auth, user: { ...(auth.user || {}), accessToken: newToken } };
      localStorage.setItem("auth", JSON.stringify(updated));
      setAuthToken(newToken);
      return newToken;
    })().finally(() => { refreshing = null; });
  }
  return refreshing;
};

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

/* ================== resposta SEMPRE uniforme ================== */
apiCall.interceptors.response.use(
  // sucesso de transporte (2xx, 3xx, 4xx, 5xx — por causa do validateStatus)
  async (res) => {
    // 2xx -> ok:true
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, data: res.data, status: res.status, headers: res.headers, config: res.config };
    }

    // 401 -> tenta refresh (uma vez)
    if (res.status === 401 && !res.config._retry) {
      const cfg = { ...res.config, _retry: true };
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${newToken}` };
          // volta a fazer o pedido; continua a devolver {ok:true/false}
          return apiCall(cfg);
        }
      } catch {/* ignora e cai no erro normalizado */}
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