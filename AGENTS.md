# PromptBuilder — AI Coding Agent Instructions (`AGENTS.md`)

## Project Overview
**PromptBuilder** is a 100% stateless web application that helps users discover the most effective Prompt Engineering frameworks and techniques, select the one that best fits their goal, enter a raw free-text description of what they want to achieve, and rewrite it into a production-ready structured prompt using an LLM API (**Ollama** or **OpenRouter**).

- **Frontend**: React 19 + Vite + TypeScript (`client/`)
- **Backend**: Lightweight Node.js + Express + TypeScript proxy (`server/`)
- **Shared Contracts & Catalog**: TypeScript types and the 11-framework catalog (`shared/promptTypes.ts`)
- **Automated & E2E Tests**: Vitest + Supertest (`tests/promptBuilder.test.ts`, `tests/functionalE2E.test.ts`)
- **Specifications**: See [plan.md](./plan.md) for functional specifications and [implementation.md](./implementation.md) for technical architecture.

## Architecture & Stateless Constraints
- **Strictly Stateless**: Do NOT add databases (SQLite, Postgres, MongoDB, Redis), server-side sessions, user authentication, or server-side file logging of user prompts.
- **Single Free-Text Input UX**: The prompt generation workspace must keep a single free-text `<textarea>` where the user writes their raw idea; the backend Meta-Prompt Engine infers and populates all framework-specific blocks automatically.
- **Three-Part Output Contract**: Every `/api/build-prompt` response must return:
  1. `finalPrompt`: Ready-to-copy rewritten prompt string.
  2. `anatomy`: Array of `{ blockKey, blockLabel, content }` matching the selected framework's structural blocks.
  3. `whyItWorks`: Array of concise explanations highlighting why the rewritten prompt improves upon the user's raw text.

## Default Local LLM Configuration (`.env`)
By default, the project is configured to run locally via **Ollama** with model `qwen3.6:35b-a3b-coding-nvfp4`:
```dotenv
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3.6:35b-a3b-coding-nvfp4
PORT=3002
```
> **Note on Ollama MLX Models**: Models running on the Ollama MLX runner (such as `qwen3.6:35b-a3b-coding-nvfp4`) return `{"error":"structured output is unavailable"}` if `format: "json"` is passed in `/api/chat`. Always use `think: false` and `stream: false` in `server/llmClient.ts` and rely on `parseLlmJsonOutput` for resilient JSON extraction.

## Dev Environment, Start & Build Commands
- **Install dependencies**:
  ```bash
  npm install
  ```
- **Start full-stack development server (Express backend on `:3002` + Vite frontend on `:5173`)**:
  ```bash
  npm run dev
  ```
- **Start backend server only (watch mode on `http://localhost:3002`)**:
  ```bash
  npm run dev:server
  ```
- **Start Vite frontend only (`http://localhost:5173`, proxies `/api` to `:3002`)**:
  ```bash
  npm run dev:client
  ```
- **Build for production (TypeScript typecheck `tsc --noEmit` + Vite production bundle in `dist/client`)**:
  ```bash
  npm run build
  ```
- **Start production server (serves both `/api/*` and compiled static frontend from `dist/client` on `http://localhost:3002`)**:
  ```bash
  npm start
  ```

## Testing & Verification Commands
- **Run the complete automated test suite (Unit + Integration + Full-Stack E2E)**:
  ```bash
  npm test
  ```
- **Run only Unit & API validation tests (`tests/promptBuilder.test.ts`)**:
  ```bash
  npx vitest run tests/promptBuilder.test.ts
  ```
- **Run only Full-Stack Functional E2E tests across all 11 frameworks (`tests/functionalE2E.test.ts`)**:
  ```bash
  npx vitest run tests/functionalE2E.test.ts
  ```
- **Verify live backend health and active provider/model (`GET /api/health`)**:
  ```bash
  curl -s http://localhost:3002/api/health
  ```
- **Verify catalog endpoint (`GET /api/frameworks`)**:
  ```bash
  curl -s http://localhost:3002/api/frameworks
  ```
- **Run a live end-to-end prompt generation test against local Ollama (`qwen3.6:35b-a3b-coding-nvfp4`)**:
  ```bash
  curl -s -X POST http://localhost:3002/api/build-prompt \
    -H "Content-Type: application/json" \
    -d '{"frameworkId":"rtf","userText":"Scrivi una funzione TypeScript per fare retry esponenziale di una chiamata fetch."}'
  ```
- **Run a serverless one-shot live test via Supertest + Ollama (without starting a background daemon)**:
  ```bash
  npx tsx -e "import { createApp } from './server/index.ts'; import request from 'supertest'; (async () => { const res = await request(createApp()).post('/api/build-prompt').send({ frameworkId: 'rtf', userText: 'Scrivi una funzione TypeScript per fare retry esponenziale di una chiamata fetch.' }); console.log(res.status, res.body.providerUsed, res.body.modelUsed, res.body.anatomy.length); })();"
  ```

## Testing & Verification Checklist for Agents
- Always run `npm run build` and `npm test` after modifying shared types, backend meta-prompts, or frontend components.
- Ensure all 11 prompt types in `shared/promptTypes.ts` (`co-star`, `risen`, `rtf`, `bab`, `care`, `crispe`, `chain-of-thought`, `tree-of-thoughts`, `few-shot`, `socratic`, `xml-structured`) have complete `blocks`, `categories`, `basedOn`, `peculiarities`, and before/after examples.
- Test JSON parsing resilience in `server/llmClient.ts` against raw JSON, Markdown-fenced JSON (` ```json ... ``` `), and `<think>...</think>` blocks.

## Code Style & Modern Web Standards
- **TypeScript**: Use strict typing (`strict: true`). Share interfaces via `shared/promptTypes.ts` rather than duplicating types between `client/` and `server/`.
- **Semantic HTML5**:
  - Use `<header>`, `<main>`, `<search>`, `<aside>`, `<article>`, and `<footer>` landmarks instead of generic `<div>` wrappers where semantic elements apply.
  - Wrap generated prompt code blocks in `<pre tabindex="0"><code>` for keyboard scroll accessibility.
  - Use `type="button"` on all non-submit `<button>` elements.
- **Modern CSS & Accessibility**:
  - **Browser Support Policy**: Baseline Widely Available features by default; use `text-wrap: balance` on headings and `text-wrap: pretty` on body copy.
  - Respect `@media (prefers-reduced-motion: reduce)` on all loading spinners and transitions.
  - Hide purely decorative SVGs with `aria-hidden="true"`.

## Security & LLM Provider Guardrails
- **Secrets Management**: Never hardcode API keys in source files or expose `OPENROUTER_API_KEY` to the frontend bundle. Read all provider credentials exclusively in `server/` from `process.env` (`.env`).
- **Dual Provider Support**: `server/llmClient.ts` must support both:
  - `LLM_PROVIDER=ollama` (`OLLAMA_BASE_URL`, `OLLAMA_MODEL`, default `qwen3.6:35b-a3b-coding-nvfp4`)
  - `LLM_PROVIDER=openrouter` (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`)
- **Input Sanitization**: Validate `frameworkId` against the known catalog and cap `userText` length (5 to 8000 characters) on `POST /api/build-prompt` before invoking the LLM.
