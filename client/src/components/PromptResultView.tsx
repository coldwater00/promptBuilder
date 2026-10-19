import React, { useState } from 'react';
import { BuildPromptResponse } from '../../../shared/promptTypes';

interface PromptResultViewProps {
  result: BuildPromptResponse;
}

export const PromptResultView: React.FC<PromptResultViewProps> = ({
  result,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(result.finalPrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback copy via temporary textarea
      const temp = document.createElement('textarea');
      temp.value = result.finalPrompt;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <section
      className="result-section"
      aria-labelledby="result-heading"
      aria-live="polite"
    >
      <div className="result-header">
        <div>
          <span className="result-eyebrow">
            Generato con {result.providerUsed.toUpperCase()} ({result.modelUsed})
          </span>
          <h2 id="result-heading" className="result-main-title">
            3. Risultato Strutturato ({result.frameworkName})
          </h2>
        </div>

        <button
          type="button"
          className={`copy-prompt-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopyPrompt}
        >
          {copied ? (
            <>
              <svg
                className="btn-icon"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m4.5 10.5 3.5 3.5 7.5-7.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Copiato negli appunti!</span>
            </>
          ) : (
            <>
              <svg
                className="btn-icon"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="7"
                  y="7"
                  width="9"
                  height="9"
                  rx="1.8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M4 13V5a1.8 1.8 0 0 1 1.8-1.8H13"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <span>Copia Prompt Finale</span>
            </>
          )}
        </button>
      </div>

      {/* Vista A: Prompt Finale Pronto all'Uso */}
      <article className="result-panel final-prompt-panel" aria-labelledby="final-prompt-title">
        <div className="panel-title-bar">
          <h3 id="final-prompt-title">A. Prompt Finale Pronto all&apos;Uso</h3>
          <span className="panel-hint">
            Scorri o premi Tab per navigare il blocco di codice
          </span>
        </div>
        <figure className="prompt-code-figure">
          <pre tabIndex={0} className="final-prompt-pre">
            <code>{result.finalPrompt}</code>
          </pre>
        </figure>
      </article>

      {/* Vista B: Anatomia del Prompt */}
      <article className="result-panel anatomy-panel" aria-labelledby="anatomy-title">
        <div className="panel-title-bar">
          <h3 id="anatomy-title">
            B. Anatomia del Prompt ({result.anatomy.length} blocchi {result.frameworkName})
          </h3>
          <span className="panel-hint">
            Come l&apos;AI ha scomposto e arricchito la tua idea in ciascun blocco strutturale
          </span>
        </div>
        <div className="anatomy-grid" role="list">
          {result.anatomy.map((block, index) => (
            <div
              key={`${block.blockKey}-${index}`}
              role="listitem"
              className="anatomy-card"
            >
              <div className="anatomy-card-header">
                <span className="anatomy-key-badge">{block.blockKey}</span>
                <h4 className="anatomy-block-label">{block.blockLabel}</h4>
              </div>
              <p className="anatomy-block-content">{block.content}</p>
            </div>
          ))}
        </div>
      </article>

      {/* Vista C: Perché Funziona */}
      <article className="result-panel why-panel" aria-labelledby="why-title">
        <div className="panel-title-bar">
          <h3 id="why-title">C. Perché questo Prompt funziona meglio</h3>
          <span className="panel-hint">
            Miglioramenti strutturali rispetto al testo grezzo iniziale
          </span>
        </div>
        <ul className="why-list">
          {result.whyItWorks.map((reason, idx) => (
            <li key={idx} className="why-list-item">
              <span className="why-check-icon" aria-hidden="true">
                ✓
              </span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
};
