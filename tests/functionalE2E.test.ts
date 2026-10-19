import http from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../server/index.js';
import {
  BuildPromptResponse,
  HealthResponse,
  PROMPT_TYPES,
  PromptTypeDefinition,
} from '../shared/promptTypes.js';

/**
 * Generates a realistic, structured AI response for any of the 11 frameworks
 * acting as the Self-LLM backend responder.
 */
function buildAgentSelfLlmResponse(
  framework: PromptTypeDefinition,
  userText: string
) {
  const isXml = framework.id === 'xml-structured';

  const anatomy = framework.blocks.map((block) => ({
    blockKey: block.key,
    blockLabel: block.label,
    content: `[${framework.name} — ${block.label}] Elaborazione strutturata per "${userText.slice(
      0,
      60
    )}": applicazione di ${block.description.toLowerCase()}`,
  }));

  const finalPrompt = isXml
    ? anatomy
        .map(
          (b) =>
            `${b.blockKey}\n${b.content}\n${b.blockKey.replace('<', '</')}`
        )
        .join('\n\n')
    : anatomy
        .map((b) => `[${b.blockKey} — ${b.blockLabel.toUpperCase()}]\n${b.content}`)
        .join('\n\n');

  const whyItWorks = [
    `Applica la struttura "${framework.name}" (${framework.acronym}) eliminando le ambiguità del testo libero iniziale.`,
    `Esplicita tutti i ${framework.blocks.length} blocchi fondamentali (${framework.blocks
      .map((b) => b.label)
      .join(', ')}).`,
    `Ancora la generazione alle peculiarità del metodo: ${framework.peculiarities}`,
  ];

  return {
    finalPrompt,
    anatomy,
    whyItWorks,
  };
}

describe('5. Test Funzionali End-to-End (Full-Stack HTTP + Self-LLM Backend su tutte le 11 Tipologie)', () => {
  let selfLlmServer: http.Server;
  let appServerOpenRouter: http.Server;
  let appServerOllama: http.Server;
  let openRouterAppUrl = '';
  let ollamaAppUrl = '';

  beforeAll(async () => {
    // Server HTTP locale che emula sia OpenRouter (/v1/chat/completions) sia Ollama (/api/chat)
    // rispondendo con il motore Self-LLM dell'Agente
    selfLlmServer = http.createServer(async (req, res) => {
      let rawBody = '';
      for await (const chunk of req) {
        rawBody += chunk;
      }

      if (
        req.method === 'POST' &&
        (req.url === '/v1/chat/completions' || req.url === '/api/chat')
      ) {
        const parsed = JSON.parse(rawBody) as {
          model: string;
          messages: Array<{ role: string; content: string }>;
        };

        const userMessage =
          parsed.messages.find((m) => m.role === 'user')?.content || '';

        const matchedFramework =
          PROMPT_TYPES.find((fw) => userMessage.includes(`(${fw.id})`)) ??
          PROMPT_TYPES[0];

        const llmOutput = buildAgentSelfLlmResponse(
          matchedFramework,
          userMessage
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        if (req.url === '/v1/chat/completions') {
          res.end(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify(llmOutput),
                  },
                },
              ],
            })
          );
        } else {
          // Formato Ollama /api/chat
          res.end(
            JSON.stringify({
              message: {
                role: 'assistant',
                content: `\`\`\`json\n${JSON.stringify(llmOutput, null, 2)}\n\`\`\``,
              },
            })
          );
        }
        return;
      }

      res.writeHead(404);
      res.end();
    });

    await new Promise<void>((resolve) =>
      selfLlmServer.listen(0, '127.0.0.1', resolve)
    );
    const llmAddr = selfLlmServer.address();
    if (!llmAddr || typeof llmAddr === 'string') {
      throw new Error('Impossibile avviare selfLlmServer');
    }
    const llmBase = `http://127.0.0.1:${llmAddr.port}`;

    const appOr = createApp(undefined, {
      LLM_PROVIDER: 'openrouter',
      OPENROUTER_API_KEY: 'sk-or-v1-self-agent-key',
      OPENROUTER_MODEL: 'antigravity/self-llm',
      OPENROUTER_BASE_URL: `${llmBase}/v1/chat/completions`,
    });
    appServerOpenRouter = http.createServer(appOr);
    await new Promise<void>((resolve) =>
      appServerOpenRouter.listen(0, '127.0.0.1', resolve)
    );
    const orAddr = appServerOpenRouter.address();
    if (!orAddr || typeof orAddr === 'string') {
      throw new Error('Impossibile avviare appServerOpenRouter');
    }
    openRouterAppUrl = `http://127.0.0.1:${orAddr.port}`;

    const appOl = createApp(undefined, {
      LLM_PROVIDER: 'ollama',
      OLLAMA_BASE_URL: llmBase,
      OLLAMA_MODEL: 'self-llm:latest',
    });
    appServerOllama = http.createServer(appOl);
    await new Promise<void>((resolve) =>
      appServerOllama.listen(0, '127.0.0.1', resolve)
    );
    const olAddr = appServerOllama.address();
    if (!olAddr || typeof olAddr === 'string') {
      throw new Error('Impossibile avviare appServerOllama');
    }
    ollamaAppUrl = `http://127.0.0.1:${olAddr.port}`;
  });

  afterAll(async () => {
    await Promise.all([
      new Promise<void>((resolve) => appServerOpenRouter.close(() => resolve())),
      new Promise<void>((resolve) => appServerOllama.close(() => resolve())),
      new Promise<void>((resolve) => selfLlmServer.close(() => resolve())),
    ]);
  });

  it('verifica il ciclo completo E2E su tutte le 11 tipologie di prompt tramite provider OpenRouter', async () => {
    const healthRes = await fetch(`${openRouterAppUrl}/api/health`);
    const health = (await healthRes.json()) as HealthResponse;
    expect(health.configured).toBe(true);
    expect(health.provider).toBe('openrouter');

    for (const fw of PROMPT_TYPES) {
      const response = await fetch(`${openRouterAppUrl}/api/build-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameworkId: fw.id,
          userText: fw.exampleBefore,
        }),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as BuildPromptResponse;
      expect(data.frameworkId).toBe(fw.id);
      expect(data.frameworkName).toBe(fw.name);
      expect(data.providerUsed).toBe('openrouter');
      expect(data.modelUsed).toBe('antigravity/self-llm');
      expect(data.anatomy).toHaveLength(fw.blocks.length);
      expect(data.finalPrompt.length).toBeGreaterThan(50);
      expect(data.whyItWorks.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('verifica il ciclo completo E2E anche tramite provider Ollama con output JSON fenced', async () => {
    const healthRes = await fetch(`${ollamaAppUrl}/api/health`);
    const health = (await healthRes.json()) as HealthResponse;
    expect(health.configured).toBe(true);
    expect(health.provider).toBe('ollama');

    const response = await fetch(`${ollamaAppUrl}/api/build-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frameworkId: 'tree-of-thoughts',
        userText:
          'Dobbiamo scegliere l’architettura per un sistema di notifiche real-time con 25.000 utenti connessi.',
      }),
    });

    expect(response.status).toBe(200);
    const data = (await response.json()) as BuildPromptResponse;
    expect(data.frameworkId).toBe('tree-of-thoughts');
    expect(data.providerUsed).toBe('ollama');
    expect(data.anatomy).toHaveLength(4);
    expect(data.whyItWorks).toHaveLength(3);
  });
});
