import axios from 'axios';

// Cria uma instância Axios com configuração padrão
const apiCall = axios.create({
  baseURL: '/api', // ou use process.env.REACT_APP_API_URL
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
      customError.status = error.response.status;
      customError.message = error.response.data?.message || error.response.statusText;
    } else if (error.request) {
      customError.message = 'Falha na rede. Verifique sua conexão.';
    } else {
      customError.message = error.message;
    }
    return Promise.reject(customError);
  }
);

export default apiCall;