// src/Pages/Autentication/SignIn.jsx
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Phone } from "lucide-react";

import Card from "../../components/UI/Card";
import Input from "../../components/Form/Input";
import Button from "../../components/Buttons/Button";
import InfoTooltip from "../../components/UI/InfoTooltip";

import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";

function getPasswordValidation(pwd = "") {
  const rules = [
    {
      key: "len",
      label: "• At least 8 characters",
      rule: pwd.length >= 8,
      valid: " ✓",
      error: " ✗",
    },
    {
      key: "upper",
      label: "• One uppercase letter",
      rule: /[A-Z]/.test(pwd),
      valid: " ✓",
      error: " ✗",
    },
    {
      key: "lower",
      label: "• One lowercase letter",
      rule: /[a-z]/.test(pwd),
      valid: " ✓",
      error: " ✗",
    },
    {
      key: "num",
      label: "• One number",
      rule: /\d/.test(pwd),
      valid: " ✓",
      error: " ✗",
    },
  ];
  return rules;
}

export default function SignIn() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // steps
  const [step, setStep] = useState(1);

  // form
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmpassword: "",
    firstName: "",
    familyName: "",
    birthDate: "", // yyyy-mm-dd
    phone: "",
    codeinvite: "",
  });

  // errors
  const [errorEmail, setErrorEmail] = useState(null);
  const [errorPasswordMatch, setErrorPasswordMatch] = useState(null);
  const [errorPasswordCheck, setErrorPasswordCheck] = useState(null); // array ou string
  const [errorCodeGroup, setErrorCodeGroup] = useState(null);
  const [errorSubmit, setErrorSubmit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // date picker (escondido — abre no ícone)
  const hiddenDateRef = useRef(null);
  const openDatePicker = () => {
    const el =
      hiddenDateRef.current ||
      document.getElementById("hidden-birthdate-input");
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.click();
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    // guarda sem espaços nas pontas
    setFormData((p) => ({ ...p, [name]: (value ?? "").trim() }));
  };

  const handleNext = async (e) => {
    e?.preventDefault?.();
    if (!verifyEmail()) return;
    const isEmailValid = await verifyEmail_Bd();
    if (!isEmailValid) return;
    if (!validPassword()) return;
    if (!verifyPasswordCheck()) return;
    setStep(2);
  };

  /* validations */
  function verifyEmail() {
    const email = formData.email ?? "";
    const ok = !!email
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
    if (!ok) {
      setErrorEmail("Mail invalid: 'example@example.com'");
      return false;
    }
    setErrorEmail(null);
    return true;
  }

  function verifyPasswordCheck() {
    const { password, confirmpassword } = formData;
    const ok =
      password != null &&
      confirmpassword != null &&
      password === confirmpassword;
    if (!ok) {
      setErrorPasswordMatch("As senhas não coincidem");
      return false;
    }
    setErrorPasswordMatch(null);
    return true;
  }

  function validPassword() {
    const validateList = getPasswordValidation(formData.password || "");
    const hasErrors = validateList.some((i) => i.rule === false);
    if (hasErrors) {
      setErrorPasswordCheck(
        validateList.map((i) => (!i.rule ? i.label + i.error : i.label + i.valid))
      );
      return false;
    }
    setErrorPasswordCheck(null);
    return true;
  }

  const verifyEmail_Bd = async () => {
    setErrorEmail(null);
    if (!formData?.email) {
      setErrorEmail("Please fill Email.");
      return false;
    }
    const response = await apiCall.post("/User/EmailCheckInDb", formData.email);
    if (!response.ok) {
      setErrorEmail(response.error.message);
      return false;
    }
    if (response?.data === true) {
      setErrorEmail("Email already registed");
      return false;
    }
    return true;
  };

  const verifyGroupCodeBd = async () => {
    setErrorCodeGroup(null);
    if (!formData.codeinvite) return true; // opcional
    const response = await apiCall.post(
      "/Group/check-code",
      JSON.stringify(formData.codeinvite)
    );
    if (!response.ok) {
      setErrorSubmit(response.error.message);
      return false;
    }
    if (response?.data === false) {
      setErrorCodeGroup(
        "Group Code doesn't exist, please correct that or leave empty."
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorSubmit("");
    const isValidCode = await verifyGroupCodeBd();
    if (!isValidCode) return;

    const firstConfigurationPage = [
      { lower: "email" },
      { lower: "password" },
      { lower: "confirmpassword" },
    ];
    const secondconfigurationPage = [
      { lower: "firstName" },
      { lower: "familyName" },
      { lower: "birthDate" },
      { lower: "phone" },
      { lower: "codeinvite" },
    ];

    const allFields = [
      ...firstConfigurationPage,
      ...secondconfigurationPage,
    ];
    const payload = allFields.reduce((acc, f) => {
      acc[f.lower] = formData[f.lower] ?? "";
      return acc;
    }, {});

    setSubmitting(true);
    const response = await apiCall.post("/User/Register", payload);
    setSubmitting(false);

    if (!response.ok) {
      setErrorSubmit(response.error.message);
      return;
    }
    navigate("/login");
  };


  return (
    <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <Card
        className="w-full max-w-md"
        style={{
          backgroundColor: theme.colors.background.paper,
          boxShadow: `0 25px 50px -12px ${theme.colors.primary.dark}3D`,
        }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6">
          <h1
            className="text-3xl font-bold text-center"
            style={{ color: theme.colors.text.primary }}
          >
            {t("auth.createTitle") || "Create your account"}
          </h1>
          <p
            className="text-sm text-center mt-2"
            style={{ color: theme.colors.text.secondary }}
          >
            {t("auth.createSubtitle") ||
              "Just one more step to complete your registration"}
          </p>
        </div>

        {/* Form */}
        <form
          className="px-8 pb-8 space-y-6"
          onSubmit={step === 1 ? handleNext : handleSubmit}
        >
          {step === 1 ? (
            <>
              <Input
                name="email"
                label={t("common.email") || "Email"}
                placeholder="me@example.org"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
              {errorEmail && (
                <p className="text-sm -mt-4" style={{ color: theme.colors.error.main }}>
                  {errorEmail}
                </p>
              )}

              <Input
                name="password"
                label={t("common.password") || "Password"}
                placeholder="****************"
                type="password"
                value={formData.password}
                onChange={handleChange}
              />

              <Input
                name="confirmpassword"
                label={t("auth.confirmPassword") || "Confirm Password"}
                placeholder="****************"
                type="password"
                value={formData.confirmpassword}
                onChange={handleChange}
              />
              {errorPasswordMatch && (
                <p className="text-sm -mt-4" style={{ color: theme.colors.error.main }}>
                  {errorPasswordMatch}
                </p>
              )}
              {Array.isArray(errorPasswordCheck) && errorPasswordCheck.length > 0 && (
                <div className="text-xs -mt-4 space-y-1" style={{ color: theme.colors.text.secondary }}>
                  {errorPasswordCheck.map((ln, idx) => (
                    <div key={idx}>{ln}</div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <Button type="submit" size="lg" fullWidth>
                  {t("auth.next") || "Next"}
                </Button>
              </div>

              <div className="text-center pt-2">
                <Link
                  to="/Login"
                  className="text-sm hover:underline"
                  style={{ color: theme.colors.primary.main }}
                >
                  {t("auth.alreadyAccount") || "Already have an account? Sign in"}
                </Link>
              </div>
            </>
          ) : (
            <>
              <Input
                name="firstName"
                label={t("auth.firstName") || "First Name"}
                placeholder={t("auth.firstNamePH") || "First Name"}
                value={formData.firstName}
                onChange={handleChange}
              />
              <Input
                name="familyName"
                label={t("auth.familyName") || "Family Name"}
                placeholder={t("auth.familyNamePH") || "Family Name"}
                value={formData.familyName}
                onChange={handleChange}
              />

              {/* Date with icon */}
              <div>
                <label
                  className="block text-sm mb-2"
                  style={{ color: theme.colors.text.secondary }}
                >
                  {t("auth.date") || "Date"}
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={formData.birthDate ? formData.birthDate : ""}
                    placeholder="dd/mm/aaaa"
                    readOnly
                    className="w-full h-12 rounded-xl border px-4 pr-11 focus:ring-2 focus:ring-blue-500 transition"
                    style={{
                      backgroundColor: theme.colors.background.paper,
                      color: theme.colors.text.primary,
                      borderColor: theme.colors.secondary.light,
                    }}
                  />

                  <button
                    type="button"
                    onClick={openDatePicker}
                    className="absolute inset-y-0 right-0 px-3 flex items-center opacity-80 hover:opacity-100"
                    title={t("auth.pickDate") || "Pick a date"}
                    aria-label={t("auth.pickDate") || "Pick a date"}
                  >
                    <Calendar className="h-5 w-5" />
                  </button>

                  <input
                    id="hidden-birthdate-input"
                    ref={hiddenDateRef}
                    type="date"
                    value={formData.birthDate || ""}
                    onChange={(e) =>
                      setFormData((s) => ({ ...s, birthDate: e.target.value }))
                    }
                    className="sr-only"
                  />
                </div>
              </div>

              <Input
                name="phone"
                label={t("auth.phone") || "Phone"}
                placeholder="000000000"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                leftIcon={<Phone className="h-5 w-5 opacity-80" />}
                inputClassName="h-12"
              />

              {/* Invite code + tooltip */}
              <div>
                <label
                  className="flex items-center gap-2 text-sm font-medium mb-1 opacity-90"
                  style={{ color: theme.colors.text.secondary }}
                >
                  {t("auth.codeInvite") || "Code Invite"}
                  <InfoTooltip
                    side="right"
                    html={
                      t("auth.inviteHelp") ||
                      `You can ask your financial administrator that is already registered to give you.
                       <br /><b>Leave blank if you don't have a group code (you can add or change anytime)</b>`
                    }
                  />
                </label>

                <Input
                  name="codeinvite"
                  placeholder={t("auth.inviteCodePH") || "Group Code (optional)"}
                  value={formData.codeinvite}
                  onChange={handleChange}
                  inputClassName="h-12"
                />
                {errorCodeGroup && (
                  <p className="text-sm mt-2" style={{ color: theme.colors.error.main }}>
                    {errorCodeGroup}
                  </p>
                )}
              </div>

              {errorSubmit && (
                <p className="text-sm" style={{ color: theme.colors.error.main }}>
                  {errorSubmit}
                </p>
              )}

              {/* Botões com a MESMA largura */}
              <div className="pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="w-full">
                    <Button
                      variant="secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        setStep(1);
                      }}
                      fullWidth
                    >
                      {t("common.back") || "Back"}
                    </Button>
                  </div>
                  <div className="w-full">
                    <Button type="submit" disabled={submitting} fullWidth>
                      {t("auth.createAccount") || "Create account"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-center pt-2">
                <Link
                  to="/Login"
                  className="text-sm hover:underline"
                  style={{ color: theme.colors.primary.main }}
                >
                  {t("auth.alreadyAccount") || "Already have an account? Sign in"}
                </Link>
              </div>
            </>
          )}
        </form>
      </Card>
    </div>
  );
}
