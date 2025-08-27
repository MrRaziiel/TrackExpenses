import { useState, useContext } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../styles/Theme/Theme';
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import { Lock, Mail } from 'lucide-react';
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";
import { AuthTimer_start, authMergeUser } from "../../services/MicroServices/AuthTime";


const Login = () => {
  const { auth, setAuth, isAuthenticated, setIsAuthenticated, role, setRole } = useContext(AuthContext);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({});
  const [errorSubmit, setErrorSubmit] = useState(null);
  const navigate = useNavigate();



  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorSubmit(null);
    const payload = {
      email: formData.email || "",
      password: formData.password || ""
    };

      const response = await apiCall.post("/User/Login", payload);
      if (!response.ok) return setErrorSubmit(response.error.message);

      var data = response.data;

      const accessToken = data.AccessToken;
      const email = data.Email
      const role = data.Role;
      const refreshToken = data.RefreshToken;
      const expiresIn = data.ExpiresIn;

      const minutes = Number.isFinite(expiresIn) ? expiresIn : null;
 

      const user = {
      email: email,
      role: role,
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
AuthTimer_start({
  accessToken: data.AccessToken,
  refreshToken: data.RefreshToken,
  email: data.Email,
  role: data.Role,
  expiresIn: data.ExpiresIn,                 // <- MINUTOS vindos do payload
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  earlyMs: 60 * 1000,                         // quando queres mostrar o popup
  mode: "prompt"
});
      authMergeUser({ email: data.Email ?? data.email, role: data.Role ?? data.role });
      setIsAuthenticated(true);
      window.dispatchEvent(new Event("authUserUpdated"));
      navigate('/dashboard');

  };

  const fields = [
    {
      name: 'email',
      label: "Email",
      type: 'email',
      icon: <Mail className="h-5 w-5" style={{ color: theme?.colors?.text?.secondary }} />,
      placeholder: 'Enter your email'
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      icon: <Lock className="h-5 w-5" style={{ color: theme?.colors?.text?.secondary }} />,
      placeholder: 'Enter your password'
    }
  ];

  const renderFields = (fields) => (
    <div className="space-y-6">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: theme?.colors?.text?.secondary }}>
            {field.label}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {field.icon}
            </div>
            <input
              type={field.type}
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              required
              className="w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              placeholder={field.placeholder}
              style={{
                backgroundColor: theme?.colors?.background?.paper,
                color: theme?.colors?.text?.primary,
                borderColor: theme?.colors?.secondary?.light
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div 
        className="max-w-md w-full rounded-2xl shadow-2xl overflow-hidden"
        style={{ 
          backgroundColor: theme?.colors?.background?.paper,
          boxShadow: `0 25px 50px -12px ${theme?.colors?.primary?.dark}50`
        }}
      >
        <div className="relative p-8">
          <h2 
            className="text-3xl font-bold text-center mb-8"
            style={{ color: theme?.colors?.text?.primary }}
          >
            Login
          </h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {renderFields(fields)}
            <div className="mt-6 text-center">
  <Link
    to="/ForgotPassword" 
    className="text-sm font-medium hover:underline transition-colors duration-200"
    style={{ color: theme?.colors?.primary?.main }}
  >
    Forgot your password?
  </Link>
</div>
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              style={{ 
                background: `linear-gradient(135deg, ${theme?.colors?.primary?.main}, ${theme?.colors?.primary?.dark})`
              }}
            >
              Login
            </button>
            {errorSubmit && (
              <p className="text-center text-sm" style={{ color: theme?.colors?.error?.main }}>
                {errorSubmit}
              </p>
            )}
            

          </form>

          <div className="mt-8 text-center">
            <Link
              to="/Register"
              className="text-sm font-medium hover:underline transition-colors duration-200"
              style={{ color: theme?.colors?.primary?.main }}
            >
              Don't have an account? Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
