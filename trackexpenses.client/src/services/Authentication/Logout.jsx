import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "./AuthContext";
import apiCall, { clearAuth } from "../ApiCalls/apiCall";

const useLogout = () => {
  const { setAuth, setIsAuthenticated, setLoading, setRole } = useContext(AuthContext);
  const navigate = useNavigate();

  const logout = async () => {
    // lê o refresh token guardado em localStorage.auth.user.refreshToken
    let refreshToken = null;

    refreshToken = JSON.parse(localStorage.getItem("auth") || "{}")?.user?.refreshToken || null;
 
    await apiCall.post("/User/Logout", refreshToken ? { RefreshToken: refreshToken } : {});
      
    clearAuth();
    setRole(null);
    setAuth(null);
    setIsAuthenticated(false);
    setLoading?.(false);

    navigate("/Login", { replace: true });
  };

  return logout;
};

export default useLogout;
