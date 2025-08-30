// src/pages/SignIn.jsx
import React, { useState, useRef, useEffect, isValidElement } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { getPasswordValidation, pageConfigurations } from '../../utilis/Configurations/SigninConfiguration.jsx';
import { useTheme } from '../../styles/Theme/Theme.jsx';
import { HelpCircle } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import apiCall from '../../services/ApiCallGeneric/apiCall.jsx';

const TODAY = new Date().toISOString().split('T')[0];

/* Tooltip via Portal (não é cortado por overflow) */
function TooltipPortal({ anchorRef, open, children, theme }) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 256 });

  useEffect(() => {
    if (!open || !anchorRef?.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const margin = 8;
    const width = 256; // ≈ w-64
    const estimatedHeight = 120;
    const hasSpaceBottom = r.bottom + margin + estimatedHeight < window.innerHeight;
    const top = hasSpaceBottom ? r.bottom + margin : r.top - estimatedHeight - margin;
    let left = r.left + r.width / 2 - width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    setPos({ top, left, width });
  }, [open, anchorRef]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      role="tooltip"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 9999,
        backgroundColor: theme?.colors?.background?.paper,
        color: theme?.colors?.text?.primary,
        border: `1px solid ${theme?.colors?.secondary?.light}`,
        borderRadius: 8,
        padding: 12,
        boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
      }}
    >
      {children}
    </div>,
    document.body
  );
}

const SignIn = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [step, setStep] = useState(1);

  // Errors
  const [errorEmail, setErrorEmail] = useState(null);
  const [errorCodeGroup, setErrorCodeGroup] = useState(null);
  const [errorPasswordCheck, setErrorPasswordCheck] = useState(null);
  const [errorPasswordMatch, setErrorPasswordMatch] = useState(null);
  const [errorSubmit, setErrorSubmit] = useState(null);

  const [formData, setFormData] = useState({});

  const { firstConfigurationPage, secondconfigurationPage } = pageConfigurations();

  const [showTooltip, setShowTooltip] = useState(false);
  const helpRef = useRef(null);

  /* utils */
  const renderIcon = (icon) => {
    if (!icon) return null;
    let IconComp = null;
    if (isValidElement(icon) && typeof icon.type === 'function') IconComp = icon.type;
    else if (typeof icon === 'function') IconComp = icon;
    return IconComp ? <IconComp className="h-5 w-5" aria-hidden="true" /> : null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Guardar SEM espaços nas pontas
    setFormData((p) => ({ ...p, [name]: (value ?? '').trim() }));
  };

  const handleNext = async () => {
    if (!verifyEmail()) return;
    const isEmailValid = await verifyEmail_Bd();
    if (!isEmailValid) return;
    if (!validPassword()) return;
    if (!verifyPasswordCheck()) return;
    setStep(2);
  };

  /* validations (JS, sem usar pattern HTML) */
  function verifyEmail() {
    const email = formData.email ?? '';
    const ok = !!email.toLowerCase().match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
    if (!ok) { setErrorEmail("Mail invalid: 'example@example.com'"); return false; }
    setErrorEmail(null); return true;
  }

  function verifyPasswordCheck() {
    const { password, confirmpassword } = formData;
    const ok = password != null && confirmpassword != null && password === confirmpassword;
    if (!ok) { setErrorPasswordMatch('As senhas não coincidem'); return false; }
    setErrorPasswordMatch(null); return true;
  }

  function validPassword() {
    const validateList = getPasswordValidation(formData.password || '');
    const hasErrors = validateList.some((i) => i.rule === false);
    if (hasErrors) {
      setErrorPasswordCheck(validateList.map((i) => (!i.rule ? i.label + i.error : i.label + i.valid)));
      return false;
    }
    setErrorPasswordCheck(null); return true;
  }

  const verifyEmail_Bd = async () => {
    setErrorEmail(null);
    if (!formData?.email) { setErrorEmail('Please fill Email.'); return false; }
    const response = await apiCall.post('/User/EmailCheckInDb', formData.email);
    if (!response.ok) { setErrorEmail(response.error.message); return false; }
    if (response?.data === true) { setErrorEmail('Email already registed'); return false; }
    return true;
  };

  const verifyGroupCodeBd = async () => {
    setErrorCodeGroup(null);
    if (!formData.codeinvite) return true;
    const response = await apiCall.post('/Group/check-code', JSON.stringify(formData.codeinvite));
    if (!response.ok) { setErrorSubmit(response.error.message); return false; }
    if (response?.data === false) { setErrorCodeGroup("Group Code doesn't exist, please correct that or leave empty."); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorSubmit('');
    const isValidCode = await verifyGroupCodeBd();
    if (!isValidCode) return;

    const allFields = [...firstConfigurationPage, ...secondconfigurationPage];
    const payload = allFields.reduce((acc, f) => {
      acc[f.lower] = formData[f.lower] ?? '';
      return acc;
    }, {});

    const response = await apiCall.post('/User/Register', payload);
    if (!response.ok) { setErrorSubmit(response.error.message); return; }
    navigate('/login');
  };

  const renderFields = (fields) => (
    <div className="space-y-6">
      {fields.map((field) => {
        const isCodeInvite = field.lower === 'codeinvite';

        return (
          <div key={field.lower} className="space-y-2">
            <label
              className="text-sm font-medium"
              style={{ color: theme?.colors?.text?.secondary }}
              htmlFor={field.lower}
            >
              {field.label}
            </label>

            {/* Tooltip só no Code Invite */}
            {isCodeInvite && (
              <div className="inline-flex items-center gap-2">
                <button
                  ref={helpRef}
                  type="button"
                  className="focus:outline-none rounded-full"
                  style={{ color: theme?.colors?.primary?.main }}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onFocus={() => setShowTooltip(true)}
                  onBlur={() => setShowTooltip(false)}
                  aria-label="Group code information"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>

                <TooltipPortal anchorRef={helpRef} open={showTooltip} theme={theme}>
                  <div>
                    You can ask your financial administrator that is already registered to give you. <br />
                    <b>Leave blank if you don't have a group code (you can add or change anytime)</b>
                  </div>
                </TooltipPortal>
              </div>
            )}

            <div className="relative">
              {field.label !== 'Phone' && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {renderIcon(field.icon)}
                </div>
              )}

              {field.label === 'Phone' ? (
                <PhoneInput
                  defaultCountry="PT"
                  value={formData[field.lower] ?? ''}
                  onChange={(value) =>
                    handleChange({ target: { name: field.lower, value: value || '' } })
                  }
                  className="w-full pl-3 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required={!!field.Required}
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  id={field.lower}
                  type={field.type || 'text'}
                  name={field.lower}
                  placeholder={field.placeholder}
                  value={formData[field.lower] ?? ''}
                  onChange={handleChange}
                  className={`w-full ${field.label !== 'Phone' ? 'pl-12' : 'pl-3'} pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all duration-200`}
                  required={!!field.Required}
                  autoComplete={field.autoComplete || 'off'}
                  // ⚠️ Sem pattern HTML. Sem limites, a menos que queira em datas/números:
                  {...(field.type === 'date' ? { max: TODAY } : {})}
                  {...(field.type === 'number' && typeof field.max === 'number' ? { max: field.max } : {})}
                  // Removido: pattern / maxLength para evitar balões "formato pedido"
                />
              )}
            </div>

            {/* erros */}
            {field.label === 'Email' && errorEmail && (
              <p className="text-sm" style={{ color: theme?.colors?.error?.main }}>{errorEmail}</p>
            )}
            {field.lower === 'password' && errorPasswordCheck && !errorPasswordMatch &&
              errorPasswordCheck.map((err, i) => (
                <p key={i} className="text-sm" style={{ color: theme?.colors?.error?.main }}>{err}</p>
              ))}
            {field.lower === 'confirmpassword' && errorPasswordMatch && (
              <p className="text-sm" style={{ color: theme?.colors?.error?.main }}>Erro: {errorPasswordMatch}</p>
            )}
            {isCodeInvite && errorCodeGroup && (
              <p className="text-red-500 mt-2">{errorCodeGroup}</p>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div
        className="max-w-md w-full rounded-2xl shadow-xl overflow-hidden"
        style={{ backgroundColor: theme?.colors?.background?.paper }}
      >
        <div className="p-8">
          <h2 className="text-3xl font-bold text-center mb-2" style={{ color: theme?.colors?.text?.primary }}>
            Create your account
          </h2>
          <p className="text-center mb-6" style={{ color: theme?.colors?.text?.secondary }}>
            Just one more step to complete your registration
          </p>

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
                      borderColor: theme?.colors?.secondary?.light,
                    }}
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {renderFields(secondconfigurationPage)}
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-1/2 py-3 px-4 rounded-xl font-medium border transition-all duration-200 hover:bg-gray-50"
                    style={{
                      backgroundColor: theme?.colors?.background?.paper,
                      color: theme?.colors?.text?.primary,
                      borderColor: theme?.colors?.secondary?.light,
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-1/2 py-3 px-4 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    style={{ backgroundColor: theme?.colors?.primary?.main }}
                  >
                    Create account
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
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
