// src/components/SessionPopup.jsx
import React, { useEffect, useState } from "react";
import { renewSession } from "../../services/ApiCalls/apiCall";
import { subscribeTokenPopup, clearTokenPopupPending } from "../../services/MicroServices/tokenPopupBus";
import useLogout from "../../services/Authentication/Logout";

export default function SessionPopup() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const logout = useLogout();

  useEffect(() => {
    return subscribeTokenPopup(() => { setErr(""); setOpen(true); });
  }, []);

  const handleRenew = async () => {
    setLoading(true);
    setErr("");
    try {
      await renewSession();
      setOpen(false);
      clearTokenPopupPending();
    } catch (e) {
      setErr(e?.message || "Não foi possível renovar. Tente novamente.");
      try {
        const hasRt = !!(JSON.parse(localStorage.getItem("auth") || "{}")?.user?.refreshToken);
        if (!hasRt) await handleLogout();
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      
      await logout();
    } finally {
      clearTokenPopupPending();
      setOpen(false);
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 w-[360px] shadow-xl">
        <h2 className="text-lg font-semibold mb-2">Sessão expirada</h2>
        <p className="text-sm text-gray-600">Pretende renovar a sessão ou terminar?</p>
        {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={handleLogout} className="px-4 py-2 rounded bg-gray-200" disabled={loading}>Terminar</button>
          <button onClick={handleRenew} className="px-4 py-2 rounded bg-green-600 text-white" disabled={loading}>
            {loading ? "A renovar..." : "Renovar"}
          </button>
        </div>
      </div>
    </div>
  );
}
