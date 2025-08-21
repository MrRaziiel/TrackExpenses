// src/Pages/Premium/PremiumChoicePage.jsx
import React from "react";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import Title from "../../components/Titles/TitlePage";

/**
 * Página de compra do Premium (apenas plano mensal).
 * Props:
 *  - price?: string (ex: "€7,99")
 *  - checkoutUrl?: string (se definido, o botão redireciona para esta URL)
 *  - onSubscribe?: () => void (callback alternativo ao checkoutUrl)
 */
function PremiumChoicePage({ price = "€9,99", checkoutUrl, onSubscribe }) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const colors = {
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
  };

  const handleSubscribe = () => {
    if (typeof onSubscribe === "function") {
      onSubscribe();
      return;
    }
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }
    // fallback simples: emite um evento para a app escutar
    const evt = new CustomEvent("premium:subscribe", { detail: { price } });
    window.dispatchEvent(evt);
  };

  return (
    <div className="space-y-6">
      <Title text={t("premium.subtitle") || "Desbloqueia todas as funcionalidades sem limites."} />
      {/* CONTEÚDO PRINCIPAL */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Benefícios + FAQ */}
        <section
          className="md:col-span-2 p-6 rounded-xl shadow-md"
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
          className="p-6 rounded-xl shadow-lg h-max"
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
            className="mt-6 w-full py-3 rounded-xl font-semibold shadow-md transition-transform active:scale-95"
            style={{ backgroundColor: colors.primary, color: colors.text.contrast }}
            aria-label={t("premium.ctaButton") || "Assinar Premium"}
          >
            {t("premium.ctaButton") || "Assinar Premium"}
          </button>

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
            className="p-5 rounded-xl shadow-md"
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
