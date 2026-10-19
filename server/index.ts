import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import {
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

dotenv.config();

const MIN_USER_TEXT_LENGTH = 5;
const MAX_USER_TEXT_LENGTH = 8000;

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

  app.get('/api/frameworks', (_req: Request, res: Response) => {
    res.json({ frameworks: PROMPT_TYPES });
  });

  app.post('/api/build-prompt', async (req: Request, res: Response) => {
    try {
      const body = req.body as Partial<BuildPromptRequest> | undefined;
      const frameworkId =
        typeof body?.frameworkId === 'string' ? body.frameworkId.trim() : '';
      const rawUserText =
        typeof body?.userText === 'string' ? body.userText.trim() : '';

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
    console.log(
      `[PromptBuilder Server] Listening on http://localhost:${port} | provider=${cfg.provider} | model=${cfg.model} | configured=${cfg.configured}`
    );
  });
}
