import apiCall from "../hooks/apiCall";

export const genericPostCall = async (url, payload = {}) => {
  try {
    
    const res = await apiCall.post(url, payload);
    console.log('res', res);
    return res;
  } catch (err) {
    return { error: err };
  }
};
