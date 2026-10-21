import React, { useEffect, useMemo, useState } from 'react';
import {
  AuthStatusResponse,
  AuthVerifyResponse,
  BuildPromptResponse,
  getPromptTypeById,
  HealthResponse,
  PROMPT_TYPES,
} from '../../shared/promptTypes';
import { FilterCategory, PromptCatalog } from './components/PromptCatalog';
import { PromptWorkspace } from './components/PromptWorkspace';
import { PromptResultView } from './components/PromptResultView';
import { PassphraseGate } from './components/PassphraseGate';

export const App: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(PROMPT_TYPES[0].id);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userText, setUserText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BuildPromptResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [authRequired, setAuthRequired] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activePassphrase, setActivePassphrase] = useState<string>('');
  const [isVerifyingAuth, setIsVerifyingAuth] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: HealthResponse | null) => {
        if (active && data) {
          setHealth(data);
        }
      })
      .catch(() => {
        // Ignore silent health check errors on startup
      });

    fetch('/api/auth/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AuthStatusResponse | null) => {
        if (!active) return;
        if (data && data.authRequired === false) {
          setAuthRequired(false);
          setIsAuthenticated(true);
        } else {
          setAuthRequired(true);
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        if (active) {
          setAuthRequired(true);
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        if (active) {
          setAuthChecking(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredFrameworks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return PROMPT_TYPES.filter((fw) => {
      const matchesCategory =
        activeCategory === 'all' || fw.categories.includes(activeCategory);
      if (!matchesCategory) return false;
      if (!query) return true;

      const haystack = [
        fw.name,
        fw.acronym,
        fw.tagline,
        fw.basedOn,
        fw.peculiarities,
        ...fw.bestFor,
        ...fw.blocks.map((b) => `${b.key} ${b.label} ${b.description}`),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [activeCategory, searchQuery]);

  const activeFramework = useMemo(
    () => getPromptTypeById(selectedId) ?? PROMPT_TYPES[0],
    [selectedId]
  );

  const handleVerifyPassphrase = async (candidate: string) => {
    setIsVerifyingAuth(true);
    setAuthError(null);

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passphrase: candidate }),
      });

      const payload = (await response.json()) as AuthVerifyResponse;
      if (!response.ok || !payload.authenticated) {
        throw new Error(
          payload?.error || 'Passphrase non valida. Verifica e riprova.'
        );
      }

      setActivePassphrase(candidate);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Errore durante la verifica della passphrase.'
      );
    } finally {
      setIsVerifyingAuth(false);
    }
  };

  const handleLockSession = () => {
    setActivePassphrase('');
    setIsAuthenticated(false);
    setAuthError(null);
    setErrorMessage(null);
  };

  const handleSelectFramework = (id: string) => {
    setSelectedId(id);
    setErrorMessage(null);
  };

  const handleSubmitPrompt = async () => {
    const trimmed = userText.trim();
    if (trimmed.length < 5) {
      setErrorMessage('Inserisci almeno 5 caratteri per descrivere la tua idea.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activePassphrase) {
        headers['x-app-passphrase'] = activePassphrase;
      }

      const response = await fetch('/api/build-prompt', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          frameworkId: activeFramework.id,
          userText: trimmed,
        }),
      });

      const payload = await response.json();
      if (response.status === 401) {
        setIsAuthenticated(false);
        setActivePassphrase('');
        setAuthError(
          payload?.error || 'Sessione scaduta o passphrase non valida.'
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          payload?.error || `Errore del server (${response.status})`
        );
      }

      setResult(payload as BuildPromptResponse);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Errore di connessione con il server AI.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-block">
            <div className="brand-logo" aria-hidden="true">
              <span>PB</span>
            </div>
            <div>
              <h1 className="brand-title">PromptBuilder</h1>
              <p className="brand-subtitle">
                Catalogo metodologico &amp; generatore AI di prompt strutturati (100% Stateless)
              </p>
            </div>
          </div>

          <div className="header-status" aria-live="polite">
            {health ? (
              <span
                className={`provider-pill ${
                  health.configured ? 'status-ready' : 'status-warn'
                }`}
              >
                <span className="status-dot" aria-hidden="true" />
                <span>
                  Motore AI:{' '}
                  <strong>
                    {health.provider === 'ollama' ? 'Ollama' : 'OpenRouter'}
                  </strong>{' '}
                  ({health.model})
                </span>
              </span>
            ) : (
              <span className="provider-pill status-neutral">
                <span className="status-dot" aria-hidden="true" />
                <span>Connessione backend...</span>
              </span>
            )}

            {authRequired && isAuthenticated && (
              <button
                type="button"
                className="secondary-btn lock-session-btn"
                onClick={handleLockSession}
                title="Torna alla schermata di inserimento passphrase"
              >
                Blocca accesso
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {authChecking ? null : !isAuthenticated ? (
          <PassphraseGate
            isVerifying={isVerifyingAuth}
            errorMessage={authError}
            onSubmitPassphrase={handleVerifyPassphrase}
          />
        ) : (
          <div className="dashboard-grid">
            <PromptCatalog
              frameworks={filteredFrameworks}
              selectedId={activeFramework.id}
              activeCategory={activeCategory}
              searchQuery={searchQuery}
              onSelectFramework={handleSelectFramework}
              onChangeCategory={setActiveCategory}
              onChangeSearch={setSearchQuery}
            />

            <div className="workspace-column">
              <PromptWorkspace
                framework={activeFramework}
                userText={userText}
                isLoading={isLoading}
                errorMessage={errorMessage}
                onChangeUserText={setUserText}
                onSubmit={handleSubmitPrompt}
                onUseExample={(sample) => {
                  setUserText(sample);
                  setErrorMessage(null);
                }}
              />

              {result && <PromptResultView result={result} />}
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          <strong>PromptBuilder</strong> — Architettura 100% Stateless (zero database, zero tracciamento dei prompt). Supporta <strong>OpenRouter</strong> &amp; <strong>Ollama</strong>.
        </p>
      </footer>
    </div>
  );
};

export default App;
