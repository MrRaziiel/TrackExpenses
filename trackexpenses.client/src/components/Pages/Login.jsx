import { useState, useContext } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../Theme/Theme';
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import { Lock, Mail } from 'lucide-react';
import apiCall from "../../hooks/apiCall";
import AuthContext from "../Authentication/AuthContext";

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
    try {
      const response = await apiCall.post('/auth/Login', payload);
      if (!response.data) {
        setErrorSubmit('Email or Password incorrect');
        return;
      }
      console.log("response.data", response.data);
      const accessToken = response.data.AccessToken;
      const email = response.data.Email
      var role = response.data.Role;
      const user = {email,accessToken, role}

      console.log("user", user);
      setRole(role);
      setAuth({ email, accessToken });
      setIsAuthenticated(true);
      localStorage.setItem('auth', JSON.stringify({user}));
      console.log("AAAAAAAAAAAA");
      navigate('/dashboard');

    } catch (err) {
      setErrorSubmit(err.message || 'Login failed');
    }
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
