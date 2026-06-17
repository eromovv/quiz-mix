import { useMemo, useState } from "react";
import { createTranslator } from "../lib/i18n";
import { loginWithCredentials, parseRoomAuthLink, RoomRequestError } from "../lib/userAuth";

export function LoginModal({ language, onClose, onSuccess }) {
  const t = useMemo(() => createTranslator(language), [language]);
  const [roomId, setRoomId] = useState("");
  const [tokenOrLink, setTokenOrLink] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const parsedLink = parseRoomAuthLink(tokenOrLink);
      const nextRoomId = parsedLink?.roomId || roomId.trim();
      const nextToken = parsedLink?.token || tokenOrLink.trim();
      const result = await loginWithCredentials(nextRoomId, nextToken);
      onSuccess(result);
    } catch (err) {
      if (err instanceof RoomRequestError && err.code === "TOKEN_EXPIRED") {
        setError(t("roomAccessExpired"));
      } else {
        setError(err instanceof Error ? err.message : t("authLoginFailed"));
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
        aria-labelledby="login-modal-title"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2 id="login-modal-title">{t("authLoginTitle")}</h2>
          <button className="icon-toggle" type="button" onClick={onClose} aria-label={t("close")}>
            ×
          </button>
        </div>
        <p className="modal-copy">{t("authLoginHint")}</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>{t("authRoomIdLabel")}</span>
            <input
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              placeholder={t("authRoomIdPlaceholder")}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className="auth-field">
            <span>{t("authTokenOrLinkLabel")}</span>
            <input
              value={tokenOrLink}
              onChange={(event) => setTokenOrLink(event.target.value)}
              placeholder={t("authTokenOrLinkPlaceholder")}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          {error ? <p className="room-error">{error}</p> : null}
          <div className="modal-actions">
            <button className="control-button secondary" type="button" onClick={onClose}>
              {t("cancel")}
            </button>
            <button className="control-button primary" disabled={isSubmitting} type="submit">
              {t("authLoginButton")}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
