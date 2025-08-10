import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL; 
const authString = localStorage.getItem("auth");

let headers = { 'Content-Type': 'application/json' };
console.log('coisas');
if (authString) {
  const auth = JSON.parse(authString); 
  const token = auth.user?.accessToken;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
}
console.log('aijsdoaidsa');
const apiCall = axios.create({
  baseURL: BASE_URL,
  headers,
  withCredentials: true
});
console.log('baseURL', apiCall.baseURL);

export default apiCall;
