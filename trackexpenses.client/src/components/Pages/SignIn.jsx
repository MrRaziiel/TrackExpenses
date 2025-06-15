// src/pages/SignIn.jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiCall from '../../hooks/apiCall';
import { getPasswordValidation, pageConfigurations } from '../../utilis/configurations/SigninConfiguration';
import { useTheme } from '../Theme/Theme';
import { useLanguage } from '../../utilis/Translate/LanguageContext';
import { HelpCircle } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const SignIn = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [step, setStep] = useState(1);
  const [errorEmail, setErrorEmail] = useState(null);
  const [errorCodeGroup, setErrorCodeGroup] = useState(null);
  const [errorPasswordCheck, setErrorPasswordCheck] = useState(null);
  const [errorPasswordMatch, setErrorPasswordMatch] = useState(null);
  const [errorSubmit, setErrorSubmit] = useState(null);
  const [formData, setFormData] = useState({});

  const pagesConfigurations = pageConfigurations();
  const [firstConfigurationPage] = useState(pagesConfigurations.firstConfigurationPage);
  const [secondconfigurationPage] = useState(pagesConfigurations.secondconfigurationPage);

  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const handleTooltipEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    setTooltipPosition({
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft
    });
    setShowTooltip(true);
  };
  function verifyEmail(){
  if (formData.email == null || !String(formData.email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      )){
      setErrorEmail("Mail invalid: 'example@example.com'");
      return false;
    }
    return true;
  };

  function verifyPasswordCheck(){
    if (formData.password == null || formData.confirmpassword == null || formData.password != formData.confirmpassword) {
      setErrorPasswordMatch("As senhas não coincidem");
      return false;
    }
    return true;
  };

  function validPassword() {
 
    const password = formData.password || ""; 
    const validateList = getPasswordValidation(password);
    const errors = validateList.some(item => item.rule == false);
    if (errors)
    {
      var messageError = "";
      var messageErrorArray = [];
      validateList.forEach(item => {
        messageError = item.label
        messageError = (!item.rule) ? messageError += item.error : messageError += item.valid
        messageErrorArray.push(messageError);
      });

      setErrorPasswordCheck(messageErrorArray);
      return false
    }
    setErrorPasswordCheck(null);
    return true
 
    }

const verifyEmailBd = async () => {
  try {
    setErrorEmail(null);
    const res = await apiCall.get("/auth/EmailCheckInDb", {params: { email: formData.email }

});
    // Exemplo: lidar com o resultado
    if (res.data) {
      setErrorEmail("Email já existe na base de dados.");
    } else {
      setErrorEmail(null);
    }
    return (!res.data);
  } catch (err) {
    console.error("Erro ao verificar email:", err);
    setErrorEmail(err.message || "Erro ao verificar o email.");
    return false;
  }
};

const verifyGroupCodeBd = async () => {
  try {

    if (!formData.code_invite) return true;
    setErrorCodeGroup(null);
    const res = await apiCall.get("/auth/CodeGroupCheckBd", {params: { code: formData.code_invite }
});
    // Exemplo: lidar com o resultado
    
    if (!res.data) {
      setErrorCodeGroup("Group Code já existe na base de dados.");
    } else {
      setErrorCodeGroup(null);
    }
    return (res.data);
  } catch (err) {
    console.error("Erro ao verificar Group Code:", err);
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

  const handleNext = () => {
    if (! verifyEmail() ) return
    if (! verifyEmailBd()) return
    if (! validPassword() ) return
    if (! verifyPasswordCheck() ) return
    setErrorEmail(null);
    setErrorPasswordCheck(null);
    setErrorPasswordMatch(null);
    setStep(2);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorEmail(null);
    setErrorPasswordCheck(null);
    setErrorPasswordMatch(null);
    const isValidCode = await verifyGroupCodeBd();
    if (!isValidCode) return
    const allFields = [...firstConfigurationPage, ...secondconfigurationPage];
    console.log("allFields",allFields);
    const payload = allFields.reduce((acc, field) => {
      acc[field.lower] = formData[field.lower] ?? ""; // pega os dados reais do formulário
      return acc;
    }, {});
    try {
      console.log("payload", payload);
      const res = await apiCall.post('/auth/Register', payload);

    navigate('/login');
    setUser(res.data);
    } catch (err) {
      setErrorSubmit(err.message || 'Login failed');
    }
  };
  

const renderFields = (fields) => (
  <div className="space-y-6">
    {fields.map((field) => (
      <div key={field.lower} className="space-y-2">
        <label
          className="block text-sm font-medium"
          style={{ color: theme?.colors?.text?.secondary }}
        >
          {field.lower !== "Code_Invite" ? (
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
              className="w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              required={field.Required}
              pattern={field.pattern || undefined}
              label={field.label}
            />
          )}
        </div>
        {field.label === "Email" && errorEmail && (
          <p
            className="text-sm"
            style={{ color: theme?.colors?.error?.main }}
          >
            {errorEmail}
          </p>
        )}
        {field.lower === "password" &&
          errorPasswordCheck &&
          !errorPasswordMatch &&
          errorPasswordCheck.map((error, index) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: theme?.colors?.error?.main }}
            >
              {error}
            </p>
          ))}
        {field.lower === "confirmpassword" && errorPasswordMatch && (
          <p
            className="text-sm"
            style={{ color: theme?.colors?.error?.main }}
          >
            Erro: {errorPasswordMatch}
          </p>
        )}
        {field.lower === "code_invite" && errorCodeGroup &&  <p className="text-red-500 mt-2">{errorCodeGroup}</p>   }
      </div>
    ))}
  </div>
);
    


  return (
    <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden" style={{ backgroundColor: theme?.colors?.background?.paper }}>
        <div className="p-8">
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: theme?.colors?.text?.primary }}>
             Create your account
          </h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {step ===1 && (
            <>
             {renderFields(firstConfigurationPage)}
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

            </>
          )}
           {step ===2 && (
            <>
        <p className="text-center text-lg mb-6" style={{ color: theme?.colors?.text?.secondary }}>
                  Just one more step to complete your registration
                </p>
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
          
          {errorSubmit &&  <p className="text-red-500 mt-2">{errorSubmit}</p>   }
          </>
          
        )}
        </form>

        <div className="mt-8 text-center">
          <Link 
            to="/login"
            className="text-sm font-medium hover:underline transition-colors duration-200"
            style={{ color: theme?.colors?.primary?.main }}>
            Don’t have an account? Sign Up
          </Link>
        </div>
      </div>
    </div>
    </div>
  );
};

export default SignIn;