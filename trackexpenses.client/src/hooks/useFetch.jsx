import { useEffect, useState } from "react";
import apiCall from "./api"; // instância do axios

export function useFetch(url, options = {}) {
  const {
    method = "GET",
    params = {},
    body = {},
    enabled = true,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url || !enabled) return;

    let cancelled = false;
    setLoading(true);
    const fetchData = async () => {
      try {
        let res;

        if (method.toUpperCase() === "POST") {
          res = await apiCall.post(url, body);
        } else {
          res = await apiCall.get(url, { params });
        }

        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [url, method, JSON.stringify(params), JSON.stringify(body), enabled]);

  return { data, loading, error };
}