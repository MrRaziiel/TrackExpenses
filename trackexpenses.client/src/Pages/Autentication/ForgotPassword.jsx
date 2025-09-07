import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import Button from "../../components/Buttons/Button";
import Input from "../../components/Form/Input";
import Card from "../../components/UI/Card";
import apiCall from "../../services/ApiCallGeneric/apiCall";

function tr(t, key, fallback) {
  const v = t?.(key);
  return !v || v === key ? fallback : v;
}

const isValidEmail = (v) => /\S+@\S+\.\S+/.test(v);

// 👉 alterna aqui se o backend quiser raw string (true) ou objeto { email } (false)
const USE_RAW_STRING = true;

const ForgotPassword = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setMessage(tr(t, "auth.invalidEmail", "E-mail inválido."));
      setIsError(true);
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      const payload = USE_RAW_STRING ? JSON.stringify(email.trim()) : { email: email.trim() };

      const res = await apiCall.post("/User/Forgot-password", payload, {
        // não deixamos o axios rejeitar automaticamente, nós é que validamos:
        validateStatus: () => true,
        headers: USE_RAW_STRING
          ? { "Content-Type": "application/json" }
          : { "Content-Type": "application/json" },
        // se o teu apiCall tiver transformRequest padrão que re-serializa,
        // isto garante que passa a raw string sem mexer:
        ...(USE_RAW_STRING ? { transformRequest: [(d) => d] } : {}),
      });

      // ✅ só consideramos sucesso para 2xx
      if (res?.status < 200 || res?.status >= 300) {
        const apiMsg =
          res?.data?.message ||
          tr(t, "auth.resetError", "Não foi possível enviar o link. Verifique o e-mail e tente novamente.");
        throw new Error(apiMsg);
      }

      const successMsg =
        res?.data?.message ||
        tr(t, "auth.resetSent", "Enviámos o link de reposição para o seu e-mail.");
      setMessage(successMsg);
      setIsError(false);
    } catch (err) {
      const msg =
        err?.message ||
        tr(t, "auth.resetError", "Não foi possível enviar o link. Verifique o e-mail e tente novamente.");
      setMessage(msg);
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = isValidEmail(email);

  return (
    <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <Card
        className="w-full max-w-md"
        style={{
          backgroundColor: theme.colors.background.paper,
          boxShadow: `0 25px 50px -12px ${theme.colors.primary.dark}3D`,
        }}
      >
        {/* Ícone */}
        <div className="flex justify-center mb-6">
          <div
            className="w-14 h-14 flex items-center justify-center rounded-full"
            style={{ backgroundColor: theme?.colors?.primary?.light }}
          >
            <Mail className="h-7 w-7 text-white" />
          </div>
        </div>

        {/* Título */}
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: theme?.colors?.text?.primary }}
        >
          {tr(t, "auth.forgotTitle", "Esqueceu-se da palavra-passe?")}
        </h2>

        {/* Subtítulo */}
        <p
          className="text-sm mb-6"
          style={{ color: theme?.colors?.text?.secondary }}
        >
          {tr(
            t,
            "auth.forgotSubtitle",
            "Sem stress! Introduza o seu e-mail e enviaremos um link de reposição."
          )}
        </p>

        {/* Form */}
        <form className="space-y-3" onSubmit={handleSubmit} noValidate>
          <Input
            type="email"
            name="email"
            placeholder={tr(t, "placeholders.email", "Introduza o seu e-mail")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
            required
          />

          <Button
            type="submit"
            size="md"
            variant="primary"
            fullWidth
            disabled={submitting || !canSubmit}
            className="!h-11 !px-6 !rounded-xl leading-none"
            aria-busy={submitting}
          >
            {submitting
              ? tr(t, "auth.sending", "A enviar…")
              : tr(t, "auth.sendEmail", "Enviar link de reposição")}
          </Button>
        </form>

        {message && (
          <p
            className="mt-4 text-sm"
            role="status"
            aria-live="polite"
            style={{
              color: isError
                ? theme?.colors?.error?.main
                : theme?.colors?.success?.main,
            }}
          >
            {message}
          </p>
        )}

        {/* Link de volta */}
        <div className="mt-6 text-sm flex flex-col items-center">
          <span style={{ color: theme?.colors?.text?.secondary }}>
            {tr(t, "auth.rememberPassword", "Lembrou-se da palavra-passe?")}
          </span>
          <Link
            to="/login"
            className="font-medium hover:underline mt-1"
            style={{ color: theme?.colors?.primary?.main }}
          >
            {tr(t, "auth.backToSignIn", "Voltar a iniciar sessão")}
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;
