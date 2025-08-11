// src/pages/SignIn.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getPasswordValidation, pageConfigurations } from '../../../utilis/configurations/SigninConfiguration.jsx';
import { useTheme } from '../../Theme/Theme.jsx';
import { useLanguage } from '../../../utilis/Translate/LanguageContext.jsx';
import { HelpCircle } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { verifyEmailBd , RegistUser } from '../../AuthenticationService/services/AuthServices.jsx';

// import apiCall from '../../services/apiCall';
// import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
// import { jwtDecode } from 'jwt-decode'; 

const SignIn = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [step, setStep] = useState(1);
  const [authProvider, setAuthProvider] = useState(null); // 'google' | null

  // Errors
  const [errorEmail, setErrorEmail] = useState(null);
  const [errorCodeGroup, setErrorCodeGroup] = useState(null);
  const [errorPasswordCheck, setErrorPasswordCheck] = useState(null);
  const [errorPasswordMatch, setErrorPasswordMatch] = useState(null);
  const [errorSubmit, setErrorSubmit] = useState(null);

  const [formData, setFormData] = useState({});

  const pagesConfigurations = pageConfigurations();
  const [firstConfigurationPage] = useState(pagesConfigurations.firstConfigurationPage);
  const [secondconfigurationPage] = useState(pagesConfigurations.secondconfigurationPage);


  const handleTooltipEnter = () => setShowTooltip(true);


  // Comment because will be implement later
  // const handleGoogleSuccess = (credentialResponse) => {
  //   try {
  //     const { credential } = credentialResponse || {};
  //     if (!credential) return;

  //     const profile = jwtDecode(credential); 

  //     setFormData(prev => ({
  //       ...prev,
  //       email: profile.email || prev.email || "",
  //       firstname: profile.given_name || prev.firstname || "",
  //       lastname: profile.family_name || prev.lastname || "",
  //       google_token: credential,
  //     }));

  //     setAuthProvider('google');
  //     setErrorEmail(null);
  //     setErrorPasswordCheck(null);
  //     setErrorPasswordMatch(null);
  //     setStep(2);
  //   } catch (e) {
  //     console.error("Erro a processar Google credential:", e);
  //   }
  // };

  //  const handleGoogleError = () => {
  //   console.error("Erro no login Google");
  // };


  const handleNext = async () => {
    if (!verifyEmail()) return;
    const isEmailValid = await verifyEmail_Bd();
    if (!isEmailValid) return;

    if (authProvider !== 'google') {
      if (!validPassword()) return;
      if (!verifyPasswordCheck()) return;
    }

    setStep(2);
  };

  function verifyEmail() {
    if (
      formData.email == null ||
      !String(formData.email)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )
    ) {
      setErrorEmail("Mail invalid: 'example@example.com'");
      return false;
    }
    return true;
  }

  function verifyPasswordCheck() {
    if (formData.password == null || formData.confirmpassword == null || formData.password !== formData.confirmpassword) {
      setErrorPasswordMatch("As senhas não coincidem");
      return false;
    }
    return true;
  }

  function validPassword() {
    const password = formData.password || "";
    const validateList = getPasswordValidation(password);
    const errors = validateList.some(item => item.rule === false);
    if (errors) {
      let messageErrorArray = [];
      validateList.forEach(item => {
        const messageError = (!item.rule)
          ? item.label + item.error
          : item.label + item.valid;
        messageErrorArray.push(messageError);
      });
      setErrorPasswordCheck(messageErrorArray);
      return false;
    }
    setErrorPasswordCheck(null);
    return true;
  }

  const verifyEmail_Bd = async () => {
    setErrorEmail(null);
    if (!formData?.email) {
      setErrorEmail('Please fill Email.');
      return false;
    }

    try {
      const exist = await verifyEmailBd(formData.email);

      if (exist.error) pass;
      if (exist === undefined) {
        setErrorEmail('Error to validate email.');
        return false;
      }
      if (exist) {
        setErrorEmail('Email already registed');
        return false;
      }
      return true;
    } catch (err) {

      setErrorEmail('Error to validate email. Server is down.');
      return false;
    }
  };

  const verifyGroupCodeBd = async () => {
    try {
      if (!formData.code_invite) return true;
      setErrorCodeGroup(null);
      const res = await apiCall.get("/auth/CodeGroupCheckBd", { params: { code: formData.code_invite } });
      if (!res.data) {
        setErrorCodeGroup("Group Code já existe na base de dados.");
      } else {
        setErrorCodeGroup(null);
      }
      return (res.data);
    } catch (err) {;
      setErrorCodeGroup(err.message || "Erro ao verificar o GroupCode.");
      return false;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorEmail(null);
    setErrorPasswordCheck(null);
    setErrorPasswordMatch(null);

    const isValidCode = await verifyGroupCodeBd();
    if (!isValidCode) return;

    const allFields = [...firstConfigurationPage, ...secondconfigurationPage];
    const payload = allFields.reduce((acc, field) => {
      acc[field.lower] = formData[field.lower] ?? "";
      return acc;
    }, {});

    payload.authProvider = authProvider || 'local';
    if (authProvider === 'google') {
      payload.google_token = formData.google_token;
      delete payload.password;
      delete payload.confirmpassword;
    }

    try {
      // Se o teu backend tiver endpoint específico:
      // const res = authProvider === 'google'
      //   ? await apiCall.post('/auth/RegisterGoogle', payload)
      //   : await apiCall.post('/auth/Register', payload);

      const res = await RegistUser(payload);
      // setUser(res.data);
      if (!res.error)
      {
        navigate('/login'); 

      }
 
    } catch (err) {
      setErrorSubmit(err.message || 'Login failed');
    }
  };


  const renderFields = (fields) => {
    const visibleFields = authProvider === 'google'
      ? fields.filter(f => !['password', 'confirmpassword'].includes((f.lower || '').toLowerCase()))
      : fields;

    return (
      <div className="space-y-6">
        {visibleFields.map((field) => (
          <div key={field.lower} className="space-y-2">
            <label
              className="block text-sm font-medium"
              style={{ color: theme?.colors?.text?.secondary }}
            >
              {field.lower !== "code_invite" ? (
                field.label
              ) : (
                <div className="flex items-center space-x-2">
                  <span>{field.label.replace("_", " ")}</span>
                  <div className="relative inline-block">
                    <button
                      type="button"
                      className="focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full"
                      style={{ color: theme?.colors?.primary?.main }}
                      onMouseEnter={handleTooltipEnter}
                      onMouseLeave={() => setShowTooltip(false)}
                      onFocus={handleTooltipEnter}
                      onBlur={() => setShowTooltip(false)}
                      aria-label="Group code information"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                    {showTooltip && (
                      <div
                        role="tooltip"
                        className="absolute z-50 w-64 p-3 text-sm rounded-lg shadow-lg"
                        style={{
                          backgroundColor: theme?.colors?.background?.paper,
                          color: theme?.colors?.text?.primary,
                          border: `1px solid ${theme?.colors?.secondary?.light}`,
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          marginTop: '0.5rem',
                        }}
                      >
                        <div className="relative">
                          <div
                            className="absolute -top-2 left-1/2 transform -translate-x-1/2"
                            style={{
                              borderLeft: '8px solid transparent',
                              borderRight: '8px solid transparent',
                              borderBottom: `8px solid ${theme?.colors?.secondary?.light}`,
                            }}
                          />
                          <div
                            className="absolute -top-1.5 left-1/2 transform -translate-x-1/2"
                            style={{
                              borderLeft: '7px solid transparent',
                              borderRight: '7px solid transparent',
                              borderBottom: `7px solid ${theme?.colors?.background?.paper}`,
                            }}
                          />
                          You can ask your financial administrator that is already registered to give you. <br />
                          <b>Leave blank if you don't have a group code (you can add or change anytime)</b>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </label>

            <div className="relative">
              {field.label !== "Phone" && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {field.icon}
                </div>
              )}

              {field.label === "Phone" ? (
                <PhoneInput
                  defaultCountry="PT"
                  value={formData[field.lower] ?? ""}
                  onChange={(value) =>
                    handleChange({ target: { name: field.lower, value } })
                  }
                  className="w-full pl-3 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required={field.Required}
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  type={field.type || "text"}
                  name={field.lower}
                  placeholder={field.placeholder}
                  value={formData[field.lower] ?? ""}
                  onChange={handleChange}
                  className={`w-full ${field.label !== "Phone" ? 'pl-12' : 'pl-3'} pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all duration-200`}
                  required={field.Required && !(authProvider === 'google' && ['password','confirmpassword'].includes((field.lower || '').toLowerCase()))}
                  pattern={field.pattern || undefined}
                  label={field.label}
                  max={field.type === "date" ? new Date().toISOString().split("T")[0] : undefined}
                />
              )}
            </div>

            {field.label === "Email" && errorEmail && (
              <p className="text-sm" style={{ color: theme?.colors?.error?.main }}>
                {errorEmail}
              </p>
            )}

            {field.lower === "password" && authProvider !== 'google' &&
              errorPasswordCheck &&
              !errorPasswordMatch &&
              errorPasswordCheck.map((error, index) => (
                <p key={index} className="text-sm" style={{ color: theme?.colors?.error?.main }}>
                  {error}
                </p>
              ))}

            {field.lower === "confirmpassword" && authProvider !== 'google' && errorPasswordMatch && (
              <p className="text-sm" style={{ color: theme?.colors?.error?.main }}>
                Erro: {errorPasswordMatch}
              </p>
            )}

            {field.lower === "code_invite" && errorCodeGroup && (
              <p className="text-red-500 mt-2">{errorCodeGroup}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden" style={{ backgroundColor: theme?.colors?.background?.paper }}>
        <div className="p-8">
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: theme?.colors?.text?.primary }}>
            Create your account
          </h2>

          <div className="flex flex-col gap-4 mb-6">
            
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {step === 1 && (
              <>
                {renderFields(firstConfigurationPage)}
                
<div className="flex gap-4 mb-6 items-center">
       <button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-1/2 py-3 px-4 rounded-xl font-medium border transition-all duration-200 hover:bg-gray-50"
                  style={{
                    backgroundColor: theme?.colors?.background?.paper,
                    color: theme?.colors?.text?.primary,
                    borderColor: theme?.colors?.secondary?.light
                  }}
                >
                  Next
                </button>

  <div className="flex-1">
    {/* <GoogleOAuthProvider clientId="O_TEU_CLIENT_ID_GOOGLE">
      <div style={{ width: '100%' }}>
        <GoogleLogin
          // onSuccess={handleGoogleSuccess}
          // onError={handleGoogleError}
          theme="outline"
          size="large"
          text="signin_with"
          shape="pill"
          width="100%"
        />
      </div>
    </GoogleOAuthProvider> */}
  </div>

           
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-center text-lg mb-6" style={{ color: theme?.colors?.text?.secondary }}>
                  Just one more step to complete your registration
                </p>

                {authProvider === 'google' && (
                  <div
                    className="mb-4 text-sm px-3 py-2 rounded-lg border"
                    style={{ borderColor: theme?.colors?.secondary?.light, color: theme?.colors?.text?.secondary }}
                  >
                    A concluir registo com Google — não precisas de definir password.
                  </div>
                )}

                {renderFields(secondconfigurationPage)}

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-1/2 py-3 px-4 rounded-xl font-medium border transition-all duration-200 hover:bg-gray-50"
                    style={{
                      backgroundColor: theme?.colors?.background?.paper,
                      color: theme?.colors?.text?.primary,
                      borderColor: theme?.colors?.secondary?.light
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-1/2 py-3 px-4 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    style={{ backgroundColor: theme?.colors?.primary?.main }}
                  >
                    Complete Sign In
                  </button>
                </div>

                {errorSubmit && <p className="text-red-500 mt-2">{errorSubmit}</p>}
              </>
            )}
          </form>

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="text-sm font-medium hover:underline transition-colors duration-200"
              style={{ color: theme?.colors?.primary?.main }}
            >
              Don’t have an account? Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
