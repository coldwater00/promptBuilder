import React from 'react';
import {
  CATEGORY_LABELS,
  FAMILY_LABELS,
  PromptCategory,
  PromptTypeDefinition,
} from '../../../shared/promptTypes';

export type FilterCategory = 'all' | PromptCategory;

interface PromptCatalogProps {
  frameworks: PromptTypeDefinition[];
  selectedId: string;
  activeCategory: FilterCategory;
  searchQuery: string;
  onSelectFramework: (id: string) => void;
  onChangeCategory: (category: FilterCategory) => void;
  onChangeSearch: (query: string) => void;
}

const CATEGORIES: FilterCategory[] = [
  'all',
  'coding',
  'writing',
  'analysis',
  'learning',
  'agents',
];

export const PromptCatalog: React.FC<PromptCatalogProps> = ({
  frameworks,
  selectedId,
  activeCategory,
  searchQuery,
  onSelectFramework,
  onChangeCategory,
  onChangeSearch,
}) => {
  return (
    <aside className="catalog-panel" aria-labelledby="catalog-heading">
      <div className="catalog-header">
        <div className="catalog-title-row">
          <h2 id="catalog-heading">1. Scegli la Metodologia</h2>
          <span className="catalog-count" aria-live="polite">
            {frameworks.length} {frameworks.length === 1 ? 'tipologia' : 'tipologie'}
          </span>
        </div>
        <p className="catalog-subtitle">
          Esplora i framework strutturati, le tecniche di ragionamento e le architetture agentiche per trovare la griglia più adatta al tuo obiettivo.
        </p>

        <search className="catalog-search-region" aria-label="Filtra e cerca tipologie di prompt">
          <div className="search-input-wrapper">
            <label htmlFor="framework-search-input" className="sr-only">
              Cerca per nome, blocco o caso d&apos;uso
            </label>
            <svg
              className="search-icon"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M9 15A6 6 0 1 0 9 3a6 6 0 0 0 0 12Zm8 2-4.15-4.15"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              id="framework-search-input"
              name="q"
              type="search"
              className="search-input"
              placeholder="Cerca framework (es. CO-STAR, debugging, XML, Few-Shot...)"
              value={searchQuery}
              onChange={(e) => onChangeSearch(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => onChangeSearch('')}
                aria-label="Cancella ricerca"
              >
                ✕
              </button>
            )}
          </div>

          <div
            className="category-pills"
            role="group"
            aria-label="Filtra per obiettivo d'uso"
          >
            {CATEGORIES.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  className={`category-pill ${isActive ? 'active' : ''}`}
                  aria-pressed={isActive}
                  onClick={() => onChangeCategory(category)}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              );
            })}
          </div>
        </search>
      </div>

      {frameworks.length === 0 ? (
        <div className="catalog-empty">
          <p>Nessuna tipologia trovata per i filtri selezionati.</p>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => {
              onChangeCategory('all');
              onChangeSearch('');
            }}
          >
            Mostra tutte le 11 tipologie
          </button>
        </div>
      ) : (
        <div className="catalog-grid" role="list">
          {frameworks.map((fw) => {
            const isSelected = fw.id === selectedId;
            return (
              <article
                key={fw.id}
                role="listitem"
                className={`framework-card ${isSelected ? 'selected' : ''}`}
                data-family={fw.family}
              >
                <div className="framework-card-top">
                  <span className={`family-badge family-${fw.family}`}>
                    {FAMILY_LABELS[fw.family]}
                  </span>
                  <div className="block-badges" aria-label="Blocchi strutturali">
                    {fw.blocks.map((b) => (
                      <span
                        key={`${fw.id}-${b.key}`}
                        className="block-pill"
                        title={`${b.label}: ${b.description}`}
                      >
                        {b.key}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="framework-card-title">
                  <button
                    type="button"
                    className="framework-card-select-btn"
                    aria-pressed={isSelected}
                    onClick={() => onSelectFramework(fw.id)}
                  >
                    <span>{fw.name}</span>
                    {isSelected && (
                      <span className="selected-indicator" aria-hidden="true">
                        Attivo
                      </span>
                    )}
                  </button>
                </h3>

                <p className="framework-tagline">{fw.tagline}</p>

                <dl className="framework-meta">
                  <div className="framework-meta-item">
                    <dt>Su cosa si basa</dt>
                    <dd>{fw.basedOn}</dd>
                  </div>
                  <div className="framework-meta-item">
                    <dt>Quando sceglierlo</dt>
                    <dd>{fw.peculiarities}</dd>
                  </div>
                </dl>

                <div className="framework-bestfor">
                  {fw.bestFor.map((tag) => (
                    <span key={tag} className="usecase-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </aside>
  );
};
