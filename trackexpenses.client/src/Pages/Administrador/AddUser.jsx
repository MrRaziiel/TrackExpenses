// src/Pages/Administrador/AddUser.jsx
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Title from "../../components/Titles/TitlePage";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import { useTheme } from "../../styles/Theme/Theme";

import Input from "../../components/Form/Input";
// usa as mesmas regras do SignIn
import { getPasswordValidation } from "../../utilis/Configurations/SigninConfiguration";

export default function AddUser() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState(null);
  const [errorEmail, setErrorEmail] = useState(null);
  const [errorPasswordCheck, setErrorPasswordCheck] = useState(null);

  const [form, setForm] = useState({
    FirstName: "",
    FamilyName: "",
    Email: "",
    Birthday: "",
    Telephone: "",
    Password: "",
    ConfirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    FirstName: null,
    FamilyName: null,
    Email: null,
    Password: null,
    ConfirmPassword: null,
  });

  const tt = (key, fallback) => {
    const v = t ? t(key) : undefined;
    return v && v !== key ? v : (fallback ?? key);
  };

  // helpers
  const emailDebounce = useRef(null);
  const normalizeEmail = (raw) => String(raw || "").trim().toLowerCase();
  const isValidEmailFormat = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const onChange = (k) => (e) => {
    let v = e.target.value;

    if (k === "Email") {
      v = normalizeEmail(v);
      setErrorEmail(null);
      clearTimeout(emailDebounce.current);
      emailDebounce.current = setTimeout(() => verifyEmail_Bd(v), 400);
    }

    if (k === "Telephone") {
      // só números
      v = String(v || "").replace(/\D/g, "");
    }

    if (k === "Password" || k === "ConfirmPassword") {
      setErrorPasswordCheck(null);
    }

    setForm((p) => ({ ...p, [k]: v }));
    setFieldErrors((fe) => ({ ...fe, [k]: null }));
  };

  const onPhoneKeyDown = (e) => {
    const blocked = ["e", "E", "+", "-", ".", ","];
    if (blocked.includes(e.key)) e.preventDefault();
  };

  // email: check BD
  const verifyEmail_Bd = async (emailArg) => {
    const email = normalizeEmail(emailArg ?? form.Email);
    setErrorEmail(null);

    if (!email) {
      setErrorEmail(tt("auth.errors.emailRequired"));
      return false;
    }
    if (!isValidEmailFormat(email)) {
      setErrorEmail(tt("auth.errors.emailInvalid"));
      return false;
    }

    const response = await apiCall.post("/User/EmailCheckInDb", email);
    if (!response?.ok) {
      setErrorEmail(response?.error?.message || tt("auth.errors.emailCheckFailed"));
      return false;
    }
    if (response?.data === true) {
      setErrorEmail(tt("auth.errors.emailAlreadyRegistered"));
      return false;
    }
    return true;
  };

  const onEmailBlur = () => {
    clearTimeout(emailDebounce.current);
    verifyEmail_Bd();
  };

  const parseBirthdayToISO = (v) => {
    if (!v) return null;
    const dt = new Date(v + "T00:00:00");
    return isNaN(dt) ? null : dt.toISOString();
  };

  function validPassword() {
    const rules = getPasswordValidation(form.Password || "");
    const hasErrors = rules.some((i) => i.rule === false);
    if (hasErrors) {
      const msgs = rules.map((i) => `${i.label}${i.rule ? i.valid : i.error}`);
      setErrorPasswordCheck(msgs);
      return false;
    }
    setErrorPasswordCheck(null);
    return true;
  }

  const validateRequireds = () => {
    const errs = {
      FirstName: form.FirstName ? null : tt("auth.errors.firstNameRequired"),
      FamilyName: form.FamilyName ? null : tt("auth.errors.familyNameRequired"),
      Email: form.Email ? null : tt("auth.errors.emailRequired"),
      Password: form.Password ? null : tt("auth.errors.passwordRequired"),
      ConfirmPassword: form.ConfirmPassword ? null : tt("auth.errors.confirmPasswordRequired"),
    };

    if (!errs.Password && !errs.ConfirmPassword && form.Password !== form.ConfirmPassword) {
      errs.ConfirmPassword = tt("auth.errors.passwordsDontMatch");
    }

    setFieldErrors(errs);
    return Object.values(errs).every((v) => !v);
  };

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    if (saving) return;
    setSaving(true);
    setErrorSubmit(null);

    if (!validateRequireds()) { setSaving(false); return; }
    if (!(await verifyEmail_Bd())) { setSaving(false); return; }
    if (!validPassword()) { setSaving(false); return; }

    try {
      const payload = {
        FirstName: form.FirstName,
        FamilyName: form.FamilyName,
        Email: normalizeEmail(form.Email),
        Birthday: parseBirthdayToISO(form.Birthday),
        CodeInvite: "", // 👈 como pediste
        PhoneNumber: form.Telephone,
        Password: form.Password,
        ConfirmPassword: form.ConfirmPassword,
      };

      const response = await apiCall.post("/User/Register", payload);
      if (!response?.ok) {
        setErrorSubmit(response?.error?.message || tt("auth.errors.registerFailed"));
        setSaving(false);
        return;
      }

      navigate("/login");
    } catch (err) {
      setErrorSubmit(err?.message || tt("auth.errors.registerFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[72rem] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Title text={tt("auth.addUser.title", "Adicionar utilizador")} />
      </div>

      <form
        id="add-user-form"
        onSubmit={onSubmit}
        className="bg-white rounded-3xl shadow-xl p-6 md:p-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label={tt("auth.fields.firstName")}
            placeholder={tt("auth.fields.firstNamePh")}
            value={form.FirstName}
            onChange={onChange("FirstName")}
            error={fieldErrors.FirstName || undefined}
            inputClassName="h-12"
          />

          <Input
            label={tt("auth.fields.familyName")}
            placeholder={tt("auth.fields.familyNamePh")}
            value={form.FamilyName}
            onChange={onChange("FamilyName")}
            error={fieldErrors.FamilyName || undefined}
            inputClassName="h-12"
          />

          <Input
            label={tt("auth.fields.email")}
            type="email"
            placeholder={tt("auth.fields.emailPh")}
            value={form.Email}
            onChange={onChange("Email")}
            onBlur={onEmailBlur}
            error={fieldErrors.Email || errorEmail || undefined}
            inputClassName="h-12"
          />

          <Input
            label={tt("auth.fields.birthday")}
            type="date"
            value={form.Birthday}
            onChange={onChange("Birthday")}
            inputClassName="h-12"
          />

          <Input
            label={tt("auth.fields.telephone")}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={tt("auth.fields.telephonePh")}
            value={form.Telephone}
            onChange={onChange("Telephone")}
            onKeyDown={(e) => {
              const blocked = ["e", "E", "+", "-", ".", ","];
              if (blocked.includes(e.key)) e.preventDefault();
            }}
            inputClassName="h-12"
          />

          <Input
            label={tt("auth.fields.password")}
            type="password"
            autoComplete="new-password"
            placeholder={tt("auth.fields.passwordPh")}
            value={form.Password}
            onChange={onChange("Password")}
            error={fieldErrors.Password || undefined}
            inputClassName="h-12"
          />

          <Input
            label={tt("auth.fields.confirmPassword")}
            type="password"
            autoComplete="new-password"
            placeholder={tt("auth.fields.confirmPasswordPh")}
            value={form.ConfirmPassword}
            onChange={onChange("ConfirmPassword")}
            error={fieldErrors.ConfirmPassword || undefined}
            inputClassName="h-12"
          />
        </div>

        {errorPasswordCheck && Array.isArray(errorPasswordCheck) && (
          <ul className="mt-4 space-y-1 text-sm">
            {errorPasswordCheck.map((msg, idx) => (
              <li key={idx} className="text-red-600">• {msg}</li>
            ))}
          </ul>
        )}

        {errorSubmit && (
          <div className="mt-4 text-sm text-red-600">{errorSubmit}</div>
        )}

        <div className="mt-8 flex items-center gap-3 justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 h-10 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-60"
            disabled={saving}
          >
            {tt("common.cancel")}
          </button>

          <button
            form="add-user-form"
            type="submit"
            disabled={saving}
            className="px-5 h-10 rounded-2xl text-white shadow-md hover:shadow-lg disabled:opacity-60"
            style={{ backgroundColor: theme?.colors?.primary?.main }}
          >
            {saving ? tt("common.saving") : tt("common.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
