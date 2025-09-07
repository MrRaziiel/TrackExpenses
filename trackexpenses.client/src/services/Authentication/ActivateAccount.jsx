// src/Pages/Authentication/ActivationAccount.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MailCheck, AlertCircle } from "lucide-react";

import { useTheme } from "../../styles/Theme/Theme";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import Card from "../../components/UI/Card";
import Button from "../../components/Buttons/Button";

export default function ActivationAccount() {
  const { theme } = useTheme();
  const location = useLocation();

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const hasPostedRef = useRef(false); // prevents double request in StrictMode

  useEffect(() => {
    if (hasPostedRef.current) return;
    hasPostedRef.current = true;

    const params = new URLSearchParams(location.search);
    const email = params.get("email");
    const token = params.get("token");

    if (!email || !token) {
      setStatus("error");
      setMessage("Missing or invalid activation parameters.");
      return;
    }

    const payload = {
      UserEmail: email, // URLSearchParams already decodes
      Token: token,
    };

    (async () => {
      try {
        console.log('payload', payload);
        const res = await apiCall.post("/User/ActivationAccount", payload, {
          validateStatus: () => true,
        });
        console.log('res', res);

        if (res?.status >= 200 && res?.status < 300) {
          setStatus("success");
          setMessage("Your account has been successfully activated.");
        } else {
          const serverMsg =
            res?.data?.message ||
            res?.error?.message ||
            "We couldn’t activate your account.";
          setStatus("error");
          setMessage(serverMsg);
        }
      } catch {
        setStatus("error");
        setMessage("An unexpected error occurred while activating your account.");
      }
    })();
  }, [location.search]);

  return (
    <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <Card
        className="max-w-md w-full p-8 rounded-2xl shadow-2xl text-center"
        style={{
          backgroundColor: theme.colors.background.paper,
          boxShadow: `0 25px 50px -12px ${theme.colors.primary.dark}3D`,
        }}
      >
        {status === "loading" && (
          <p style={{ color: theme.colors.text.secondary }}>
            Activating your account…
          </p>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center mb-6">
              <div
                className="w-14 h-14 flex items-center justify-center rounded-full"
                style={{ backgroundColor: theme.colors.success.light }}
              >
                <MailCheck
                  className="h-7 w-7"
                  style={{ color: theme.colors.success.main }}
                />
              </div>
            </div>

            <h2
              className="text-xl font-bold mb-2"
              style={{ color: theme.colors.text.primary }}
            >
              Account activated!
            </h2>
            <p className="mb-6" style={{ color: theme.colors.text.secondary }}>
              {message}
            </p>

            <Link to="/login" className="block">
              <Button
                size="md"
                fullWidth
                className="!h-12 !py-0 text-base font-semibold"
              >
                Go to login
              </Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex justify-center mb-6">
              <div
                className="w-14 h-14 flex items-center justify-center rounded-full"
                style={{ backgroundColor: theme.colors.error.light }}
              >
                <AlertCircle
                  className="h-7 w-7"
                  style={{ color: theme.colors.error.main }}
                />
              </div>
            </div>

            <h2
              className="text-xl font-bold mb-2"
              style={{ color: theme.colors.error.main }}
            >
              Activation failed
            </h2>
            <p className="mb-6" style={{ color: theme.colors.text.secondary }}>
              {message}
            </p>

            <Link to="/login" className="block">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                className="!h-12 !py-0 text-base font-semibold"
              >
                Back to login
              </Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
