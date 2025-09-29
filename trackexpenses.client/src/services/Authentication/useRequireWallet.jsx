import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiCall from "../ApiCallGeneric/apiCall";

export function useRequireWallet({
  includeArchived = false,
  redirectIfNone = true,
  redirectTo = "/CreateWallet",
  delayMs = 2200,
} = {}) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState([]);
  const [noWallets, setNoWallets] = useState(false);

  const [fetchedOnce, setFetchedOnce] = useState(false);

  const [countdownMs, setCountdownMs] = useState(delayMs);
  const timerRef = useRef(null);
  const tickerRef = useRef(null);

  const primaryId = useMemo(() => {
    if (!Array.isArray(wallets) || wallets.length === 0) return undefined;
    const sorted = [...wallets].sort(
      (a, b) => (b.isPrimary === true) - (a.isPrimary === true)
    );
    return sorted[0]?.id;
  }, [wallets]);

  const cleanupTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tickerRef.current) clearInterval(tickerRef.current);
    timerRef.current = null;
    tickerRef.current = null;
  };

  const normalizeAsArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload?.$values && Array.isArray(payload.$values)) return payload.$values;
    if (Array.isArray(payload?.data)) return payload.data;
    if (payload?.data?.$values && Array.isArray(payload.data.$values)) return payload.data.$values;
    return [];
  };

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    cleanupTimers();

    try {
      const res = await apiCall.get("/wallets", {
        params: { includeArchived },
      });

      const arr = normalizeAsArray(res?.data);
      setWallets(arr);
      setFetchedOnce(true);

      const none = arr.length === 0;
      setNoWallets(none);

      if (none && redirectIfNone) {
        setCountdownMs(delayMs);
        tickerRef.current = setInterval(
          () => setCountdownMs((v) => Math.max(0, v - 100)),
          100
        );
        timerRef.current = setTimeout(
          () => navigate(redirectTo, { replace: true }),
          delayMs
        );
      }
    } catch (err) {
      setWallets([]);
      setNoWallets(false);
      setFetchedOnce(false);
      cleanupTimers();
    } finally {
      setLoading(false);
    }
  }, [includeArchived, redirectIfNone, delayMs, redirectTo, navigate]);

  useEffect(() => {
    fetchWallets();
    return cleanupTimers;
  }, [fetchWallets]);

  return {
    loading,
    wallets,
    primaryId,
    noWallets: fetchedOnce && noWallets,
    countdown: Math.ceil(countdownMs / 1000),
    refetch: fetchWallets,
    fetchedOnce,
  };
}
