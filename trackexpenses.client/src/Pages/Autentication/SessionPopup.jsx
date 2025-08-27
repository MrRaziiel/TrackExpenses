// src/Pages/Autentication/SessionPopup.jsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthTimer_forceRefreshNow } from "../../services/MicroServices/AuthTime";
import useLogout from "../../services/Authentication/Logout";

/* ===== helpers ===== */
function readExpAt() {
  try { return JSON.parse(localStorage.getItem("auth") || "{}")?.meta?.accessExpAt ?? null; }
  catch { return null; }
}
function leftSeconds(expAt) {
  if (!expAt) return 0;
  return Math.max(0, Math.floor((expAt - Date.now()) / 1000));
}
function fmtMMSS(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SessionPopup() {
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState(null);
  const [secLeft, setSecLeft] = useState(0);
  const timerRef = useRef(null);
  const locked = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();

  /** inicia/renova o intervalo do contador */
  const startTick = () => {
    stopTick();
    const expAt = readExpAt();
    setSecLeft(leftSeconds(expAt));
    timerRef.current = setInterval(() => {
      setSecLeft((prev) => {
        const expAtNow = readExpAt();
        return leftSeconds(expAtNow);
      });
    }, 1000);
  };
  const stopTick = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    const onDue = () => {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}");
      const has = !!auth?.user?.accessToken && !!auth?.user?.refreshToken;
      if (!has) return;
      if (!locked.current) {
        locked.current = true;
        setErr(null);
        setOpen(true);
        startTick();
      }
    };

    const onExpired = () => {
      // se expirar mesmo, garantir limpeza global (hook trata do resto)
      setOpen(false);
      stopTick();
      locked.current = false;
      logout();
    };

    window.addEventListener("token-due", onDue);
    window.addEventListener("token-expired", onExpired);
    return () => {
      window.removeEventListener("token-due", onDue);
      window.removeEventListener("token-expired", onExpired);
      stopTick();
    };
  }, [logout]);

  const renew = async () => {
    setErr(null);
    try {
      await AuthTimer_forceRefreshNow();             // grava tokens e reinicia contagem no AuthTime
      window.dispatchEvent(new Event("token-refreshed"));
      locked.current = false;
      setOpen(false);
      stopTick();

      // se o user estava no /login quando renovou, envia-o ao destino
      if (location.pathname.toLowerCase().includes("login")) {
        const to = location.state?.from?.pathname || "/Dashboard";
        navigate(to, { replace: true });
      }
    } catch (e) {
      console.error("[SessionPopup] refresh failed:", e);
      setErr("Falha ao renovar a sessão. Tenta novamente ou termina.");
      // mantém o popup aberto para nova tentativa; contador continua
    }
  };

  const terminate = async () => {
    // FECHA o popup já, depois faz logout
    setOpen(false);
    stopTick();
    locked.current = false;
    try { await logout(); } catch {}
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 w-[360px] shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">Sessão expirada</h2>
          <div className="ml-3 text-sm px-2 py-1 rounded bg-gray-100 text-gray-700">
            expira em <span className="font-mono font-semibold">{fmtMMSS(secLeft)}</span>
          </div>
        </div>

        <p className="mt-2 text-sm text-gray-600">
          Pretende renovar a sessão ou terminar?
        </p>

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={terminate}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Terminar
          </button>
          <button
            onClick={renew}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Renovar
          </button>
        </div>
      </div>
    </div>
  );
}
