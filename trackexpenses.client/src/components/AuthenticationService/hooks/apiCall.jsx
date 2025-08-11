// src/services/apiCall.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TIMEOUT = 25000;

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
  headers: { "Content-Type": "application/json" }
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


let refreshing = null;
const refreshAccessToken = async () => {
  if (!refreshing) {
    refreshing = (async () => {
     
      const newToken = null;
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


const normalizeError = (err, fallbackMsg) => ({
  status: err?.response?.status ?? null,
  code: err?.code || (err?.response ? "HTTP_ERROR" : "NETWORK_ERROR"),
  message:
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    (typeof err?.response?.data === "string" ? err.response.data : null) ||
    (err?.message?.includes("timeout") ? "Pedido expirou." : fallbackMsg),
  data: err?.response?.data ?? null,
  url: err?.config?.url,
  method: err?.config?.method?.toUpperCase()
});


apiCall.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error;

 
    if (!response) {
      return Promise.reject(normalizeError(error, "Falha de rede. Tenta novamente."));
    }

    const { status } = response;

   
    if (status === 401 && !config._retry) {
      config._retry = true;
      try {
        const newToken = await refreshAccessToken(); 
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`;
          return apiCall(config);
        }
      } catch {/* ignora e cai para erro */}

      return Promise.reject(normalizeError(error, "Sessão expirada. Faz login novamente."));
    }

    if (status === 403) return Promise.reject(normalizeError(error, "Sem permissões."));
    if (status === 404) return Promise.reject(normalizeError(error, "Recurso não encontrado."));
    if (status === 429) return Promise.reject(normalizeError(error, "Demasiados pedidos. Tenta mais tarde."));
    if (status >= 500) return Promise.reject(normalizeError(error, "Erro do servidor."));

    // 4xx genérico
    return Promise.reject(normalizeError(error, "Pedido inválido."));
  }
);

export default apiCall;
