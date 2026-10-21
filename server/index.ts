import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import {
  AuthStatusResponse,
  AuthVerifyRequest,
  AuthVerifyResponse,
  BuildPromptRequest,
  BuildPromptResponse,
  getPromptTypeById,
  HealthResponse,
  PROMPT_TYPES,
} from '../shared/promptTypes.js';
import {
  generateStructuredPrompt,
  GeneratePromptResult,
  getLlmConfig,
} from './llmClient.js';
import {
  appendLlmLog,
  getLogFilePath,
  isLlmLogEnabled,
} from './llmLogger.js';

dotenv.config();

const MIN_USER_TEXT_LENGTH = 5;
const MAX_USER_TEXT_LENGTH = 8000;

export function getExpectedPassphrase(env: NodeJS.ProcessEnv = process.env): string {
  return typeof env.APP_PASSPHRASE === 'string' ? env.APP_PASSPHRASE.trim() : '';
}

export function isPassphraseValid(candidate: string, expected: string): boolean {
  if (!expected) return true;
  if (!candidate) return false;
  const candidateHash = crypto.createHash('sha256').update(candidate, 'utf8').digest();
  const expectedHash = crypto.createHash('sha256').update(expected, 'utf8').digest();
  return crypto.timingSafeEqual(candidateHash, expectedHash);
}

export type PromptGeneratorFn = (
  framework: NonNullable<ReturnType<typeof getPromptTypeById>>,
  userText: string
) => Promise<GeneratePromptResult>;

export function createApp(
  customGenerator?: PromptGeneratorFn,
  env: NodeJS.ProcessEnv = process.env
) {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req: Request, res: Response<HealthResponse>) => {
    const config = getLlmConfig(env);
    res.json({
      status: 'ok',
      provider: config.provider,
      model: config.model,
      configured: config.configured,
    });
  });

  app.get('/api/auth/status', (_req: Request, res: Response<AuthStatusResponse>) => {
    const expected = getExpectedPassphrase(env);
    res.json({
      authRequired: expected.length > 0,
    });
  });

  app.post('/api/auth/verify', (req: Request, res: Response<AuthVerifyResponse>) => {
    const expected = getExpectedPassphrase(env);
    if (!expected) {
      res.json({ authenticated: true });
      return;
    }

    const body = req.body as Partial<AuthVerifyRequest> | undefined;
    const candidate = typeof body?.passphrase === 'string' ? body.passphrase.trim() : '';

    if (isPassphraseValid(candidate, expected)) {
      res.json({ authenticated: true });
      return;
    }

    res.status(401).json({
      authenticated: false,
      error: 'Passphrase non valida. Verifica la parola chiave e riprova.',
    });
  });

  app.get('/api/frameworks', (_req: Request, res: Response) => {
    res.json({ frameworks: PROMPT_TYPES });
  });

  app.post('/api/build-prompt', async (req: Request, res: Response) => {
    try {
      const body = req.body as Partial<BuildPromptRequest> | undefined;
      const expectedPassphrase = getExpectedPassphrase(env);

      if (expectedPassphrase) {
        const headerPassphrase =
          typeof req.headers['x-app-passphrase'] === 'string'
            ? req.headers['x-app-passphrase'].trim()
            : '';
        const bodyPassphrase =
          typeof body?.passphrase === 'string' ? body.passphrase.trim() : '';
        const providedPassphrase = headerPassphrase || bodyPassphrase;

        if (!isPassphraseValid(providedPassphrase, expectedPassphrase)) {
          res.status(401).json({
            error: 'Accesso non autorizzato: passphrase mancante o non valida.',
          });
          return;
        }
      }

      const frameworkId =
        typeof body?.frameworkId === 'string' ? body.frameworkId.trim() : '';
      const rawUserText =
        typeof body?.userText === 'string' ? body.userText.trim() : '';

      const cfg = getLlmConfig(env);
      appendLlmLog(
        {
          event: 'API_BUILD_PROMPT_REQUEST',
          provider: cfg.provider,
          model: cfg.model,
          frameworkId,
          payload: { frameworkId, userText: rawUserText },
        },
        env
      );

      if (!frameworkId) {
        res.status(400).json({
          error: 'Parametro "frameworkId" mancante. Seleziona una tipologia di prompt.',
        });
        return;
      }

      const framework = getPromptTypeById(frameworkId);
      if (!framework) {
        res.status(400).json({
          error: `Tipologia di prompt "${frameworkId}" non riconosciuta nel catalogo.`,
        });
        return;
      }

      if (!rawUserText || rawUserText.length < MIN_USER_TEXT_LENGTH) {
        res.status(400).json({
          error: `Inserisci una descrizione più dettagliata (almeno ${MIN_USER_TEXT_LENGTH} caratteri).`,
        });
        return;
      }

      if (rawUserText.length > MAX_USER_TEXT_LENGTH) {
        res.status(400).json({
          error: `Il testo inserito supera il limite massimo consentito di ${MAX_USER_TEXT_LENGTH} caratteri.`,
        });
        return;
      }

      const generator: PromptGeneratorFn =
        customGenerator ??
        ((fw, text) => generateStructuredPrompt(fw, text, env));

      const generated = await generator(framework, rawUserText);

      const responsePayload: BuildPromptResponse = {
        frameworkId: framework.id,
        frameworkName: framework.name,
        finalPrompt: generated.finalPrompt,
        anatomy: generated.anatomy,
        whyItWorks: generated.whyItWorks,
        providerUsed: generated.providerUsed,
        modelUsed: generated.modelUsed,
      };

      res.json(responsePayload);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Errore imprevisto durante la generazione del prompt.';
      res.status(502).json({ error: message });
    }
  });

  // Serve built static frontend in production if dist/client exists
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientDistPath = path.resolve(__dirname, '../dist/client');
  if (process.env.NODE_ENV === 'production' && fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  return app;
}

// Start server if invoked directly
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  const port = Number(process.env.PORT) || 3002;
  const app = createApp();
  app.listen(port, () => {
    const cfg = getLlmConfig();
    const logStatus = isLlmLogEnabled() ? getLogFilePath() : 'disabled';
    console.log(
      `[PromptBuilder Server] Listening on http://localhost:${port} | provider=${cfg.provider} | model=${cfg.model} | configured=${cfg.configured} | log=${logStatus}`
    );
  });
}
