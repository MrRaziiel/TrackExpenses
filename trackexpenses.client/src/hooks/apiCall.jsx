// src/api/apiCall.js
import axios from 'axios';
import { useState, useEffect } from 'react';

// Cria uma instância Axios com configuração padrão
const apiCall = axios.create({
  baseURL: /*process?.env?.REACT_APP_API_URL ||*/ '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // envia cookies HttpOnly automaticamente
});

// Interceptor de resposta para normalizar e centralizar o tratamento de erros
apiCall.interceptors.response.use(
  response => response,
  error => {
    let customError = {
      status: null,
      message: 'Erro desconhecido',
    };
    if (error.response) {
      // Erro HTTP retornado pela API (4xx, 5xx)
      customError.status = error.response.status;
      customError.message = error.response.data?.message || error.response.statusText; // captura mensagem do body ou statusText
    } else if (error.request) {
      // Requisição foi feita, mas sem resposta
      customError.message = 'Falha na rede. Verifique sua conexão.';
    } else {
      // Erro ao configurar a requisição
      customError.message = error.message;
    }
    return Promise.reject(customError);
  }
);

// Hook customizado para fazer chamadas GET automaticamente e tratar loading/error
export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiCall.get(url)
      .then(res => {
        if (!cancelled) setData(res.data);
      })
      .catch(err => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}

export default apiCall;
