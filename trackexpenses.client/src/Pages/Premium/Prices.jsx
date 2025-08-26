import React, { useContext, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import Title from "../../components/Titles/TitlePage";
import AuthContext from "../../services/Authentication/AuthContext";
import apiCall from "../../services/ApiCalls/apiCall";
/**
 * PremiumChoicePage
 * - Fixes invalid hook call by replacing <Navigate> misuse with useNavigate()
 * - Adds loading, error handling, optimistic UI and subtle animations
 * - Memoizes derived colors and handlers to avoid unnecessary re-renders
 * - Optional: accepts checkoutUrl and onSubscribe props
 */
function PremiumChoicePage({ price = "€9,99", checkoutUrl, onSubscribe }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { auth } = useContext(AuthContext);

  const [errorSubmit, setErrorSubmit] = useState(null);
  const [loading, setLoading] = useState(false);

  // Memoize colors so the object reference is stable
  const colors = useMemo(() => ({
    primary: theme?.colors?.primary?.main || "#4361EE",
    secondary: theme?.colors?.secondary?.main || "#3F37C9",
    success: theme?.colors?.success?.main || "#4CAF50",
    text: {
      primary: theme?.colors?.text?.primary || "#1A1A1A",
      secondary: theme?.colors?.text?.secondary || "#666666",
      contrast: theme?.colors?.text?.contrast || "#FFFFFF",
    },
    background: {
      default: theme?.colors?.background?.default || "#F7F7FB",
      paper: theme?.colors?.background?.paper || "#FFFFFF",
    },
    border: theme?.colors?.divider || "#E5E7EB",
  }), [theme]);

  const handleSubscribe = useCallback(async () => {
    setErrorSubmit(null);
    setLoading(true);
    try {
      const response = await apiCall.post("Premium/ChangeUserToPremium", { UserEmail: auth?.email });
      console.log('response', response);
      if ((!response.ok)) {
        const msg = response?.error?.message || t("errors.generic") || "Ocorreu um erro ao subscrever.";
        setErrorSubmit(msg);
        return;
      }

      if (typeof onSubscribe === "function") onSubscribe({ email: auth?.email });


      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return; 
      }


      navigate("/Dashboard");
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message || t("errors.network") || "Falha de rede. Tenta novamente.";
      setErrorSubmit(msg);
    } finally {
      setLoading(false);
    }
  }, [auth?.email, checkoutUrl, navigate, onSubscribe, t]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ backgroundColor: colors.background.default }}>
      <Title text={t("premium.subtitle") || "Desbloqueia todas as funcionalidades sem limites."} />

      {/* CONTEÚDO PRINCIPAL */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Benefícios + FAQ */}
        <section
          className="md:col-span-2 p-6 rounded-xl shadow-md transition-transform hover:translate-y-[-2px]"
          style={{ backgroundColor: colors.background.paper }}
        >
          <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
            {t("premium.whatsIncluded") || "O que está incluído"}
          </h2>

          <ul className="mt-4 grid sm:grid-cols-2 gap-3">
            {[
              t("premium.features.unlimitedCategories") || "Categorias ilimitadas e personalizáveis",
              t("premium.features.sync") || "Sincronização em tempo real entre dispositivos",
              t("premium.features.export") || "Exportação de dados (CSV/Excel)",
              t("premium.features.prioritySupport") || "Suporte prioritário",
              t("premium.features.advancedReports") || "Relatórios avançados e insights",
              t("premium.features.backups") || "Backups automáticos",
            ].map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-0.5" aria-hidden>✓</span>
                <span style={{ color: colors.text.primary }}>{feat}</span>
              </li>
            ))}
          </ul>

          {/* FAQ */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
              {t("premium.faq.title") || "Perguntas frequentes"}
            </h3>

            <div className="mt-3 divide-y" style={{ borderColor: colors.border }}>
              {[
                {
                  q: t("premium.faq.cancelQ") || "Posso cancelar quando quiser?",
                  a:
                    t("premium.faq.cancelA") ||
                    "Sim. O Premium é por mês e podes cancelar a qualquer momento sem fidelização.",
                },
                {
                  q: t("premium.faq.refundQ") || "Há reembolsos?",
                  a:
                    t("premium.faq.refundA") ||
                    "Se houver um problema com a subscrição, fala connosco e avaliamos caso a caso.",
                },
                {
                  q: t("premium.faq.paymentQ") || "Quais os métodos de pagamento?",
                  a:
                    t("premium.faq.paymentA") ||
                    "Cartão de crédito/débito e outros métodos locais disponíveis via o nosso provedor de pagamentos.",
                },
              ].map((item, i) => (
                <details key={i} className="py-3 group">
                  <summary
                    className="cursor-pointer list-none flex items-center justify-between"
                    style={{ color: colors.text.primary }}
                  >
                    <span className="font-medium">{item.q}</span>
                    <span
                      className="text-xl select-none group-open:rotate-45 transition-transform"
                      style={{ color: colors.text.secondary }}
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-2" style={{ color: colors.text.secondary }}>
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CARD DO PLANO */}
        <aside
          className="p-6 rounded-xl shadow-lg h-max transition-transform hover:translate-y-[-2px]"
          style={{ backgroundColor: colors.background.paper, border: `1px solid ${colors.border}` }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-sm px-2 py-1 rounded-full"
              style={{ backgroundColor: colors.primary, color: colors.text.contrast }}
            >
              {t("premium.mostPopular") || "Plano único"}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-bold" style={{ color: colors.text.primary }}>
            {t("premium.monthlyPlan") || "Mensal"}
          </h2>
          <p className="mt-1 text-sm" style={{ color: colors.text.secondary }}>
            {t("premium.billedMonthly") || "Faturado mensalmente"}
          </p>

          <div className="mt-5 flex items-end gap-2">
            <span className="text-4xl font-extrabold" style={{ color: colors.text.primary }}>
              {price}
            </span>
            <span className="mb-1" style={{ color: colors.text.secondary }}>
              / {t("premium.perMonth") || "mês"}
            </span>
          </div>

          <ul className="mt-6 space-y-2">
            {[
              t("premium.ctaHighlights.noAds") || "Sem anúncios",
              t("premium.ctaHighlights.fullAccess") || "Acesso total às funcionalidades",
              t("premium.ctaHighlights.cancelAnytime") || "Cancela quando quiseres",
            ].map((v, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5" aria-hidden>•</span>
                <span style={{ color: colors.text.secondary }}>{v}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className={`mt-6 w-full py-3 rounded-xl font-semibold shadow-md transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${loading ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg"}`}
            style={{ backgroundColor: colors.primary, color: colors.text.contrast, boxShadow: "0 6px 20px rgba(67,97,238,0.25)" }}
            aria-label={t("premium.ctaButton") || "Assinar Premium"}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                {t("loading") || "A processar..."}
              </span>
            ) : (
              t("premium.ctaButton") || "Assinar Premium"
            )}
          </button>

          {errorSubmit && (
            <p role="alert" className="mt-3 text-sm" style={{ color: "#DC2626" }}>
              {errorSubmit}
            </p>
          )}

          <p className="text-xs mt-3" style={{ color: colors.text.secondary }}>
            {t("premium.legal") || "Ao continuar, concordas com os Termos e a Política de Privacidade."}
          </p>

          <div
            className="mt-4 flex items-center justify-center gap-3 text-sm"
            style={{ color: colors.text.secondary }}
          >
            <span role="img" aria-label="lock">🔒</span>
            <span>{t("premium.secureCheckout") || "Checkout encriptado"}</span>
          </div>
        </aside>
      </div>

      {/* TESTEMUNHOS */}
      <section className="grid md:grid-cols-3 gap-6">
        {[
          {
            name: "Joana",
            text:
              t("premium.testimonials.joana") ||
              "Passei a controlar melhor as despesas. Vale cada cêntimo!",
          },
          {
            name: "Miguel",
            text:
              t("premium.testimonials.miguel") ||
              "Os relatórios avançados são top para perceber onde poupar.",
          },
          {
            name: "Sofia",
            text:
              t("premium.testimonials.sofia") ||
              "Suporte respondeu super rápido quando precisei.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="p-5 rounded-xl shadow-md transition-transform hover:translate-y-[-2px]"
            style={{ backgroundColor: colors.background.paper }}
          >
            <p className="italic" style={{ color: colors.text.primary }}>
              “{item.text}”
            </p>
            <p className="mt-3 text-sm font-semibold" style={{ color: colors.text.secondary }}>
              — {item.name}
            </p>
          </div>
        ))}
      </section>

      {/* RODAPÉ */}
      <footer className="text-center text-sm" style={{ color: colors.text.secondary }}>
        {t("premium.footer") || "Precisas de fatura com NIF? Podes adicionar no checkout."}
      </footer>
    </div>
  );
}

export default PremiumChoicePage;
