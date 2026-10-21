import React, { useState } from 'react';

interface PassphraseGateProps {
  isVerifying: boolean;
  errorMessage: string | null;
  onSubmitPassphrase: (passphrase: string) => void;
}

export const PassphraseGate: React.FC<PassphraseGateProps> = ({
  isVerifying,
  errorMessage,
  onSubmitPassphrase,
}) => {
  const [passphrase, setPassphrase] = useState<string>('');
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!passphrase.trim() || isVerifying) return;
    onSubmitPassphrase(passphrase.trim());
  };

  return (
    <section className="auth-gate-wrapper" aria-labelledby="auth-gate-title">
      <article className="auth-card">
        <div className="auth-card-header">
          <div className="auth-lock-badge" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="auth-lock-icon"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 id="auth-gate-title" className="auth-title">
            Accesso Riservato
          </h2>
          <p className="auth-subtitle">
            Inserisci la passphrase di accesso per sbloccare il catalogo metodologico e il generatore di prompt AI.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="current-password" className="form-label">
              Passphrase di accesso
            </label>
            <div className="auth-input-group">
              <input
                id="current-password"
                name="password"
                type={showPassphrase ? 'text' : 'password'}
                className="auth-input"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Inserisci la passphrase..."
                autoComplete="current-password"
                enterKeyHint="done"
                spellCheck={false}
                autoFocus
                required
                disabled={isVerifying}
              />
              <button
                type="button"
                className="auth-toggle-btn"
                onClick={() => setShowPassphrase((prev) => !prev)}
                aria-label={
                  showPassphrase ? 'Nascondi passphrase' : 'Mostra passphrase'
                }
                aria-pressed={showPassphrase}
              >
                {showPassphrase ? 'Nascondi' : 'Mostra'}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="error-banner" role="alert">
              <svg
                className="error-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="primary-submit-btn auth-submit-btn"
            disabled={isVerifying || passphrase.trim().length === 0}
          >
            {isVerifying ? (
              <span className="loading-state">
                <svg
                  className="spinner-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="spinner-track"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    d="M12 2a10 10 0 0 1 10 10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Verifica in corso...</span>
              </span>
            ) : (
              <span>Accedi a PromptBuilder</span>
            )}
          </button>
        </form>
      </article>
    </section>
  );
};
