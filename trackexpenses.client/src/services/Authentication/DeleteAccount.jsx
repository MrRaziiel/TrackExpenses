// src/Pages/Authentication/DeleteAccount.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Trash2, AlertCircle } from "lucide-react";
import { useTheme } from "../../styles/Theme/Theme";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import Card from "../../components/UI/Card";
import Button from "../../components/Buttons/Button";

export default function DeleteAccount() {
  const { theme } = useTheme();
  const location = useLocation();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const hasPostedRef = useRef(false);

  useEffect(() => {
    if (hasPostedRef.current) return;
    hasPostedRef.current = true;

    const params = new URLSearchParams(location.search);
    const email = params.get("email");
    const token = params.get("token");

    if (!email || !token) {
      setStatus("error");
      setMessage("Missing or invalid delete parameters.");
      return;
    }

    const payload = { UserEmail: email, Token: token };

    (async () => {
      try {
        const res = await apiCall.post("/User/DeleteAccount", payload, {
          validateStatus: () => true,
        });
        if (res?.status >= 200 && res?.status < 300) {
          setStatus("success");
          setMessage("Your account has been successfully deleted.");
        } else {
          setStatus("error");
          setMessage(
            res?.data?.message ||
              res?.error?.message ||
              "We couldn’t delete your account."
          );
        }
      } catch {
        setStatus("error");
        setMessage("An unexpected error occurred while deleting your account.");
      }
    })();
  }, [location.search]);

  return (
    <div className="flex items-center justify-center">
      <Card
        className="max-w-md w-full p-8 rounded-2xl shadow-2xl text-center"
        style={{
          backgroundColor: theme.colors.background.paper,
          boxShadow: `0 25px 50px -12px ${theme.colors.primary.dark}3D`,
        }}
      >
        {status === "loading" && (
          <p style={{ color: theme.colors.text.secondary }}>
            Deleting your account…
          </p>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center mb-6">
              <div
                className="w-14 h-14 flex items-center justify-center rounded-full"
                style={{ backgroundColor: theme.colors.success.light }}
              >
                <Trash2
                  className="h-7 w-7"
                  style={{ color: theme.colors.success.main }}
                />
              </div>
            </div>

            <h2 className="text-xl font-bold mb-2" style={{ color: theme.colors.text.primary }}>
              Account deleted!
            </h2>
            <p className="mb-6" style={{ color: theme.colors.text.secondary }}>
              {message}
            </p>

            <Link to="/login" className="block">
              <Button size="md" fullWidth className="!h-12 !py-3 !text-base">
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

            <h2 className="text-xl font-bold mb-2" style={{ color: theme.colors.error.main }}>
              Delete failed
            </h2>
            <p className="mb-6" style={{ color: theme.colors.text.secondary }}>
              {message}
            </p>

            <Link to="/login" className="block">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                className="!h-12 !py-3 !text-base"
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
