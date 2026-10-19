import {
  GeneratedAnatomyBlock,
  PromptTypeDefinition,
} from '../shared/promptTypes.js';
import { buildMetaPrompt } from './metaPromptBuilder.js';

export type LlmProvider = 'openrouter' | 'ollama';

export interface LlmConfig {
  provider: LlmProvider;
  model: string;
  configured: boolean;
  openRouterApiKey?: string;
  openRouterBaseUrl: string;
  ollamaBaseUrl: string;
}

export interface ParsedLlmResult {
  finalPrompt: string;
  anatomy: GeneratedAnatomyBlock[];
  whyItWorks: string[];
}

export interface GeneratePromptResult extends ParsedLlmResult {
  providerUsed: LlmProvider;
  modelUsed: string;
}

const PLACEHOLDER_KEY = 'sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx';

export function getLlmConfig(env: NodeJS.ProcessEnv = process.env): LlmConfig {
  const rawProvider = (env.LLM_PROVIDER || 'openrouter').trim().toLowerCase();
  const provider: LlmProvider = rawProvider === 'ollama' ? 'ollama' : 'openrouter';

  const openRouterApiKey = (env.OPENROUTER_API_KEY || '').trim();
  const openRouterModel = (env.OPENROUTER_MODEL || 'google/gemini-2.5-flash').trim();
  const openRouterBaseUrl = (
    env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions'
  ).trim();

  const ollamaBaseUrl = (env.OLLAMA_BASE_URL || 'http://localhost:11434')
    .trim()
    .replace(/\/+$/, '');
  const ollamaModel = (env.OLLAMA_MODEL || 'qwen3.6:35b-a3b-coding-nvfp4').trim();

  if (provider === 'ollama') {
    return {
      provider: 'ollama',
      model: ollamaModel,
      configured: Boolean(ollamaBaseUrl && ollamaModel),
      openRouterBaseUrl,
      ollamaBaseUrl,
    };
  }

  const isKeyConfigured =
    Boolean(openRouterApiKey) && openRouterApiKey !== PLACEHOLDER_KEY;

  return {
    provider: 'openrouter',
    model: openRouterModel,
    configured: isKeyConfigured,
    openRouterApiKey,
    openRouterBaseUrl,
    ollamaBaseUrl,
  };
}

/**
 * Extracts and parses a JSON object from raw LLM output, handling:
 * - Raw JSON strings
 * - Markdown code fences (```json ... ``` or ``` ... ```)
 * - Optional <think>...</think> blocks or surrounding prose
 */
export function extractJsonFromText(rawContent: string): unknown {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('Risposta LLM vuota o non valida.');
  }

  // Remove <think>...</think> blocks if present from reasoning models
  let cleaned = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Strip Markdown code fences if present
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  }

  // First attempt: direct JSON.parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // Second attempt: locate the outermost {...} object
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch (innerErr) {
        throw new Error(
          `Impossibile effettuare il parsing del JSON restituito dal modello: ${(innerErr as Error).message}`
        );
      }
    }
    throw new Error('La risposta del modello non contiene un oggetto JSON valido.');
  }
}

/**
 * Validates and normalizes the parsed JSON object against the 3-part contract
 * and the selected framework's blocks.
 */
export function parseLlmJsonOutput(
  rawContent: string,
  framework: PromptTypeDefinition
): ParsedLlmResult {
  const parsed = extractJsonFromText(rawContent);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Il payload JSON restituito non è un oggetto valido.');
  }

  const record = parsed as Record<string, unknown>;

  const rawFinalPrompt =
    typeof record.finalPrompt === 'string' ? record.finalPrompt.trim() : '';

  const rawAnatomy = Array.isArray(record.anatomy) ? record.anatomy : [];

  const normalizedAnatomy: GeneratedAnatomyBlock[] = framework.blocks.map(
    (blockDef, index) => {
      const matched =
        rawAnatomy.find((item) => {
          if (!item || typeof item !== 'object') return false;
          const obj = item as Record<string, unknown>;
          const key = String(obj.blockKey ?? obj.key ?? '').toLowerCase();
          const label = String(obj.blockLabel ?? obj.label ?? '').toLowerCase();
          return (
            key === blockDef.key.toLowerCase() ||
            label === blockDef.label.toLowerCase()
          );
        }) ?? rawAnatomy[index];

      let content = '';
      if (matched && typeof matched === 'object') {
        const obj = matched as Record<string, unknown>;
        if (typeof obj.content === 'string') {
          content = obj.content.trim();
        }
      }

      return {
        blockKey: blockDef.key,
        blockLabel: blockDef.label,
        content:
          content ||
          `Sezione ${blockDef.label} definita all'interno del prompt principale.`,
      };
    }
  );

  // If finalPrompt is missing, assemble it from anatomy blocks; otherwise use finalPrompt
  const finalPrompt =
    rawFinalPrompt ||
    normalizedAnatomy
      .map((b) => `[${b.blockLabel.toUpperCase()}]\n${b.content}`)
      .join('\n\n');

  if (!finalPrompt || !rawFinalPrompt) {
    throw new Error(
      'Il modello non ha restituito il campo obbligatorio "finalPrompt".'
    );
  }

  if (rawAnatomy.length === 0) {
    throw new Error(
      'Il modello non ha restituito il campo obbligatorio "anatomy".'
    );
  }

  const rawWhy = Array.isArray(record.whyItWorks)
    ? record.whyItWorks
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  if (rawWhy.length === 0) {
    throw new Error(
      'Il modello non ha restituito il campo obbligatorio "whyItWorks".'
    );
  }

  return {
    finalPrompt,
    anatomy: normalizedAnatomy,
    whyItWorks: rawWhy,
  };
}

export async function generateStructuredPrompt(
  framework: PromptTypeDefinition,
  userText: string,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch
): Promise<GeneratePromptResult> {
  const config = getLlmConfig(env);
  const { systemPrompt, userPrompt } = buildMetaPrompt(framework, userText);

  if (config.provider === 'openrouter') {
    if (!config.configured || !config.openRouterApiKey) {
      throw new Error(
        'OPENROUTER_API_KEY non configurata. Imposta una chiave valida nel file .env oppure imposta LLM_PROVIDER=ollama.'
      );
    }

    const response = await fetchImpl(config.openRouterBaseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'PromptBuilder Stateless App',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(
        `Errore OpenRouter (${response.status}): ${errorBody || response.statusText}`
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenRouter ha restituito una risposta priva di contenuto.');
    }

    const parsed = parseLlmJsonOutput(rawContent, framework);
    return {
      ...parsed,
      providerUsed: 'openrouter',
      modelUsed: config.model,
    };
  }

  // Provider: Ollama (compatibile sia con runner GGUF sia con runner MLX come qwen3.6:35b-a3b-coding-nvfp4)
  const ollamaEndpoint = `${config.ollamaBaseUrl}/api/chat`;
  const response = await fetchImpl(ollamaEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      think: false,
      stream: false,
      options: {
        temperature: 0.4,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `Errore Ollama (${response.status}): ${errorBody || response.statusText}`
    );
  }

  const data = (await response.json()) as {
    message?: { content?: string };
  };
  const rawContent = data.message?.content;
  if (!rawContent) {
    throw new Error('Ollama ha restituito una risposta priva di contenuto.');
  }

  const parsed = parseLlmJsonOutput(rawContent, framework);
  return {
    ...parsed,
    providerUsed: 'ollama',
    modelUsed: config.model,
  };
}
