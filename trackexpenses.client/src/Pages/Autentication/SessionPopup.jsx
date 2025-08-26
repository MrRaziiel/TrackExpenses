// src/components/SessionPopup.jsx
import React, { useEffect, useRef, useState } from "react";
import { manualRefreshFromPopup, abortQueueAndClearAuth } from "../../services/ApiCallGeneric/apiCall";

export default function SessionPopup() {
  const [open, setOpen] = useState(false);
  const isOpenRef = useRef(false);

  useEffect(() => {
    const on = () => {
      // só abre se houver tokens e ainda não está aberto
      try {
        const a = JSON.parse(localStorage.getItem("auth") || "{}");
        const has = !!a?.user?.accessToken && !!a?.user?.refreshToken;
        if (has && !isOpenRef.current) {
          isOpenRef.current = true;
          setOpen(true);
        }
      } catch {}
    };
    window.addEventListener("tokenPopup", on);
    return () => window.removeEventListener("tokenPopup", on);
  }, []);

  const handleRenew = async () => {
    const ok = await manualRefreshFromPopup();
    if (ok) {
      isOpenRef.current = false;
      setOpen(false);
    } else {
      handleLogout();
    }
  };

  const handleLogout = () => {
    abortQueueAndClearAuth();
    isOpenRef.current = false;
    setOpen(false);
    window.location.href = "/login";
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 w-[360px] shadow-xl">
        <h2 className="text-lg font-semibold mb-2">Sessão expirada</h2>
        <p className="text-sm text-gray-600">
          O seu acesso expirou. Pretende renovar a sessão ou terminar?
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={handleLogout} className="px-4 py-2 rounded bg-gray-200">
            Terminar
          </button>
          <button onClick={handleRenew} className="px-4 py-2 rounded bg-green-600 text-white">
            Renovar
          </button>
        </div>
      </div>
    </div>
  );
}
