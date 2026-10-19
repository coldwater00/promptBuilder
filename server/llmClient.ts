import dotenv from 'dotenv';
import {
  GeneratedAnatomyBlock,
  PromptTypeDefinition,
} from '../shared/promptTypes.js';
import { buildMetaPrompt } from './metaPromptBuilder.js';
import { appendLlmLog } from './llmLogger.js';

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
  if (env === process.env && !env.VITEST) {
    dotenv.config({ override: true });
  }
  const rawProvider = (env.LLM_PROVIDER || 'openrouter').trim().toLowerCase();
  const provider: LlmProvider = rawProvider === 'ollama' ? 'ollama' : 'openrouter';

  const openRouterApiKey = (env.OPENROUTER_API_KEY || '').trim();
  const openRouterModel = (
    env.OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free'
  ).trim();
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
 * Scans a string and returns all balanced top-level `{ ... }` JSON object substrings,
 * properly ignoring braces that appear inside quoted JSON strings.
 */
function findBalancedJsonObjects(text: string): string[] {
  const results: string[] = [];
  let depth = 0;
  let startIndex = -1;
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (ch === '\\') {
        isEscaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      if (depth > 0) {
        inString = true;
      }
      continue;
    }

    if (ch === '{') {
      if (depth === 0) {
        startIndex = i;
      }
      depth++;
    } else if (ch === '}') {
      if (depth > 0) {
        depth--;
        if (depth === 0 && startIndex !== -1) {
          results.push(text.slice(startIndex, i + 1));
          startIndex = -1;
        }
      }
    }
  }

  return results;
}

/**
 * Escapes raw unescaped control characters (like literal newlines or tabs)
 * that some LLMs emit directly inside JSON string literals.
 */
function escapeControlCharsInJsonStrings(jsonCandidate: string): string {
  let out = '';
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < jsonCandidate.length; i++) {
    const ch = jsonCandidate[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        out += ch;
      } else if (ch === '\\') {
        isEscaped = true;
        out += ch;
      } else if (ch === '"') {
        inString = false;
        out += ch;
      } else if (ch === '\n') {
        out += '\\n';
      } else if (ch === '\r') {
        out += '\\r';
      } else if (ch === '\t') {
        out += '\\t';
      } else {
        out += ch;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    }
    out += ch;
  }

  return out;
}

function tryParseJsonCandidate(candidate: string): unknown | undefined {
  try {
    return JSON.parse(candidate);
  } catch {
    try {
      return JSON.parse(escapeControlCharsInJsonStrings(candidate));
    } catch {
      return undefined;
    }
  }
}

/**
 * Extracts and parses a JSON object from raw LLM output, handling:
 * - Raw JSON strings (including JSON whose string values contain inner ``` code fences)
 * - Outer Markdown code fences (```json ... ``` or ``` ... ```)
 * - Optional <think>...</think> or leading ... </think> blocks
 * - Multiple {...} blocks in prose before/after the target payload
 */
export function extractJsonFromText(rawContent: string): unknown {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('Risposta LLM vuota o non valida.');
  }

  // 1. Remove <think>...</think> blocks or orphaned leading ... </think> preambles
  let cleaned = rawContent
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^[\s\S]*?<\/think>/i, '')
    .trim();

  // 2. Direct parse attempt first (critical when response is already valid JSON
  //    but contains inner ``` code blocks inside finalPrompt/anatomy strings)
  const directParsed = tryParseJsonCandidate(cleaned);
  if (directParsed && typeof directParsed === 'object' && !Array.isArray(directParsed)) {
    return directParsed;
  }

  // 3. If wrapped in outer Markdown code fences, strip outer fences greedily
  if (cleaned.startsWith('```')) {
    const outerFenceMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*)\s*```$/i);
    if (outerFenceMatch && outerFenceMatch[1]) {
      const inner = outerFenceMatch[1].trim();
      const fenceParsed = tryParseJsonCandidate(inner);
      if (fenceParsed && typeof fenceParsed === 'object' && !Array.isArray(fenceParsed)) {
        return fenceParsed;
      }
      cleaned = inner;
    }
  }

  // 4. Scan for balanced {...} JSON objects and prefer the one matching our contract
  const candidates = findBalancedJsonObjects(cleaned);
  let fallbackObject: Record<string, unknown> | undefined;

  for (const candidate of candidates) {
    const parsed = tryParseJsonCandidate(candidate);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      if ('finalPrompt' in obj || 'anatomy' in obj || 'whyItWorks' in obj) {
        return obj;
      }
      if (!fallbackObject) {
        fallbackObject = obj;
      }
    }
  }

  if (fallbackObject) {
    return fallbackObject;
  }

  throw new Error('La risposta del modello non contiene un oggetto JSON valido.');
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
  const startTime = Date.now();

  if (config.provider === 'openrouter') {
    if (!config.configured || !config.openRouterApiKey) {
      throw new Error(
        'OPENROUTER_API_KEY non configurata. Imposta una chiave valida nel file .env oppure imposta LLM_PROVIDER=ollama.'
      );
    }

    const requestPayload = {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    };

    appendLlmLog(
      {
        event: 'LLM_REQUEST',
        provider: 'openrouter',
        model: config.model,
        frameworkId: framework.id,
        endpoint: config.openRouterBaseUrl,
        payload: requestPayload,
      },
      env
    );

    const response = await fetchImpl(config.openRouterBaseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'PromptBuilder Stateless App',
      },
      body: JSON.stringify(requestPayload),
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      appendLlmLog(
        {
          event: 'LLM_ERROR',
          provider: 'openrouter',
          model: config.model,
          frameworkId: framework.id,
          endpoint: config.openRouterBaseUrl,
          statusCode: response.status,
          durationMs,
          error: errorBody || response.statusText,
        },
        env
      );
      throw new Error(
        `Errore OpenRouter (${response.status}): ${errorBody || response.statusText}`
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    appendLlmLog(
      {
        event: 'LLM_RESPONSE_RAW',
        provider: 'openrouter',
        model: config.model,
        frameworkId: framework.id,
        endpoint: config.openRouterBaseUrl,
        statusCode: response.status ?? 200,
        durationMs,
        payload: data,
      },
      env
    );

    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenRouter ha restituito una risposta priva di contenuto.');
    }

    try {
      const parsed = parseLlmJsonOutput(rawContent, framework);
      appendLlmLog(
        {
          event: 'LLM_PARSED_SUCCESS',
          provider: 'openrouter',
          model: config.model,
          frameworkId: framework.id,
          durationMs,
          payload: parsed,
        },
        env
      );
      return {
        ...parsed,
        providerUsed: 'openrouter',
        modelUsed: config.model,
      };
    } catch (parseErr) {
      appendLlmLog(
        {
          event: 'LLM_ERROR',
          provider: 'openrouter',
          model: config.model,
          frameworkId: framework.id,
          durationMs,
          error: (parseErr as Error).message,
          payload: { rawContent },
        },
        env
      );
      throw parseErr;
    }
  }

  // Provider: Ollama (compatibile sia con runner GGUF sia con runner MLX come qwen3.6:35b-a3b-coding-nvfp4)
  const ollamaEndpoint = `${config.ollamaBaseUrl}/api/chat`;
  const ollamaPayload = {
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
  };

  appendLlmLog(
    {
      event: 'LLM_REQUEST',
      provider: 'ollama',
      model: config.model,
      frameworkId: framework.id,
      endpoint: ollamaEndpoint,
      payload: ollamaPayload,
    },
    env
  );

  const response = await fetchImpl(ollamaEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ollamaPayload),
  });

  const durationMs = Date.now() - startTime;

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    appendLlmLog(
      {
        event: 'LLM_ERROR',
        provider: 'ollama',
        model: config.model,
        frameworkId: framework.id,
        endpoint: ollamaEndpoint,
        statusCode: response.status,
        durationMs,
        error: errorBody || response.statusText,
      },
      env
    );
    throw new Error(
      `Errore Ollama (${response.status}): ${errorBody || response.statusText}`
    );
  }

  const data = (await response.json()) as {
    message?: { content?: string };
  };

  appendLlmLog(
    {
      event: 'LLM_RESPONSE_RAW',
      provider: 'ollama',
      model: config.model,
      frameworkId: framework.id,
      endpoint: ollamaEndpoint,
      statusCode: response.status ?? 200,
      durationMs,
      payload: data,
    },
    env
  );

  const rawContent = data.message?.content;
  if (!rawContent) {
    throw new Error('Ollama ha restituito una risposta priva di contenuto.');
  }

  try {
    const parsed = parseLlmJsonOutput(rawContent, framework);
    appendLlmLog(
      {
        event: 'LLM_PARSED_SUCCESS',
        provider: 'ollama',
        model: config.model,
        frameworkId: framework.id,
        durationMs,
        payload: parsed,
      },
      env
    );
    return {
      ...parsed,
      providerUsed: 'ollama',
      modelUsed: config.model,
    };
  } catch (parseErr) {
    appendLlmLog(
      {
        event: 'LLM_ERROR',
        provider: 'ollama',
        model: config.model,
        frameworkId: framework.id,
        durationMs,
        error: (parseErr as Error).message,
        payload: { rawContent },
      },
      env
    );
    throw parseErr;
  }
}
