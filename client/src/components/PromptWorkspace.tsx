import React from 'react';
import {
  FAMILY_LABELS,
  PromptTypeDefinition,
} from '../../../shared/promptTypes';

interface PromptWorkspaceProps {
  framework: PromptTypeDefinition;
  userText: string;
  isLoading: boolean;
  errorMessage: string | null;
  onChangeUserText: (value: string) => void;
  onSubmit: () => void;
  onUseExample: (exampleText: string) => void;
}

export const PromptWorkspace: React.FC<PromptWorkspaceProps> = ({
  framework,
  userText,
  isLoading,
  errorMessage,
  onChangeUserText,
  onSubmit,
  onUseExample,
}) => {
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoading && userText.trim().length >= 5) {
      onSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && userText.trim().length >= 5) {
        onSubmit();
      }
    }
  };

  const trimmedLength = userText.trim().length;
  const isReady = trimmedLength >= 5 && trimmedLength <= 8000 && !isLoading;

  return (
    <section
      className="workspace-card"
      aria-labelledby="workspace-heading"
    >
      <div className="workspace-framework-banner">
        <div className="workspace-banner-top">
          <div>
            <span className={`family-badge family-${framework.family}`}>
              {FAMILY_LABELS[framework.family]}
            </span>
            <h2 id="workspace-heading" className="workspace-title">
              2. Costruisci con <span className="highlight-name">{framework.name}</span>
            </h2>
            <p className="workspace-acronym">{framework.acronym}</p>
          </div>
          <button
            type="button"
            className="secondary-btn try-example-btn"
            onClick={() => onUseExample(framework.exampleBefore)}
          >
            Carica idea d&apos;esempio
          </button>
        </div>

        <p className="workspace-description">{framework.basedOn}</p>

        <div className="workspace-blocks-overview" aria-label="Struttura dei blocchi">
          {framework.blocks.map((block) => (
            <div key={block.key} className="workspace-block-chip">
              <span className="chip-key">{block.key}</span>
              <div className="chip-text">
                <strong>{block.label}</strong>
                <span>{block.description}</span>
              </div>
            </div>
          ))}
        </div>

        <details className="example-disclosure">
          <summary>
            Guarda un esempio concreto di trasformazione Prima / Dopo con {framework.name}
          </summary>
          <div className="example-comparison">
            <div className="example-box example-before">
              <h4>Idea Grezza (Prima)</h4>
              <p>{framework.exampleBefore}</p>
            </div>
            <div className="example-box example-after">
              <h4>Prompt Strutturato {framework.name} (Dopo)</h4>
              <pre tabIndex={0}>
                <code>{framework.exampleAfter}</code>
              </pre>
            </div>
          </div>
        </details>
      </div>

      <form
        className="prompt-builder-form"
        action="/api/build-prompt"
        method="POST"
        onSubmit={handleFormSubmit}
      >
        <div className="form-field-header">
          <label htmlFor="raw-prompt-textarea" className="form-label">
            Descrivi in testo libero cosa vuoi ottenere
          </label>
          <span className="char-counter" aria-live="polite">
            {trimmedLength} / 8000 caratteri
          </span>
        </div>

        <p className="form-helper-text" id="textarea-helper">
          Scrivi la tua idea anche in modo informale o incompleto: il motore AI dedurrà automaticamente ruolo, contesto, vincoli e formato compilando tutti i blocchi di{' '}
          <strong>{framework.name}</strong>.
        </p>

        <textarea
          id="raw-prompt-textarea"
          name="userText"
          className="prompt-textarea"
          rows={5}
          aria-describedby="textarea-helper"
          placeholder={`Es. "${framework.exampleBefore}"`}
          value={userText}
          onChange={(e) => onChangeUserText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          required
        />

        {errorMessage && (
          <div className="error-banner" role="alert">
            <svg
              className="error-icon"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.75" />
              <path
                d="M10 6v4.5M10 13.5h.01"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="form-actions">
          <span className="shortcut-hint">
            Scorciatoia rapida: <kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>Invio</kbd>
          </span>

          <button
            type="submit"
            className="primary-submit-btn"
            disabled={!isReady}
          >
            {isLoading ? (
              <span className="loading-state" role="status" aria-live="polite">
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
                    r="9"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="spinner-head"
                    d="M21 12a9 9 0 0 0-9-9"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Ingegnerizzazione {framework.name} in corso...</span>
              </span>
            ) : (
              <>
                <svg
                  className="sparkle-icon"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M10 2.5 11.9 7.6 17 9.5 11.9 11.4 10 16.5 8.1 11.4 3 9.5 8.1 7.6 10 2.5Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Genera Prompt Strutturato ({framework.name})</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
