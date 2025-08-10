import apiCall from "../hooks/apiCall";

export  const verifyEmailBd  = async (email) => {
  try {
    const res = await apiCall.get('/User/EmailCheckInDb', {
    params: { "email" : email }}); 
    return res.data;
   
  } catch (err) {
    // console.error('Erro ao buscar usuários:', {
    //   url: err.config?.baseURL + err.config?.url,
    //   status: err.response?.status,
    //   data: err.response?.data,
    //   message: err.message,
    // });
    return {"error" : err};
  }
};
