import { useMemo, useState } from "react";
import { createTranslator } from "../lib/i18n";
import {
  AccountRequestError,
  loginAccount,
  registerAccount,
} from "../lib/accountAuth";

export function AuthModal({ language, onClose, onAccountSuccess }) {
  const t = useMemo(() => createTranslator(language), [language]);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAccountSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user =
        mode === "register"
          ? await registerAccount(email.trim(), password)
          : await loginAccount(email.trim(), password);
      onAccountSuccess(user);
    } catch (err) {
      if (err instanceof AccountRequestError) {
        setError(err.message || t("accountAuthFailed"));
      } else {
        setError(err instanceof Error ? err.message : t("accountAuthFailed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-root auth-modal-root" onClick={onClose} role="presentation">
      <section
        className="modal-card auth-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-labelledby="auth-modal-title"
        aria-modal="true"
      >
        <div className="modal-header auth-modal-header">
          <h2 className="auth-modal-title" id="auth-modal-title">
            {mode === "register" ? t("accountRegisterButton") : t("authLoginTitle")}
          </h2>
        </div>

        <p className="modal-copy auth-modal-copy">
          {mode === "register" ? t("accountRegisterHint") : t("accountLoginHint")}
        </p>
        <form className="auth-form" onSubmit={handleAccountSubmit}>
          <label className="auth-field">
            <span>{t("accountEmailLabel")}</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("accountEmailPlaceholder")}
              autoComplete="email"
              spellCheck={false}
              type="email"
              required
            />
          </label>
          <label className="auth-field">
            <span>{t("accountPasswordLabel")}</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("accountPasswordPlaceholder")}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              minLength={8}
              required
              type="password"
            />
          </label>
          {error ? <p className="room-error">{error}</p> : null}
          <div className="modal-actions auth-modal-actions">
            <button className="control-button primary auth-modal-submit" disabled={isSubmitting} type="submit">
              {mode === "register" ? t("accountRegisterButton") : t("authLoginButton")}
            </button>
          </div>
        </form>
        <p className="auth-switch-copy auth-modal-switch">
          {mode === "register" ? t("accountHaveAccount") : t("accountNeedAccount")}{" "}
          <button
            className="text-button"
            onClick={() => {
              setMode((current) => (current === "register" ? "login" : "register"));
              setError("");
            }}
            type="button"
          >
            {mode === "register" ? t("accountLoginButton") : t("accountRegisterButton")}
          </button>
        </p>
      </section>
    </div>
  );
}
