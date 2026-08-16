import { useState, type FormEvent } from "react";
import { dashboardLogin } from "../../lib/api";
import { useLanguage } from "../../lib/LanguageContext";

export default function DashboardLogin({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await dashboardLogin(password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 320, margin: "80px auto" }}>
      <h1>{t("dashboardLoginTitle")}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder={t("password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
          style={{ width: "100%" }}
        />
        {error && <div className="error-banner">{error}</div>}
        <button type="submit" disabled={submitting} style={{ marginTop: 12, width: "100%" }}>
          {submitting ? t("loggingIn") : t("logIn")}
        </button>
      </form>
    </div>
  );
}
