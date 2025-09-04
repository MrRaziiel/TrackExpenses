// src/Pages/Premium/PremiumChoicePage.jsx
import React, { useContext, useMemo, useState } from "react";
import Title from "../../components/Titles/TitlePage";
import Card from "../../components/UI/Card";
import Button from "../../components/Buttons/Button";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import AuthContext from "../../services/Authentication/AuthContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";

const AUTH_KEY = "auth";

function isUserPremium(auth, roles) {
  if (!auth) return false;
  if (roles) return roles.includes("PREMIUM");
  const tier = auth?.subscription?.tier || auth?.user?.subscription?.tier;
  return String(tier || "").toLowerCase() === "premium";
}

function PlanRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="opacity-80">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function PremiumChoicePage() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { auth, setAuth, roles, setRoles } = useContext(AuthContext);

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const premium = useMemo(() => isUserPremium(auth, roles), [auth, roles]);

  const readAuth = () => {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "{}"); } catch { return {}; }
  };
  const writeAuth = (next) => localStorage.setItem(AUTH_KEY, JSON.stringify(next));
  const mergeUser = (patch) => {
    const cur = readAuth();
    const next = { ...cur, user: { ...(cur.user || {}), ...patch } };
    writeAuth(next);
    setAuth(next.user || next);
  };

  async function handleUpgrade() {
    setErrorMsg("");
    setBusy(true);
    const res = await apiCall.post("/Premium/Subscribe", { UserEmail: auth.Email });
    setBusy(false);

    if (!res.ok) {
      setErrorMsg(res?.error?.message || (t("premium.errors.enableFail") || "Failed to enable premium."));
      return;
    }

    const data = res.data || {};
    const nextTier = data?.subscription?.tier || "premium";
    if (data?.Roles) setRoles(data.Roles);

    mergeUser({
      subscription: { ...(auth?.subscription || {}), tier: nextTier, ...data?.subscription },
    });
  }

  async function handleCancel() {
    setErrorMsg("");
    setBusy(true);
    const res = await apiCall.post("/Premium/Cancel", { UserEmail: auth.Email });
    setBusy(false);

    if (!res.ok) {
      setErrorMsg(res?.error?.message || (t("premium.errors.cancelFail") || "Failed to cancel premium."));
      return;
    }

    const data = res.data || {};
    const nextTier = data?.subscription?.tier || "free";
    if (data?.Roles) setRoles(data.Roles);

    mergeUser({
      subscription: { ...(auth?.subscription || {}), tier: nextTier, ...data?.subscription },
    });
  }

function Feature({ text, enabled = true, divider = true, }) {
  return (
    <div className={`flex items-center justify-between py-2 ${divider ? "border-b" : ""}`}
         style={{ borderColor: theme.colors.menu.border }}>
      <span className="text-sm opacity-90">{text}</span>
      <span className={`text-sm ${enabled ? "opacity-100" : "opacity-50"}`}>
        {enabled ? "✔" : "—"}
      </span>
    </div>
  );
}

function Price({ amount, suffix }) {
  return (
    <div className="flex items-end gap-2 mt-2">
      <span className="text-4xl font-extrabold leading-none"
            style={{ color: theme.colors.text.primary }}>
        {amount}
      </span>
      <span className="text-sm px-2 py-0.5 rounded-full"
            style={{
              color: theme.colors.text.primary,
              backgroundColor: theme.colors.menu.activeBg,
              border: `1px solid ${theme.colors.menu.border}`,
            }}>
        {suffix}
      </span>
    </div>
  );
}

function PlanCardFree() {
  const isCurrent = !premium;
  return (
    <Card
      className="w-full p-7 rounded-3xl ring-1"
      style={{
        backgroundColor: theme.colors.background.paper,
        ringColor: theme.colors.menu.border,
        boxShadow: `0 20px 60px -20px ${theme.colors.secondary.dark}33`,
      }}
    >
      <h3 className="text-xl font-bold" style={{ color: theme.colors.text.primary }}>
        {t("premium.free") || "Free"}
      </h3>

      <div className="text-3xl font-bold" style={{ color: theme.colors.primary }}>
  €0 <span className="text-sm font-medium opacity-60">/mês</span>
</div>
      
      <div className="mt-5">
        <Feature text={t("premium.features.expenseTracking") || "Expense tracking"} />
        <Feature text={t("premium.features.monthlySummary") || "Monthly summary"} />
        <Feature text={t("premium.features.export") || "Export"} enabled={false} />
        <Feature text={t("premium.features.groupSharing") || "Group sharing"} enabled={false} />
        <Feature text={t("premium.features.prioritySupport") || "Priority support"} enabled={false} divider={false} />
      </div>

    </Card>
  );
}

function PlanCardPremium() {
  return (
    <div className="relative">
      {/* soft glow */}
      <div
        className="absolute -inset-2 rounded-[28px] blur-2xl opacity-40"
        style={{ background: `radial-gradient(40% 40% at 50% 0%, ${theme.colors.primary.main}33 0%, transparent 100%)` }}
        aria-hidden
      />
      <Card
        className="relative w-full p-7 rounded-3xl ring-1"
        style={{
          background: `linear-gradient(180deg, ${theme.colors.menu.bg}, ${theme.colors.background.paper})`,
          ringColor: theme.colors.menu.border,
          boxShadow: `0 24px 80px -28px ${theme.colors.primary.dark}55`,
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold" style={{ color: theme.colors.premium.gold }}>
            {t("premium.premium") || "Premium"}
          </h3>

          {/* ribbon */}
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{
              color: theme.colors.premium.gold, // adapta light/dark
              backgroundColor: theme.colors.menu.activeBg,
              border: `1px solid ${theme.colors.menu.border}`,
            }}
          >
            {premium ? (t("premium.active") || "Active") : (t("premium.mostPopular") || "Most popular")}
          </span>
        </div>

        <div className="text-3xl font-bold" style={{ color: theme.colors.premium.gold }}>
  €4.99 <span className="text-sm font-medium opacity-60">/mês</span>
</div>

        <div className="mt-5">
          <Feature text={t("premium.features.expenseTracking") || "Expense tracking"} />
          <Feature text={t("premium.features.monthlySummary") || "Monthly summary"} />
          <Feature text={t("premium.features.export") || "Export"} />
          <Feature text={t("premium.features.groupSharing") || "Group sharing"} />
          <Feature text={t("premium.features.prioritySupport") || "Priority support"} divider={false} />
        </div>

   <div className="mt-6 grid grid-cols-1 gap-3">
  {!premium ? (
    <Button
      fullWidth
      disabled={busy}
      onClick={handleUpgrade}
      className="h-11 rounded-xl text-white hover:opacity-90"
      style={{
        backgroundColor: theme.colors.premium.gold,
        boxShadow: `0 4px 14px ${theme.colors.premium.gold}66`,
        color: theme.colors.premium.gold,
      }}
    >
      {busy
        ? (t("premium.enabling") || "Enabling...")
        : (t("premium.upgrade") || "Upgrade to Premium")}
    </Button>
  ) : (
    <>
      <Button
        fullWidth
        variant="danger"
        disabled={busy}
        onClick={handleCancel}
        className="h-11 rounded-xl"
      >
        {busy
          ? (t("premium.canceling") || "Canceling...")
          : (t("premium.cancel") || "Cancel Premium")}
      </Button>
    </>
  )}
</div>


        {errorMsg && (
          <p className="text-sm mt-3" style={{ color: theme.colors.error.main }}>
            {errorMsg}
          </p>
        )}
      </Card>
    </div>
  );
}

  return (
    <div className="max-w-[72rem] mx-auto">
      {/* Header igual ao Users */}
      <div className="flex items-center justify-between mb-6">
        <Title text={t("common.premium") || "Premium"} />
      </div>

      {/* Grid de planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlanCardFree />
        <PlanCardPremium />
      </div>

      {/* Nota curta */}
      <div
        className="text-center text-xs mt-6 opacity-70"
        style={{ color: theme.colors.text.secondary }}
      >
        {t("premium.footer") || "You can cancel anytime from your account settings."}
      </div>
    </div>
  );
}
