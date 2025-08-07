import axios from 'axios';

// Cria uma instância Axios com configuração padrão
const authString = localStorage.getItem("auth");
if (authString) {
  var auth = JSON.parse(authString); // transforma a string em objeto
  var token = auth.user?.accessToken;
}
console.log("Token", token);
const apiCall = axios.create({
 baseURL: "https://localhost:5001/api/",
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}` 
  },
  withCredentials: true
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