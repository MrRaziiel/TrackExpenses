import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useRequireWallet } from "./useRequireWallet";
import { useLanguage } from "../../utilis/Translate/LanguageContext";

export default function WalletGate({
  redirectTo = "/CreateWallet",
  delayMs = 2200,
  skipPaths = ["/CreateWallet"],
  includeArchived = false,
}) {
  const { pathname } = useLocation();
  const { t } = useLanguage();

  if (skipPaths.some((p) => pathname.startsWith(p))) {
    return <Outlet />;
  }

  const { loading, noWallets, countdown, fetchedOnce } = useRequireWallet({
    includeArchived,
    redirectIfNone: true,
    redirectTo,
    delayMs,
  });

  if (loading || !fetchedOnce) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-32 rounded-xl bg-gray-200" />
      </div>
    );
  }

  // Só aqui mostramos o modal — já temos confirmação “sem carteiras”
  if (noWallets) {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-40" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-full p-2 bg-yellow-100 text-yellow-800">👛</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{t("walletGate.title")}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {t("walletGate.message")}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {t("walletGate.redirectIn", { seconds: countdown })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return <Outlet />;
}
