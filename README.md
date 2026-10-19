# PromptBuilder 🚀

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Stateless](https://img.shields.io/badge/Architecture-100%25_Stateless-success)
![Providers](https://img.shields.io/badge/LLM-Ollama_%7C_OpenRouter-blueviolet)

**PromptBuilder** è un'applicazione web **100% stateless** progettata per aiutare sviluppatori, professionisti e creator a scoprire i migliori framework di **Prompt Engineering**, selezionare quello più adatto al proprio obiettivo e trasformare un'idea grezza in testo libero in un **prompt strutturato, completo e pronto per la produzione** tramite modelli LLM locali (**Ollama**) o cloud (**OpenRouter**).

---

## ✨ Caratteristiche Principali

- **100% Stateless & Privacy-First**: Nessun database, nessuna autenticazione, nessuna sessione persistente o salvataggio su disco dei prompt inseriti. Ogni richiesta è completamente autocontenuta.
- **Catalogo Interattivo di 11 Framework**: Esplora le metodologie più efficaci di Prompt Engineering suddivise in 3 macro-famiglie (*Framework Strutturati*, *Tecniche Cognitive e di Ragionamento*, *Architetture Strutturali & Agentiche*) e filtrabili per caso d'uso o parola chiave.
- **UX "Single Free-Text Input"**: Non serve compilare decine di campi separati. Scrivi la tua idea grezza in un'unica area di testo libero: il motore di *Meta-Prompting* deduce automaticamente ruolo, contesto, vincoli e formato seguendo i blocchi del framework scelto.
- **Output Strutturato in 3 Viste Coordinate**:
  1. **Prompt Finale Pronto all'Uso**: Blocco di codice ad alta leggibilità con copia rapida in un clic (`Copia Prompt`).
  2. **Anatomia del Prompt**: Scomposizione blocco per blocco che mostra come l'AI ha popolato ciascuna sezione del framework selezionato.
  3. **Perché Funziona**: Analisi sintetica dei miglioramenti apportati rispetto alla richiesta grezza iniziale.
- **Dual LLM Provider Support**: Funziona sia **100% in locale e gratuitamente** tramite **Ollama** (incluso il supporto resiliente per modelli MLX/reasoning), sia in cloud tramite **OpenRouter** (compatibile con Gemini, Claude, GPT, Llama, DeepSeek, Qwen, ecc.).
- **Standard Web Moderni & Accessibilità**: Costruito con HTML5 semantico (`<header>`, `<main>`, `<search>`, `<aside>`, `<article>`, `<pre tabindex="0"><code>`), tipografia bilanciata (`text-wrap: balance` / `pretty`), scorciatoie da tastiera (`Cmd/Ctrl + Enter`) e pieno supporto per `@media (prefers-reduced-motion: reduce)`.

---

## 🧠 Catalogo dei Framework Supportati (11 Tipologie)

Il catalogo è filtrabile per **5 obiettivi d'uso** (`Coding & Tech`, `Scrittura & Marketing`, `Analisi & Logica`, `Studio & Brainstorming`, `Agenti & System`):

### 1. Framework Strutturati (Checklist & Brief Completi)
| ID | Framework | Blocchi Strutturali | Quando usarlo |
| :--- | :--- | :--- | :--- |
| `co-star` | **CO-STAR** | **C**ontext, **O**bjective, **S**tyle, **T**one, **A**udience, **R**esponse | Ideale quando servono controllo totale su tono, pubblico di riferimento e formato finale. |
| `risen` | **RISEN** | **R**ole, **I**nstructions, **S**teps, **E**nd-goal, **N**arrowing | Perfetto per flussi operativi complessi, guide tecniche, piani d'azione e task con vincoli stringenti. |
| `rtf` | **RTF** | **R**ole, **T**ask, **F**ormat | Minimalismo ad alto impatto per task rapidi quotidiani, snippet di codice, tabelle o conversioni veloci. |
| `bab` | **BAB** | **B**efore, **A**fter, **B**ridge | Eccellente per refactoring del codice, migrazioni architetturali, problem solving e copywriting persuasivo. |
| `care` | **CARE** | **C**ontext, **A**ction, **R**esult, **E**xample | Molto efficace per creazione di contenuti, UX writing e task in cui lo stile va ancorato a un esempio concreto. |
| `crispe` | **CRISPE** | **C**apacity/Role, **R**esource/Insight, **I**nsight, **S**tatement, **P**ersonality, **E**xperiment | Ideale per brainstorming avanzato, esplorazione di soluzioni e generazione di più approcci alternativi. |

### 2. Tecniche Cognitive e di Ragionamento
| ID | Tecnica | Blocchi Strutturali | Quando usarla |
| :--- | :--- | :--- | :--- |
| `chain-of-thought` | **Chain-of-Thought (CoT)** | **Problem**, **Assumptions**, **Step-by-Step Reasoning**, **Verification**, **Final Output** | Indispensabile per debugging, matematica, logica complessa e analisi rigorosa delle cause-effetto. |
| `tree-of-thoughts` | **Tree of Thoughts (ToT)** | **Core Challenge**, **Branch Generation (3 Hypotheses)**, **Critique & Scoring**, **Synthesis / Best Path** | Ideale per architettura software, decisioni strategiche e problemi aperti senza un'unica soluzione ovvia. |
| `few-shot` | **Few-Shot Prompting** | **Task Rules**, **Example 1 (Input → Output)**, **Example 2 (Input → Output)**, **Example 3 (Edge Case)**, **Target Input** | Il migliore quando il formato di uscita, lo stile o la classificazione devono seguire uno schema rigoroso per imitazione. |
| `socratic` | **Socratic Prompting** | **Tutor Persona**, **Topic & Goal**, **Probing Rules**, **Iterative Questioning Flow**, **Guardrails** | Perfetto per studio attivo, preparazione colloqui, coaching e scoperta guidata senza spoiler immediati. |

### 3. Architetture Strutturali & Agentiche
| ID | Tecnica | Blocchi Strutturali | Quando usarla |
| :--- | :--- | :--- | :--- |
| `xml-structured` | **XML-Structured System Prompt** | `<role>`, `<context>`, `<instructions>`, `<constraints>`, `<input_data>`, `<output_contract>` | Massima precisione su modelli frontier; usa delimitatori semantici XML per isolare nettamente istruzioni e dati. |

---

## 🏗️ Architettura e Struttura del Progetto

Il progetto utilizza un'architettura **Frontend React 19 + Vite (TypeScript)** abbinata a un **Backend Proxy Stateless in Node.js + Express (TypeScript)** che protegge le chiavi API (`.env`) e orchestra i Meta-Prompt verso il provider LLM configurato.

```text
promptBuilder/
├── client/                         # Frontend Single-Page Application (React 19 + Vite + TS)
│   ├── index.html                  # Entry point HTML5 semantico
│   └── src/
│       ├── main.tsx                # Bootstrap React
│       ├── App.tsx                 # Dashboard principale e gestione stato client
│       ├── styles.css              # Design system CSS moderno (dark/light, text-wrap, a11y)
│       └── components/
│           ├── PromptCatalog.tsx   # Ricerca <search>, filtri categoria e griglia card
│           ├── PromptWorkspace.tsx # Dettaglio framework, esempio Prima/Dopo e <textarea>
│           └── PromptResultView.tsx# Prompt finale copiabile, Anatomia e "Perché funziona"
├── server/                         # Backend Proxy Stateless (Express + TypeScript)
│   ├── index.ts                    # Server Express (GET /api/health, GET /api/frameworks, POST /api/build-prompt)
│   ├── llmClient.ts                # Client unificato Ollama / OpenRouter con parser JSON resiliente
│   └── metaPromptBuilder.ts        # Generatore di System/User Meta-Prompt specifici per ciascun framework
├── shared/
│   └── promptTypes.ts              # Contratti TypeScript condivisi e catalogo completo delle 11 tipologie
├── tests/
│   ├── promptBuilder.test.ts       # Unit & Integration test (catalogo, meta-prompt, parser JSON, API validation)
│   └── functionalE2E.test.ts       # Full-Stack Functional E2E test su tutti gli 11 framework
├── .env.example                    # Template variabili d'ambiente
├── package.json                    # Script e dipendenze del progetto
├── tsconfig.json                   # Configurazione TypeScript strict
└── vite.config.ts                  # Configurazione Vite (con proxy /api verso Express)
```

---

## ⚙️ Prerequisiti

- **Node.js**: versione **20.x** o superiore (consigliato Node 20 LTS o Node 22)
- **npm**: incluso con Node.js
- Uno dei seguenti **Provider LLM**:
  - **Opzione A (Locale / Gratuito)**: [Ollama](https://ollama.com/) installato e in esecuzione localmente (`http://localhost:11434`).
  - **Opzione B (Cloud)**: Un account e una API Key su [OpenRouter](https://openrouter.ai/).

---

## 🛠️ Installazione e Configurazione dell'Environment

### 1. Clona il repository e installa le dipendenze

```bash
git clone <url-del-tuo-repository-github>
cd promptBuilder
npm install
```

### 2. Crea il file `.env`

Copia il file di template `.env.example` in `.env` nella root del progetto:

```bash
cp .env.example .env
```

### 3. Configura le variabili d'ambiente in `.env`

Puoi scegliere se utilizzare **Ollama** (locale) oppure **OpenRouter** (cloud) impostando la variabile `LLM_PROVIDER`.

#### Opzione A: Configurazione con Ollama (Locale — Default)
Assicurati che Ollama sia attivo (`ollama serve`) e di aver scaricato il modello desiderato (es. `ollama pull qwen3.6:35b-a3b-coding-nvfp4` oppure `ollama pull llama3.2`):

```dotenv
# Provider attivo: "ollama" oppure "openrouter"
LLM_PROVIDER=ollama

# Configurazione Ollama locale (usata quando LLM_PROVIDER=ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3.6:35b-a3b-coding-nvfp4

# Porta del server Express backend
PORT=3002
```

#### Opzione B: Configurazione con OpenRouter (Cloud)
Inserisci la tua chiave API di OpenRouter e l'identificativo del modello che preferisci (es. `google/gemini-2.5-flash`, `anthropic/claude-3.5-sonnet`, `openai/gpt-4o-mini`):

```dotenv
# Provider attivo: "ollama" oppure "openrouter"
LLM_PROVIDER=openrouter

# Configurazione OpenRouter (usata quando LLM_PROVIDER=openrouter)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL=google/gemini-2.5-flash

# Porta del server Express backend
PORT=3002
```

### Tabella di Riferimento Variabili `.env`

| Variabile | Obbligatoria | Default | Descrizione |
| :--- | :---: | :--- | :--- |
| `LLM_PROVIDER` | Sì | `ollama` | Specifica il provider attivo: `ollama` oppure `openrouter`. |
| `OLLAMA_BASE_URL` | Se `ollama` | `http://localhost:11434` | URL base del server Ollama locale. |
| `OLLAMA_MODEL` | Se `ollama` | `qwen3.6:35b-a3b-coding-nvfp4` | Nome del modello installato su Ollama. |
| `OPENROUTER_API_KEY` | Se `openrouter` | — | Chiave API segreta di OpenRouter (letta solo lato server, mai esposta al client). |
| `OPENROUTER_MODEL` | Se `openrouter` | `google/gemini-2.5-flash` | ID del modello su OpenRouter. |
| `PORT` | No | `3002` | Porta su cui si mette in ascolto il server Express backend. |

---

## 🚀 Istruzioni di Avvio

### Modalità Sviluppo (Full-Stack Hot Reload)
Avvia contemporaneamente sia il backend Express (in watch mode su `http://localhost:3002`) sia il frontend Vite (su `http://localhost:5173` con proxy automatico per `/api`):

```bash
npm run dev
```

Una volta avviato, apri il browser all'indirizzo:
👉 **[http://localhost:5173](http://localhost:5173)**

*(Se desideri avviare i due processi separatamente in terminali distinti, puoi usare `npm run dev:server` e `npm run dev:client`).*

### Build e Avvio in Produzione
Per verificare i tipi TypeScript (`tsc --noEmit`), compilare il bundle ottimizzato del frontend in `dist/client` e avviare il server Express di produzione che serve sia le API sia i file statici su un'unica porta:

```bash
# 1. Compila e valida il progetto
npm run build

# 2. Avvia il server in modalità produzione
npm start
```

In modalità produzione l'applicazione completa è disponibile su:
👉 **[http://localhost:3002](http://localhost:3002)** (o sulla porta definita in `PORT`).

---

## 🔌 Riferimento API Backend

Il backend espone tre endpoint REST principali:

### 1. `GET /api/health`
Verifica lo stato del server e mostra quale provider e modello sono attivi (senza mai esporre chiavi segrete).
```bash
curl -s http://localhost:3002/api/health
```
**Risposta di esempio:**
```json
{
  "status": "ok",
  "provider": "ollama",
  "model": "qwen3.6:35b-a3b-coding-nvfp4",
  "configured": true
}
```

### 2. `GET /api/frameworks`
Restituisce il catalogo completo delle 11 tipologie di prompt con blocchi, categorie ed esempi *Before/After*.
```bash
curl -s http://localhost:3002/api/frameworks
```

### 3. `POST /api/build-prompt`
Riceve l'`id` del framework scelto (`frameworkId`) e il testo libero dell'utente (`userText`, da 5 a 8000 caratteri) e restituisce il prompt riscritto strutturato.
```bash
curl -s -X POST http://localhost:3002/api/build-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "frameworkId": "rtf",
    "userText": "Scrivi una funzione TypeScript per fare retry esponenziale di una chiamata fetch."
  }'
```
**Risposta di esempio:**
```json
{
  "frameworkId": "rtf",
  "frameworkName": "RTF",
  "finalPrompt": "...",
  "anatomy": [
    { "blockKey": "R", "blockLabel": "Role", "content": "..." },
    { "blockKey": "T", "blockLabel": "Task", "content": "..." },
    { "blockKey": "F", "blockLabel": "Format", "content": "..." }
  ],
  "whyItWorks": [
    "Definisce un ruolo tecnico senior preciso...",
    "Esplicita i casi limite di gestione degli errori e backoff...",
    "Vincola l'output a codice TypeScript tipizzato pronto all'uso."
  ],
  "providerUsed": "ollama",
  "modelUsed": "qwen3.6:35b-a3b-coding-nvfp4"
}
```

---

## 🧪 Testing e Verifica

Il progetto include una suite di test automatizzati basata su **Vitest** e **Supertest**:

```bash
# Esegue l'intera suite di test (Unit + Integration + Full-Stack E2E)
npm test

# Esegue solo i test unitari e di validazione API (veloci, offline)
npx vitest run tests/promptBuilder.test.ts

# Esegue i test funzionali End-to-End su tutti gli 11 framework
npx vitest run tests/functionalE2E.test.ts
```

---

## 📚 Documentazione Aggiuntiva

- [**Specifiche Funzionali (`plan.md`)**](./plan.md): Tassonomia dettagliata dei framework, ricerca sul Prompt Engineering e flusso UX.
- [**Architettura Tecnica (`implementation.md`)**](./implementation.md): Contratti TypeScript, struttura del Meta-Prompt Engine e dettagli implementativi.
- [**Istruzioni AI Agent (`AGENTS.md`)**](./AGENTS.md): Linee guida architetturali, vincoli stateless e checklist di verifica per coding agents.
