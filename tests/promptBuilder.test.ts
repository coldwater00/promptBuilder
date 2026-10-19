import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import {
  getPromptTypeById,
  PROMPT_TYPES,
  PromptTypeDefinition,
} from '../shared/promptTypes.js';
import { buildMetaPrompt } from '../server/metaPromptBuilder.js';
import {
  generateStructuredPrompt,
  getLlmConfig,
  parseLlmJsonOutput,
} from '../server/llmClient.js';
import { createApp, PromptGeneratorFn } from '../server/index.js';

describe('1. Catalogo Condiviso delle 11 Tipologie di Prompt (shared/promptTypes.ts)', () => {
  it('contiene esattamente le 11 tipologie di prompt specificate in plan.md', () => {
    expect(PROMPT_TYPES).toHaveLength(11);
    const ids = PROMPT_TYPES.map((t) => t.id);
    expect(ids).toEqual([
      'co-star',
      'risen',
      'rtf',
      'bab',
      'care',
      'crispe',
      'chain-of-thought',
      'tree-of-thoughts',
      'few-shot',
      'socratic',
      'xml-structured',
    ]);
  });

  it('garantisce che tutte le 11 tipologie abbiano blocchi, categorie, basedOn, peculiarities ed esempi completi', () => {
    for (const fw of PROMPT_TYPES) {
      expect(fw.name.length).toBeGreaterThan(1);
      expect(fw.acronym.length).toBeGreaterThan(1);
      expect(fw.basedOn.length).toBeGreaterThan(20);
      expect(fw.peculiarities.length).toBeGreaterThan(20);
      expect(fw.categories.length).toBeGreaterThanOrEqual(1);
      expect(fw.bestFor.length).toBeGreaterThanOrEqual(2);
      expect(fw.blocks.length).toBeGreaterThanOrEqual(3);
      expect(fw.exampleBefore.length).toBeGreaterThan(10);
      expect(fw.exampleAfter.length).toBeGreaterThan(30);

      for (const block of fw.blocks) {
        expect(block.key.trim().length).toBeGreaterThan(0);
        expect(block.label.trim().length).toBeGreaterThan(0);
        expect(block.description.trim().length).toBeGreaterThan(5);
      }
    }
  });
});

describe('2. Costruttore Meta-Prompt (server/metaPromptBuilder.ts)', () => {
  it('genera systemPrompt e userPrompt coerenti per ciascuna delle 11 tipologie', () => {
    const rawIdea =
      'Voglio creare uno script Python che analizzi i log di Nginx e trovi gli IP sospetti.';

    for (const fw of PROMPT_TYPES) {
      const { systemPrompt, userPrompt } = buildMetaPrompt(fw, rawIdea);
      expect(systemPrompt).toContain(fw.name);
      expect(systemPrompt).toContain(fw.basedOn);
      for (const block of fw.blocks) {
        expect(systemPrompt).toContain(block.label);
      }
      expect(userPrompt).toContain(rawIdea);
      expect(userPrompt).toContain(fw.id);
    }
  });
});

describe('3. Resilienza del Parser JSON e Client LLM (server/llmClient.ts)', () => {
  const rtfFramework = getPromptTypeById('rtf')!;

  it('effettua correttamente il parsing di JSON puro', () => {
    const rawJson = JSON.stringify({
      finalPrompt: '[ROLE]\nSenior Dev\n[TASK]\nWrite tests\n[FORMAT]\nVitest TS',
      anatomy: [
        { blockKey: 'R', blockLabel: 'Role', content: 'Senior Dev' },
        { blockKey: 'T', blockLabel: 'Task', content: 'Write tests' },
        { blockKey: 'F', blockLabel: 'Format', content: 'Vitest TS' },
      ],
      whyItWorks: [
        'Definisce un ruolo verticale',
        'Specifica il framework di test',
        'Blocca il formato di output',
      ],
    });

    const parsed = parseLlmJsonOutput(rawJson, rtfFramework);
    expect(parsed.finalPrompt).toContain('[ROLE]');
    expect(parsed.anatomy).toHaveLength(3);
    expect(parsed.whyItWorks).toHaveLength(3);
  });

  it('effettua il parsing anche quando il modello avvolge il JSON in fence Markdown o tag <think>', () => {
    const fenced = `<think>Ragionamento interno del modello...</think>
Ecco il tuo JSON strutturato:
\`\`\`json
{
  "finalPrompt": "[ROLE] Esperto SQL [TASK] Ottimizza query [FORMAT] Tabella + SQL",
  "anatomy": [
    { "blockKey": "R", "blockLabel": "Role", "content": "Esperto SQL" },
    { "blockKey": "T", "blockLabel": "Task", "content": "Ottimizza query" },
    { "blockKey": "F", "blockLabel": "Format", "content": "Tabella + SQL" }
  ],
  "whyItWorks": [
    "Aggiunge competenza DBA",
    "Richiede output verificabile"
  ]
}
\`\`\``;

    const parsed = parseLlmJsonOutput(fenced, rtfFramework);
    expect(parsed.finalPrompt).toContain('Esperto SQL');
    expect(parsed.anatomy[0].blockKey).toBe('R');
    expect(parsed.whyItWorks).toHaveLength(2);
  });

  it('invoca correttamente OpenRouter e Ollama tramite fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                finalPrompt: 'Prompt finale OpenRouter',
                anatomy: [
                  { blockKey: 'R', blockLabel: 'Role', content: 'Ruolo' },
                  { blockKey: 'T', blockLabel: 'Task', content: 'Compito' },
                  { blockKey: 'F', blockLabel: 'Format', content: 'Formato' },
                ],
                whyItWorks: ['Motivo 1', 'Motivo 2'],
              }),
            },
          },
        ],
      }),
    });

    const res = await generateStructuredPrompt(
      rtfFramework,
      'Scrivi una funzione di debounce in TypeScript',
      {
        LLM_PROVIDER: 'openrouter',
        OPENROUTER_API_KEY: 'sk-or-v1-real-test-key',
        OPENROUTER_MODEL: 'google/gemini-2.5-flash',
      },
      mockFetch as unknown as typeof fetch
    );

    expect(res.providerUsed).toBe('openrouter');
    expect(res.modelUsed).toBe('google/gemini-2.5-flash');
    expect(res.finalPrompt).toBe('Prompt finale OpenRouter');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('rileva correttamente la configurazione di health senza esporre segreti', () => {
    const cfg = getLlmConfig({
      LLM_PROVIDER: 'openrouter',
      OPENROUTER_API_KEY: 'sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx',
      OPENROUTER_MODEL: 'google/gemini-2.5-flash',
    });
    expect(cfg.configured).toBe(false);

    const cfgOllama = getLlmConfig({
      LLM_PROVIDER: 'ollama',
      OLLAMA_BASE_URL: 'http://localhost:11434',
      OLLAMA_MODEL: 'gemma4:26b',
    });
    expect(cfgOllama.provider).toBe('ollama');
    expect(cfgOllama.model).toBe('gemma4:26b');
    expect(cfgOllama.configured).toBe(true);
  });
});

describe('4. Endpoint API Express Stateless (server/index.ts)', () => {
  const fakeGenerator: PromptGeneratorFn = vi.fn(
    async (fw: PromptTypeDefinition, userText: string) => ({
      finalPrompt: `Prompt strutturato ${fw.name} per: ${userText}`,
      anatomy: fw.blocks.map((b) => ({
        blockKey: b.key,
        blockLabel: b.label,
        content: `Contenuto per ${b.label}`,
      })),
    whyItWorks: [
      'Aggiunto contesto operativo',
      'Definiti vincoli chiari',
      'Strutturato il formato di output',
    ],
    providerUsed: 'ollama' as const,
    modelUsed: 'gemma4:26b',
  }));

  const app = createApp(fakeGenerator, {
    LLM_PROVIDER: 'ollama',
    OLLAMA_BASE_URL: 'http://localhost:11434',
    OLLAMA_MODEL: 'gemma4:26b',
  });

  it('GET /api/health restituisce stato ok e info provider senza segreti', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      provider: 'ollama',
      model: 'gemma4:26b',
      configured: true,
    });
  });

  it('POST /api/build-prompt rifiuta frameworkId inesistente con HTTP 400', async () => {
    const res = await request(app)
      .post('/api/build-prompt')
      .send({ frameworkId: 'non-existent', userText: 'Testo valido lungo abbastanza' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('non riconosciuta');
  });

  it('POST /api/build-prompt rifiuta userText troppo corto con HTTP 400', async () => {
    const res = await request(app)
      .post('/api/build-prompt')
      .send({ frameworkId: 'co-star', userText: 'abc' });
    expect(res.status).toBe(400);
  });

  it('POST /api/build-prompt restituisce il contratto completo a 3 parti per un input valido', async () => {
    const res = await request(app).post('/api/build-prompt').send({
      frameworkId: 'co-star',
      userText: 'Devo scrivere una mail a un cliente per spiegare un ritardo di 3 giorni.',
    });

    expect(res.status).toBe(200);
    expect(res.body.frameworkId).toBe('co-star');
    expect(res.body.frameworkName).toBe('CO-STAR');
    expect(res.body.finalPrompt).toContain('CO-STAR');
    expect(res.body.anatomy).toHaveLength(6);
    expect(res.body.whyItWorks).toHaveLength(3);
  });
});
