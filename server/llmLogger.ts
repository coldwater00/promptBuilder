import fs from 'node:fs';
import path from 'node:path';

export interface LlmLogEntry {
  timestamp: string;
  event:
    | 'API_BUILD_PROMPT_REQUEST'
    | 'LLM_REQUEST'
    | 'LLM_RESPONSE_RAW'
    | 'LLM_PARSED_SUCCESS'
    | 'LLM_ERROR';
  provider?: string;
  model?: string;
  frameworkId?: string;
  endpoint?: string;
  statusCode?: number;
  durationMs?: number;
  payload?: unknown;
  error?: string;
}

export function isLlmLogEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if ((env.VITEST || env.VERCEL) && !env.LLM_LOG_ENABLED) {
    return false;
  }
  const raw = (env.LLM_LOG_ENABLED ?? 'true').trim().toLowerCase();
  return !['false', '0', 'no', 'off'].includes(raw);
}

export function getLogFilePath(env: NodeJS.ProcessEnv = process.env): string {
  const configuredPath = (env.LLM_LOG_FILE || 'llm-calls.log').trim();
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
}

export function appendLlmLog(
  entry: Omit<LlmLogEntry, 'timestamp'>,
  env: NodeJS.ProcessEnv = process.env
): void {
  if (!isLlmLogEnabled(env)) {
    return;
  }

  try {
    const filePath = getLogFilePath(env);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const fullEntry: LlmLogEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };

    const separator = '─'.repeat(80);
    const formatted = `[${fullEntry.timestamp}] [${fullEntry.event}]${
      fullEntry.provider ? ` provider=${fullEntry.provider}` : ''
    }${fullEntry.model ? ` model=${fullEntry.model}` : ''}${
      fullEntry.frameworkId ? ` framework=${fullEntry.frameworkId}` : ''
    }${fullEntry.statusCode !== undefined ? ` status=${fullEntry.statusCode}` : ''}${
      fullEntry.durationMs !== undefined ? ` duration=${fullEntry.durationMs}ms` : ''
    }\n${JSON.stringify(fullEntry, null, 2)}\n${separator}\n`;

    fs.appendFileSync(filePath, formatted, 'utf8');
  } catch (err) {
    console.error('[LlmLogger] Impossibile scrivere sul file di log:', err);
  }
}
