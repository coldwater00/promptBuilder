import { PromptTypeDefinition } from '../shared/promptTypes.js';

export interface MetaPromptMessages {
  systemPrompt: string;
  userPrompt: string;
}

export function buildMetaPrompt(
  framework: PromptTypeDefinition,
  userText: string
): MetaPromptMessages {
  const blocksSpec = framework.blocks
    .map(
      (b, idx) =>
        `${idx + 1}. blockKey: "${b.key}" | blockLabel: "${b.label}" — ${b.description}`
    )
    .join('\n');

  const isXml = framework.id === 'xml-structured';

  const formattingHint = isXml
    ? 'Usa rigorosamente i tag XML di apertura e chiusura corrispondenti ai blocchi (<role>...</role>, <context>...</context>, <instructions>...</instructions>, <constraints>...</constraints>, <input_data>...</input_data>, <output_contract>...</output_contract>) per comporre `finalPrompt`.'
    : 'Formatta `finalPrompt` con sezioni chiare, leggibili e ben distinte (es. intestazioni `[BLOCCO]` o `### Blocco`) corrispondenti a tutti i blocchi della metodologia scelta.';

  const systemPrompt = `Sei un Principal Prompt Engineer ed esperto di architetture cognitive per Large Language Models.
Il tuo compito è trasformare l'idea grezza dell'utente in un prompt professionale, strutturato, completo e pronto per la produzione, applicando rigorosamente la metodologia "${framework.name}" (${framework.acronym}).

DETTAGLI DELLA METODOLOGIA SCELTA:
- Nome: ${framework.name}
- Famiglia: ${framework.family}
- Fondamento teorico: ${framework.basedOn}
- Particolarità d'uso: ${framework.peculiarities}

BLOCCHI STRUTTURALI OBBLIGATORI (${framework.blocks.length} blocchi):
${blocksSpec}

REGOLE DI INGEGNERIZZAZIONE DEL PROMPT:
1. Mantieni la stessa lingua del testo grezzo dell'utente per il contenuto del prompt generato (\`finalPrompt\` e \`anatomy\`), arricchendolo con terminologia tecnica appropriata.
2. Deduci in modo intelligente i dettagli impliciti mancanti nel testo grezzo (es. ruolo esperto ideale, vincoli qualitativi, edge case da prevenire, struttura dell'output), senza snaturare l'obiettivo originale dell'utente.
3. ${formattingHint}
4. Compila l'array \`anatomy\` includendo ESATTAMENTE tutti i ${framework.blocks.length} blocchi nell'ordine specificato sopra, usando gli stessi \`blockKey\` e \`blockLabel\`.
5. Compila l'array \`whyItWorks\` con 3 o 4 punti sintetici in italiano che spiegano concretamente quali ambiguità del testo grezzo sono state eliminate e perché questa struttura produce un output superiore.

CONTRATTO DI OUTPUT (SOLO JSON VALIDO):
Rispondi ESCLUSIVAMENTE con un oggetto JSON valido (senza testo prima o dopo e senza commenti) conforme a questo schema esatto:
{
  "finalPrompt": "Il prompt completo, formattato e pronto da copiare e incollare nell'LLM...",
  "anatomy": [
${framework.blocks
  .map(
    (b) =>
      `    { "blockKey": ${JSON.stringify(b.key)}, "blockLabel": ${JSON.stringify(b.label)}, "content": "Contenuto specifico elaborato per questo blocco..." }`
  )
  .join(',\n')}
  ],
  "whyItWorks": [
    "Spiegazione 1 del miglioramento strutturale...",
    "Spiegazione 2...",
    "Spiegazione 3..."
  ]
}`;

  const userPrompt = `Trasforma la seguente richiesta grezza dell'utente in un prompt strutturato secondo il framework "${framework.name}" (${framework.id}).

TESTO GREZZO DELL'UTENTE:
"""
${userText.trim()}
"""

Restituisci esclusivamente l'oggetto JSON richiesto con le chiavi "finalPrompt", "anatomy" (${framework.blocks.length} blocchi) e "whyItWorks" (3-4 punti).`;

  return {
    systemPrompt,
    userPrompt,
  };
}
