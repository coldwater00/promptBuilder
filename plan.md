# PromptBuilder — Specifiche Funzionali e Piano di Progetto (`plan.md`)

## 1. Visione e Obiettivo del Progetto
**PromptBuilder** è un'applicazione web **100% stateless** (senza database, senza autenticazione e senza salvataggio lato server dei dati utente) progettata per aiutare sviluppatori, professionisti e creator a:
1. **Conoscere e scegliere la tipologia di prompt più efficace** per il proprio obiettivo tramite un catalogo ragionato e filtrabile dei migliori framework di Prompt Engineering.
2. **Trasformare un'idea grezza (testo libero)** in un prompt strutturato, completo e pronto all'uso grazie a un motore AI basato su **OpenRouter** o **Ollama**.
3. **Comprendere l'anatomia del prompt generato** e il motivo per cui le modifiche strutturali apportate migliorano la qualità dell'output dell'LLM.

---

## 2. Ricerca e Tassonomia delle Tipologie di Prompt

Il catalogo dell'applicazione include **11 tipologie di prompt**, suddivise in **3 macro-famiglie** e filtrabili per **5 obiettivi d'uso**:
- **Obiettivi d'uso (Filtri):**
  - `Tutti`
  - `Coding & Tech`
  - `Scrittura & Marketing`
  - `Analisi & Logica`
  - `Studio & Brainstorming`
  - `Agenti & System`

### Famiglia A: Framework Strutturati (Checklist & Brief Completi)
Forniscono una griglia rigorosa per non dimenticare contesto, vincoli, tono e formato di output.

| ID | Nome Framework | Acronimo / Blocchi | Su cosa si basa | Quando usarlo (Particolarità) | Categorie |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `co-star` | **CO-STAR** | **C**ontext, **O**bjective, **S**tyle, **T**one, **A**udience, **R**esponse | Framework creato da GovTech Singapore per standardizzare tutte le coordinate comunicative di una richiesta. | Ideale quando servono controllo totale su tono, pubblico di riferimento e formato finale. | Scrittura & Marketing, Analisi & Logica |
| `risen` | **RISEN** | **R**ole, **I**nstructions, **S**teps, **E**nd-goal, **N**arrowing | Basato sulla scomposizione procedurale con vincoli espliciti (cosa fare e cosa NON fare). | Perfetto per flussi operativi complessi, guide tecniche, piani d'azione e task con regole stringenti. | Coding & Tech, Scrittura & Marketing, Agenti & System |
| `rtf` | **RTF** | **R**ole, **T**ask, **F**ormat | Minimalismo ad alto impatto: assegna un'identità esperta, definisce l'azione e blocca il formato di uscita. | Ottimo per task rapidi quotidiani, snippet di codice, tabelle o conversioni veloci. | Coding & Tech, Analisi & Logica |
| `bab` | **BAB** | **B**efore, **A**fter, **B**ridge | Modello orientato alla trasformazione: descrive il problema attuale (*Before*), lo stato ideale (*After*) e chiede la soluzione (*Bridge*). | Eccellente per copywriting persuasivo, refactoring del codice, migrazioni architetturali e problem solving. | Scrittura & Marketing, Coding & Tech |
| `care` | **CARE** | **C**ontext, **A**ction, **R**esult, **E**xample | Combina istruzioni chiare con un obiettivo misurabile (*Result*) e un riferimento concreto (*Example*). | Molto efficace per creazione di contenuti, UX writing e task creativi in cui lo stile va ancorato a un esempio. | Scrittura & Marketing, Studio & Brainstorming |
| `crispe` | **CRISPE** | **C**apacity/Role, **R**esource/Insight, **I**nsight, **S**tatement, **P**ersonality, **E**xperiment | Spinge il modello ad assumere una personalità specifica e a proporre più esperimenti/approcci alternativi. | Ideale per brainstorming avanzato, esplorazione di mercato e generazione di varianti multiple. | Studio & Brainstorming, Scrittura & Marketing |

### Famiglia B: Tecniche Cognitive e di Ragionamento
Guidano il processo di pensiero interno dell'LLM prima di emettere la risposta finale, riducendo drasticamente errori logici e allucinazioni.

| ID | Nome Tecnica | Blocchi Strutturali | Su cosa si basa | Quando usarlo (Particolarità) | Categorie |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `chain-of-thought` | **Chain-of-Thought (CoT)** | **Problem**, **Assumptions**, **Step-by-Step Reasoning**, **Verification**, **Final Output** | Forza il modello a esplicitare i passaggi logici intermedi (*"think step-by-step"*) prima di arrivare alla conclusione. | Indispensabile per debugging, matematica, logica complessa e analisi di cause-effetto. | Analisi & Logica, Coding & Tech |
| `tree-of-thoughts` | **Tree of Thoughts (ToT)** | **Core Challenge**, **Branch Generation (3 Hypotheses)**, **Critique & Scoring**, **Synthesis / Best Path** | Estende il CoT esplorando più rami risolutivi in parallelo, autovalutando pro/contro e scegliendo il percorso ottimale. | Ideale per architettura software, decisioni strategiche e problemi aperti senza un'unica soluzione ovvia. | Analisi & Logica, Coding & Tech, Studio & Brainstorming |
| `few-shot` | **Few-Shot Prompting** | **Task Rules**, **Example 1 (Input → Output)**, **Example 2 (Input → Output)**, **Example 3 (Edge Case)**, **Target Input** | Sfrutta l'*In-Context Learning* dell'LLM mostrando coppie concrete di input/output prima del task reale. | Il migliore quando il formato di uscita, lo stile o la classificazione devono seguire uno schema rigoroso. | Coding & Tech, Analisi & Logica, Agenti & System |
| `socratic` | **Socratic Prompting** | **Tutor Persona**, **Topic & Goal**, **Probing Rules**, **Iterative Questioning Flow**, **Guardrails (No Direct Spoiler)** | Basato sul metodo maieutico socratico: istruisce l'AI a non dare subito la soluzione ma a guidare l'utente con domande mirate. | Perfetto per studio attivo, preparazione colloqui, coaching e raccolta requisiti. | Studio & Brainstorming |

### Famiglia C: Architetture Strutturali & Agentiche
Progettate per system prompt robusti, isolamento dei dati e integrazione con agenti o workflow.

| ID | Nome Tecnica | Blocchi Strutturali | Su cosa si basa | Quando usarlo (Particolarità) | Categorie |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `xml-structured` | **XML-Structured System Prompt** | `<role>`, `<context>`, `<instructions>`, `<constraints>`, `<input_data>`, `<output_contract>` | Usa delimitatori semantici XML per isolare nettamente istruzioni di sistema, vincoli e payload dati. | Massima precisione su modelli frontier (Claude, GPT, Gemini, Llama), previene confusione tra dati e comandi. | Agenti & System, Coding & Tech |

---

## 3. Flusso Utente (UX Single-Page Dashboard)

L'interfaccia è organizzata come una **Dashboard Single-Page interattiva** a due aree principali:

1. **Esplorazione e Selezione della Tipologia (Catalogo Sinistro / Superiore)**
   - L'utente può filtrare le tipologie per **Obiettivo d'uso** (tramite pill/tab) o cercare per parola chiave dentro un elemento semantico `<search>`.
   - Ogni card mostra:
     - Nome, acronimo e famiglia (Framework / Ragionamento / Strutturale)
     - Badge dei blocchi che compongono il prompt (es. `C` `O` `S` `T` `A` `R`)
     - **Su cosa si basa** e **Particolarità / Quando sceglierlo**
   - Cliccando su una card, questa diventa la tipologia attiva nel Workspace.

2. **Dettaglio Tipologia & Input Testo Libero (Workspace Destro)**
   - **Header della Tipologia Scelta**: riassume i blocchi del framework selezionato e permette di espandere un esempio rapido *Prima / Dopo*.
   - **Box Input Utente (Solo Testo Libero)**:
     - Un'unica `<textarea>` chiara e spaziosa dove l'utente scrive la propria idea grezza (es. *"Devo scrivere una mail a un cliente per spiegare che il rilascio ritarderà di 3 giorni senza farlo arrabbiare"*).
     - Pulsante primario **Genera Prompt Strutturato** (con scorciatoia `Cmd/Ctrl + Enter`).

3. **Risultato della Riscrittura AI (3 Viste Coordinate)**
   - **A. Prompt Finale Pronto all'Uso**:
     - Blocco `<pre tabindex="0"><code>` ad alta leggibilità con il prompt completo generato dall'LLM.
     - Pulsante **Copia Prompt** con feedback immediato (`Copiato!`).
   - **B. Anatomia del Prompt**:
     - Scomposizione visiva che mostra come l'AI ha compilato ciascun blocco specifico della tipologia scelta (es. per *CO-STAR*: card dedicate a *Context*, *Objective*, *Style*, *Tone*, *Audience*, *Response*).
   - **C. Perché Funziona (Spiegazione Sintetica)**:
     - Elenco puntato sintetico (3–4 punti) che spiega quali elementi mancavano nel testo grezzo dell'utente e perché la nuova struttura produce risposte migliori.

---

## 4. Requisiti Non Funzionali e Vincoli Architetturali
- **100% Stateless**: Nessun database, nessuna sessione persistente sul server, nessun salvataggio della cronologia su disco. Ogni richiesta `POST /api/build-prompt` è autocontenuta.
- **Provider LLM Supportati (`.env`)**:
  - **OpenRouter** (`https://openrouter.ai/api/v1/chat/completions`) per accedere a qualsiasi modello cloud (Gemini, Claude, GPT, Llama, DeepSeek, ecc.).
  - **Ollama** (`http://localhost:11434/api/chat`) per esecuzione 100% locale e gratuita.
- **Standard Web Moderni**:
  - Semantica HTML5 rigorosa (`<header>`, `<main>`, `<search>`, `<aside>`, `<article>`, `<pre tabindex="0"><code>`).
  - Tipografia bilanciata (`text-wrap: balance` e `text-wrap: pretty`).
  - Accessibilità tastiera, contrasto colori curato, supporto `prefers-reduced-motion` per le animazioni di caricamento.
