// src/Pages/Administrador/Users/AddUser.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Title from "../../components/Titles/TitlePage";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import { useTheme } from "../../styles/Theme/Theme";

export default function AddUser() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState(null);
  const [errorEmail, setErrorEmail] = useState(null);
  const [errorPasswordCheck, setErrorPasswordCheck] = useState(null);
  const [groups, setGroups] = useState([]);

  const [form, setForm] = useState({
    FirstName: "",
    FamilyName: "",
    Email: "",
    Birthday: "",
    GroupId: "",
    Role: "USER",
    Telephone: "",
    Password: "",
    ConfirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    FirstName: null,
    FamilyName: null,
    Email: null,
    Role: null,
    GroupId: null,
    Password: null,
    ConfirmPassword: null,
  });

  const tt = (key, fallback) => {
    const v = t ? t(key) : undefined;
    return v && v !== key ? v : (fallback || key);
  };

  // estilos
  const inputBase =
    "w-full h-12 rounded-2xl border border-gray-200 px-4 " +
    "placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100 " +
    "focus:border-blue-400 transition";
  const labelBase = "block text-sm font-medium text-gray-700 mb-1";
  const errorText = "text-sm text-red-600 mt-1";

  const onChange = (k) => (e) => {
    const v = e.target.value;
    setForm((p) => ({ ...p, [k]: v }));
    // limpa erro daquele campo ao editar
    setFieldErrors((fe) => ({ ...fe, [k]: null }));
    if (k === "Email") setErrorEmail(null);
    if (k === "Password" || k === "ConfirmPassword") setErrorPasswordCheck(null);
  };

  // helper role
  const isGroupAdmin = (role) =>
    String(role || "").toUpperCase().replace(/\s+/g, "") === "GROUPADMINISTRATOR";

  const onRoleChange = (e) => {
    const newRole = e.target.value;
    setForm((p) => ({
      ...p,
      Role: newRole,
      GroupId: isGroupAdmin(newRole) ? "" : p.GroupId, 
    }));
    setFieldErrors((fe) => ({ ...fe, Role: null, GroupId: null }));
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const response = await apiCall.get("Administrator/GetAllGroupsNames");
        const list = response?.data?.GroupNames?.$values ?? [];
        if (alive) setGroups(list);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  const groupOptions = useMemo(
    () => groups.map((g) => ({ value: g.Id, label: g.Name })),
    [groups]
  );

  const verifyEmail_Bd = async () => {
    setErrorEmail(null);
    if (!form.Email) {
      setErrorEmail("Please fill Email.");
      return false;
    }
    const response = await apiCall.post("/User/EmailCheckInDb", form.Email);
    if (!response?.ok) {
      setErrorEmail(response?.error?.message || "Email check failed");
      return false;
    }
    if (response?.data === true) {
      setErrorEmail("Email already registered");
      return false;
    }
    return true;
  };

  const parseBirthdayToISO = (v) => {
  if (!v) return null;
  // v vem como "yyyy-MM-dd"
  const dt = new Date(v + "T00:00:00");
  return isNaN(dt) ? null : dt.toISOString(); // "2025-08-27T01:01:43.786Z"
};

  const getPasswordValidation = (pwd) => {
    const list = [
      {
        key: "len",
        label: "Length: ",
        rule: typeof pwd === "string" && pwd.length >= 8,
        valid: "ok (≥8)",
        error: "min 8 chars",
      },
      {
        key: "upper",
        label: "Uppercase: ",
        rule: /[A-Z]/.test(pwd),
        valid: "ok",
        error: "need A-Z",
      },
      {
        key: "lower",
        label: "Lowercase: ",
        rule: /[a-z]/.test(pwd),
        valid: "ok",
        error: "need a-z",
      },
      {
        key: "digit",
        label: "Number: ",
        rule: /\d/.test(pwd),
        valid: "ok",
        error: "need 0-9",
      },
      {
        key: "symbol",
        label: "Symbol: ",
        rule: /[^A-Za-z0-9]/.test(pwd),
        valid: "ok",
        error: "need symbol",
      },
    ];
    return list;
  };

  function validPassword() {
    const password = form.Password || "";
    const validateList = getPasswordValidation(password);
    const hasErrors = validateList.some((item) => item.rule === false);

    if (hasErrors) {
      const messageErrorArray = [];
      validateList.forEach((item) => {
        const message = !item.rule ? item.label + item.error : item.label + item.valid;
        messageErrorArray.push(message);
      });
      setErrorPasswordCheck(messageErrorArray);
      return false;
    }
    setErrorPasswordCheck(null);
    return true;
  }

  const validateRequireds = () => {
    const errs = {
      FirstName: form.FirstName ? null : "First name is required",
      FamilyName: form.FamilyName ? null : "Family name is required",
      Email: form.Email ? null : "Email is required",
      Role: form.Role ? null : "Role is required",
      GroupId: isGroupAdmin(form.Role) ? null : (form.GroupId ? null : "Group is required"),
      Password: form.Password ? null : "Password is required",
      ConfirmPassword: form.ConfirmPassword ? null : "Confirm password is required",
    };

    if (!errs.Password && !errs.ConfirmPassword && form.Password !== form.ConfirmPassword) {
      errs.ConfirmPassword = "Passwords do not match";
    }

    setFieldErrors(errs);
    return Object.values(errs).every((v) => !v);
  };

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    setErrorSubmit(null);

    const requiredOk = validateRequireds();
    if (!requiredOk) {
      setSaving(false);
      return;
    }

    const emailOk = await verifyEmail_Bd();
    if (!emailOk) {
      setSaving(false);
      return;
    }

    const passwordOk = validPassword();
    if (!passwordOk) {
      setSaving(false);
      return;
    }

    try {
      const payload = {
        FirstName: form.FirstName,
        FamilyName: form.FamilyName,
        Email: form.Email,
        Birthday: parseBirthdayToISO(form.Birthday),
        CodeInvite: isGroupAdmin(form.Role) ? "" : form.GroupId, 
        PhoneNumber: form.Telephone,
        Password: form.Password,
        ConfirmPassword: form.ConfirmPassword,
      };
      const response = await apiCall.post("/User/Register", payload);
      if (!response?.ok) {
        setErrorSubmit(response?.error?.message || "Error while registering user");
        setSaving(false);
        return;
      }

      navigate("/login");
    } catch (err) {
      setErrorSubmit(err?.message || "Error while registering user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[72rem] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Title text={tt("common.addUser", "Add user")} />
      </div>

      <form
        id="add-user-form"
        onSubmit={onSubmit}
        className="bg-white rounded-3xl shadow-xl p-6 md:p-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelBase}>{tt("common.firstName", "First Name")}</label>
            <input
              className={inputBase}
              placeholder={tt("common.firstName", "First Name")}
              value={form.FirstName}
              onChange={onChange("FirstName")}
            />
            {fieldErrors.FirstName && <p className={errorText}>{fieldErrors.FirstName}</p>}
          </div>

          <div>
            <label className={labelBase}>{tt("common.familyName", "Family Name")}</label>
            <input
              className={inputBase}
              placeholder={tt("common.familyName", "Family Name")}
              value={form.FamilyName}
              onChange={onChange("FamilyName")}
            />
            {fieldErrors.FamilyName && <p className={errorText}>{fieldErrors.FamilyName}</p>}
          </div>

          <div>
            <label className={labelBase}>Email</label>
            <input
              className={inputBase}
              type="email"
              placeholder="me@example.org"
              value={form.Email}
              onChange={onChange("Email")}
              onBlur={verifyEmail_Bd}
            />
            {fieldErrors.Email && <p className={errorText}>{fieldErrors.Email}</p>}
            {errorEmail && <p className={errorText}>{errorEmail}</p>}
          </div>

          <div>
            <label className={labelBase}>{tt("common.birthday", "Birthday")}</label>
            <input
              className={inputBase}
              type="date"
              placeholder="dd/mm/aaaa"
              value={form.Birthday}
              onChange={onChange("Birthday")}
            />
          </div>

          {/* Role */}
          <div>
            <label className={labelBase}>{tt("common.role", "Role")}</label>
            <select className={inputBase} value={form.Role} onChange={onRoleChange}>
              <option value="USER">USER</option>
              <option value="GROUP ADMINISTRATOR">GROUP ADMINISTRATOR</option>
              <option value="ADMINISTRATOR">ADMINISTRATOR</option>
            </select>
            {fieldErrors.Role && <p className={errorText}>{fieldErrors.Role}</p>}
          </div>

          {!isGroupAdmin(form.Role) && (
            <div>
              <label className={labelBase}>{tt("common.group", "Group")}</label>
              <select
                className={inputBase}
                value={form.GroupId}
                onChange={onChange("GroupId")}
              >
                <option value="">{tt("common.selectOption", "Select an option")}</option>
                {groupOptions.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              {fieldErrors.GroupId && <p className={errorText}>{fieldErrors.GroupId}</p>}
            </div>
          )}

          <div>
            <label className={labelBase}>{tt("common.telephone", "Telephone")}</label>
            <input
              className={inputBase}
              type="tel"
              placeholder={tt("common.telephone", "Telephone")}
              value={form.Telephone}
              onChange={onChange("Telephone")}
            />
          </div>

          <div>
            <label className={labelBase}>{tt("common.password", "Password")}</label>
            <input
              className={inputBase}
              type="password"
              autoComplete="new-password"
              placeholder={tt("common.password", "Password")}
              value={form.Password}
              onChange={onChange("Password")}
            />
            {fieldErrors.Password && <p className={errorText}>{fieldErrors.Password}</p>}
          </div>

          <div>
            <label className={labelBase}>{tt("common.confirmPassword", "Confirm Password")}</label>
            <input
              className={inputBase}
              type="password"
              autoComplete="new-password"
              placeholder={tt("common.confirmPassword", "Confirm Password")}
              value={form.ConfirmPassword}
              onChange={onChange("ConfirmPassword")}
            />
            {fieldErrors.ConfirmPassword && (
              <p className={errorText}>{fieldErrors.ConfirmPassword}</p>
            )}
          </div>
        </div>

        {errorPasswordCheck && Array.isArray(errorPasswordCheck) && (
          <ul className="mt-4 space-y-1 text-sm">
            {errorPasswordCheck.map((msg, idx) => (
              <li key={idx} className="text-red-600">• {msg}</li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex items-center gap-3 justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 h-10 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50"
          >
            {tt("common.cancel", "Cancel")}
          </button>

          <button
            form="add-user-form"
            type="submit"
            className="px-5 h-10 rounded-2xl text-white shadow-md hover:shadow-lg"
            style={{ backgroundColor: theme?.colors?.primary?.main }}
          >
            {tt("common.save", "Save")}
          </button>
        </div>

        {errorSubmit && <div className="mt-4 text-sm text-red-600">{errorSubmit}</div>}
      </form>
    </div>
  );
}
