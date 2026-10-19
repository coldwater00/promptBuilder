# PromptBuilder — Piano Tecnico di Implementazione (`implementation.md`)

## 1. Stack Tecnologico e Struttura del Repository
Il progetto adotta un'architettura **Frontend React + Vite (TypeScript)** abbinata a un **Backend Proxy Stateless in Node.js + Express (TypeScript)** che protegge le configurazioni API (`.env`) e orchestra i Meta-Prompt verso **OpenRouter** o **Ollama**.

```text
promptBuilder/
├── AGENTS.md                   # Regole e specifiche per AI Coding Agents (standard AGENTS.md)
├── agent.md                    # Copia/riferimento delle specifiche agentiche del progetto
├── plan.md                     # Specifiche funzionali e ricerca sulle tipologie di prompt
├── implementation.md           # Questo documento: architettura tecnica e piano di implementazione
├── .env.example                # Template variabili d'ambiente per OpenRouter e Ollama
├── package.json                # Dipendenze e script unificati (dev, build, start, test)
├── tsconfig.json               # Configurazione TypeScript condivisa
├── vite.config.ts              # Configurazione Vite con proxy /api -> Express
├── shared/
│   └── promptTypes.ts          # Tipi TS condivisi e catalogo completo delle 11 tipologie di prompt
├── server/
│   ├── index.ts                # Server Express stateless (GET /api/health, POST /api/build-prompt)
│   ├── llmClient.ts            # Client unificato per OpenRouter e Ollama con validazione JSON
│   └── metaPromptBuilder.ts    # Costruttore dei System/User Meta-Prompt specifici per ogni framework
└── client/
    ├── index.html              # Entry HTML5 semantico
    └── src/
        ├── main.tsx            # Bootstrap React
        ├── App.tsx             # Dashboard Single-Page interattiva
        ├── styles.css          # Stili CSS moderni (variabili, dark/light, text-wrap, accessibilità)
        └── components/
            ├── PromptCatalog.tsx     # Barra di ricerca <search>, filtri categoria e griglia card
            ├── PromptWorkspace.tsx   # Dettaglio tipologia scelta, esempio Prima/Dopo e <textarea>
            └── PromptResultView.tsx  # Prompt finale copiabile, Anatomia a blocchi e "Perché funziona"
```

---

## 2. Configurazione Provider AI (`.env`)

Il backend legge la configurazione da `.env` (senza mai esporre chiavi segrete al browser):

```dotenv
# Provider attivo: "openrouter" oppure "ollama"
LLM_PROVIDER=openrouter

# Configurazione OpenRouter (usata quando LLM_PROVIDER=openrouter)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL=google/gemini-2.5-flash

# Configurazione Ollama locale (usata quando LLM_PROVIDER=ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Porta del server Express backend
PORT=3001
```

---

## 3. Contratti Dati Condivisi (`shared/promptTypes.ts`)

```typescript
export type PromptCategory =
  | 'coding'
  | 'writing'
  | 'analysis'
  | 'learning'
  | 'agents';

export type PromptFamily = 'framework' | 'reasoning' | 'structural';

export interface PromptBlockDefinition {
  key: string;          // es. "C" o "Step 1" o "<role>"
  label: string;        // es. "Context"
  description: string;  // Cosa deve contenere questo blocco
}

export interface PromptTypeDefinition {
  id: string;
  name: string;
  acronym: string;
  family: PromptFamily;
  tagline: string;
  basedOn: string;
  peculiarities: string;
  bestFor: string[];
  categories: PromptCategory[];
  blocks: PromptBlockDefinition[];
  exampleBefore: string;
  exampleAfter: string;
}

export interface BuildPromptRequest {
  frameworkId: string;
  userText: string;
}

export interface GeneratedAnatomyBlock {
  blockKey: string;
  blockLabel: string;
  content: string;
}

export interface BuildPromptResponse {
  frameworkId: string;
  frameworkName: string;
  finalPrompt: string;
  anatomy: GeneratedAnatomyBlock[];
  whyItWorks: string[];
  providerUsed: string;
  modelUsed: string;
}
```

---

## 4. API Backend Stateless (`server/`)

### `GET /api/health`
Restituisce lo stato del backend e quale provider/modello è attualmente configurato (senza esporre la API key):
```json
{
  "status": "ok",
  "provider": "openrouter",
  "model": "google/gemini-2.5-flash",
  "configured": true
}
```

### `POST /api/build-prompt`
1. **Validazione Input**:
   - Verifica che `frameworkId` esista nel catalogo `PROMPT_TYPES`.
   - Verifica che `userText` sia una stringa non vuota (lunghezza tra 5 e 8000 caratteri).
2. **Costruzione Meta-Prompt (`server/metaPromptBuilder.ts`)**:
   - Genera un **System Prompt** specializzato in Prompt Engineering che istruisce l'LLM a:
     - Analizzare l'intenzione grezza dell'utente (`userText`), mantenendo la lingua usata dall'utente.
     - Dedurre in modo intelligente i dettagli impliciti (ruolo esperto ottimale, vincoli di qualità, formato di output ideale) senza snaturare la richiesta.
     - Riscrivere il prompt seguendo rigorosamente i blocchi (`blocks`) della tipologia selezionata (`frameworkId`).
     - Restituire **esclusivamente un oggetto JSON valido** con le chiavi `finalPrompt`, `anatomy` (un elemento per ogni blocco della tipologia) e `whyItWorks` (3–4 spiegazioni sintetiche in italiano del perché il nuovo prompt è superiore).
3. **Chiamata a OpenRouter o Ollama (`server/llmClient.ts`)**:
   - **OpenRouter**: `POST https://openrouter.ai/api/v1/chat/completions` con header `Authorization: Bearer ${OPENROUTER_API_KEY}` e `response_format: { type: "json_object" }`.
   - **Ollama**: `POST ${OLLAMA_BASE_URL}/api/chat` con `format: "json"` e `stream: false`.
   - **Parser JSON Resiliente**: rimuove eventuali fence Markdown (` ```json ... ``` `) se il modello le aggiunge e valida la presenza di `finalPrompt`, `anatomy` e `whyItWorks`.

---

## 5. Architettura Frontend (`client/src/`)

### Best Practice Web Moderne Applicate (`modern-web-guidance`)
- **Landmark semantici**: `<header>` per la barra di stato e titolo, `<main>` con layout a due colonne, `<search>` per la ricerca/filtro del catalogo, `<article>` per le card delle tipologie.
- **Blocchi di codice accessibili**: il prompt generato è racchiuso in `<pre tabindex="0"><code>` per consentire lo scroll e la navigazione anche solo da tastiera.
- **Tipografia**: `text-wrap: balance` per le intestazioni e `text-wrap: pretty` per le descrizioni dei framework.
- **Loading Spinner accessibile**: SVG con `role="status"`, testo per screen reader e animazione CSS che rispetta `@media (prefers-reduced-motion: reduce)`.

---

## 6. Piano di Verifica e Test

### Step 1: Verifica Compilazione TypeScript e Build Produzione
```bash
npm run build
```
Controlla che sia il client Vite sia il server TypeScript compilino senza errori.

### Step 2: Test Automatici (`npm test`)
Suite di test con Vitest / Node Test Runner che verifica:
1. Integrità del catalogo delle 11 tipologie di prompt (`shared/promptTypes.ts`).
2. Generazione corretta dei Meta-Prompt per ogni tipologia (`server/metaPromptBuilder.ts`).
3. Parsing e normalizzazione delle risposte JSON dell'LLM (`server/llmClient.ts`).
4. Endpoint Express `GET /api/health` e validazione degli input su `POST /api/build-prompt`.

### Step 3: Verifica Manuale End-to-End
1. Configurare `.env` con OpenRouter o Ollama locale.
2. Avviare `npm run dev` e aprire il browser su `http://localhost:5173`.
3. Filtrare le tipologie per obiettivo, selezionare una tipologia (es. `CO-STAR`, `RISEN`, `Chain-of-Thought`, `XML-Structured`), inserire un testo grezzo e verificare la generazione di Prompt Finale, Anatomia e "Perché funziona".
