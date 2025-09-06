import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import Button from "../../components/Buttons/Button";
import Input from "../../components/Form/Input";
import Card from "../../components/UI/Card";

const ForgotPassword = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      // chamada API aqui
      await new Promise((res) => setTimeout(res, 1000)); // simulação
      setMessage(t("auth.resetSent") || "Reset link sent to your email.");
    } catch (err) {
      setMessage(t("auth.resetError") || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

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
          {t("auth.forgotTitle") || "Forgot your password?"}
        </h2>

        {/* Subtítulo */}
        <p
          className="text-sm mb-6"
          style={{ color: theme?.colors?.text?.secondary }}
        >
          {t("auth.forgotSubtitle") ||
            "No worries! Enter your email and we’ll send you a reset link."}
        </p>

        {/* Form */}
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input
            type="email"
            name="email"
            placeholder={t("placeholders.email") || "Enter your email address"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-5 w-5" />}
            required
          />

          <Button
            type="submit"
            size="md"
            variant="primary"
            fullWidth
            disabled={submitting}
            className="!h-11 !px-6 !rounded-xl leading-none"
            aria-busy={submitting}
          >
            {submitting
              ? t("auth.sending") || "A enviar..."
              : t("auth.sendEmail") || "Send reset link"}
          </Button>
        </form>

        {message && (
          <p
            className="mt-4 text-sm"
            style={{ color: theme?.colors?.success?.main }}
          >
            {message}
          </p>
        )}

        {/* Link de volta */}
        <div className="mt-6 text-sm flex flex-col items-center">
          <span style={{ color: theme?.colors?.text?.secondary }}>
            {t("auth.rememberPassword") || "Remember your password?"}
          </span>
          <Link
            to="/login"
            className="font-medium hover:underline mt-1"
            style={{ color: theme?.colors?.primary?.main }}
          >
            {t("auth.backToSignIn") || "Back to sign in"}
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;
