// src/Pages/Premium/Prices.jsx
import React, { useContext, useMemo, useState } from "react";
import Card from "../../components/UI/Card";
import Button from "../../components/Buttons/Button";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import AuthContext from "../../services/Authentication/AuthContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";

const AUTH_KEY = "auth";

function isUserPremium(auth, role) {
  if (!auth) return false;
  if (role && String(role).toUpperCase() === "PREMIUM") return true;
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
  const { auth, setAuth, role, setRole } = useContext(AuthContext);

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const premium = useMemo(() => isUserPremium(auth, role), [auth, role]);

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
    const res = await apiCall.post("/Premium/Subscribe", { plan: "premium_monthly" });
    setBusy(false);

    if (!res.ok) {
      setErrorMsg(res?.error?.message || "Falha ao ativar premium.");
      return;
    }

    const data = res.data || {};
    const nextTier = data?.subscription?.tier || "premium";

    if (data?.Role) setRole(data.Role);

    mergeUser({
      subscription: { ...(auth?.subscription || {}), tier: nextTier, ...data?.subscription },
    });
  }

  async function handleCancel() {
    setErrorMsg("");
    setBusy(true);
    const res = await apiCall.post("/Premium/Cancel", {});
    setBusy(false);

    if (!res.ok) {
      setErrorMsg(res?.error?.message || "Falha ao cancelar premium.");
      return;
    }

    const data = res.data || {};
    const nextTier = data?.subscription?.tier || "free";

    if (data?.Role) setRole(data.Role);

    mergeUser({
      subscription: { ...(auth?.subscription || {}), tier: nextTier, ...data?.subscription },
    });
  }

  function PlanCardFree() {
    return (
      <Card
        className="w-full max-w-md p-6 rounded-2xl"
        style={{
          backgroundColor: theme.colors.background.paper,
          boxShadow: `0 8px 24px ${theme.colors.secondary.dark}10`,
        }}
      >
        <h3
          className="text-xl font-semibold"
          style={{ color: theme.colors.text.primary }}
        >
          Free
        </h3>
        <div className="mt-1 mb-4 text-sm" style={{ color: theme.colors.text.secondary }}>
          {t("premium.freeSubtitle") || "Basic features to get you started"}
        </div>

        <div className="text-3xl font-bold" style={{ color: theme.colors.text.primary }}>
          €0
          <span className="text-sm font-medium opacity-60">/mês</span>
        </div>

        <div className="mt-4 divide-y" style={{ borderColor: theme.colors.secondary.light }}>
          <PlanRow label="Registo de despesas" value="✔" />
          <PlanRow label="Resumo mensal" value="✔" />
          <PlanRow label="Exportação" value="—" />
          <PlanRow label="Partilha em grupo" value="—" />
          <PlanRow label="Suporte prioritário" value="—" />
        </div>
      </Card>
    );
  }

  function PlanCardPremium() {
    return (
      <Card
        className="w-full max-w-md p-6 rounded-2xl border"
        style={{
          background: `linear-gradient(180deg, ${theme.colors.menu.bg}, ${theme.colors.background.paper})`,
          borderColor: theme.colors.menu.border,
          boxShadow: `0 10px 28px ${theme.colors.primary.dark}22`,
        }}
      >
        <div className="flex items-center justify-between">
          <h3
            className="text-xl font-semibold"
            style={{ color: theme.colors.text.primary }}
          >
            Premium
          </h3>
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{
              color: theme.colors.primary.dark,
              backgroundColor: theme.colors.menu.activeBg,
              border: `1px solid ${theme.colors.menu.border}`,
            }}
          >
            {premium ? (t("premium.active") || "Ativo") : t("premium.mostPopular") || "Mais popular"}
          </span>
        </div>

        <div className="mt-1 mb-4 text-sm" style={{ color: theme.colors.text.secondary }}>
          {t("premium.premiumSubtitle") || "Advanced tools to scale your finances"}
        </div>

        <div className="text-3xl font-bold" style={{ color: theme.colors.text.primary }}>
          €4.99 <span className="text-sm font-medium opacity-60">/mês</span>
        </div>

        <div className="mt-4 divide-y" style={{ borderColor: theme.colors.menu.border }}>
          <PlanRow label="Registo de despesas" value="✔" />
          <PlanRow label="Resumo mensal" value="✔" />
          <PlanRow label="Exportação" value="✔" />
          <PlanRow label="Partilha em grupo" value="✔" />
          <PlanRow label="Suporte prioritário" value="✔" />
        </div>

        {/* CTA */}
        <div className="mt-6 grid grid-cols-1 gap-3">
          {!premium ? (
            <Button fullWidth disabled={busy} onClick={handleUpgrade}>
              {busy ? (t("premium.enabling") || "A ativar...") : (t("premium.upgrade") || "Upgrade to Premium")}
            </Button>
          ) : (
            <>
              <Button
                fullWidth
                variant="secondary"
                disabled={busy}
                onClick={() => window.open("/billing", "_blank")}
              >
                {t("premium.manage") || "Manage Subscription"}
              </Button>
              <Button
                fullWidth
                variant="danger"
                disabled={busy}
                onClick={handleCancel}
              >
                {busy ? (t("premium.canceling") || "A cancelar...") : (t("premium.cancel") || "Cancel Premium")}
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
    );
  }

  return (
    <div className="flex items-start justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl">
        {/* heading */}
        <div className="text-center my-8">
          <h1
            className="text-3xl font-bold"
            style={{ color: theme.colors.text.primary }}
          >
            {t("premium.title") || "Choose your plan"}
          </h1>
          <p
            className="text-sm mt-2"
            style={{ color: theme.colors.text.secondary }}
          >
            {t("premium.subtitle") || "Simple pricing. Powerful features."}
          </p>
        </div>

        {/* grid de planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PlanCardFree />
          <PlanCardPremium />
        </div>

        {/* Nota de confiança */}
        <div className="text-center text-xs mt-6 opacity-70" style={{ color: theme.colors.text.secondary }}>
          {t("premium.footer") || "You can cancel anytime from your account settings."}
        </div>
      </div>
    </div>
  );
}
