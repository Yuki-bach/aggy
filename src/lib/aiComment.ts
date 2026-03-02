/** AI analysis comment generation via Chrome Built-in AI (Prompt API) */

import type { AggResult } from "./agg/aggregate";
import type { LabelMap } from "./layout";
import { pivot } from "./agg/pivot";
import { resolveQuestionLabel, resolveValueLabel } from "./labels";
import { getLocale, t } from "./i18n";

// Chrome Prompt API type declarations

declare global {
  interface LanguageModelExpectedIO {
    type: string;
    languages?: string[];
  }
  interface LanguageModelCreateOptions {
    systemPrompt?: string;
    expectedInputs?: LanguageModelExpectedIO[];
    expectedOutputs?: LanguageModelExpectedIO[];
    monitor?: (monitor: EventTarget) => void;
  }
  interface LanguageModelStatic {
    availability(): Promise<string>;
    create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
  }
  interface LanguageModelSession {
    prompt(input: string): Promise<string>;
    destroy(): void;
  }
  // eslint-disable-next-line no-var
  var LanguageModel: LanguageModelStatic | undefined;
}

export function buildPromptPayload(
  results: AggResult[],
  weightCol: string,
  labelMap: LabelMap,
): string {
  for (const topN of [5, 3, 2]) {
    const text = summarizeResults(results, weightCol, labelMap, topN);
    if (text.length <= MAX_PAYLOAD_CHARS) return text;
  }
  return summarizeResults(results.slice(0, 20), weightCol, labelMap, 2);
}

export async function generateComment(
  results: AggResult[],
  weightCol: string,
  labelMap: LabelMap,
): Promise<string | null> {
  try {
    if (results.length === 0) return null;

    const locale = getLocale();
    const payload = buildPromptPayload(results, weightCol, labelMap);
    const session = await LanguageModel!.create({
      systemPrompt: t("ai.systemPrompt"),
      expectedInputs: [{ type: "text", languages: [locale] }],
      expectedOutputs: [{ type: "text", languages: [locale] }],
    });

    try {
      return await session.prompt(payload);
    } finally {
      session.destroy();
    }
  } catch {
    return null;
  }
}

// ─── Internal ───────────────────────────────────────────────

const MAX_PAYLOAD_CHARS = 3500;

function summarizeResults(
  results: AggResult[],
  weightCol: string,
  labelMap: LabelMap,
  topN: number,
): string {
  const lines: string[] = [];
  if (weightCol) {
    lines.push(t("ai.weight", { col: weightCol }));
  }

  for (const res of results) {
    const pv = pivot(res.cells, res.nBySubLabel);
    const gtN = res.nBySubLabel["GT"] ?? 0;
    if (pv.mains.length === 0) continue;

    const qLabel = resolveQuestionLabel(res.question, labelMap);
    lines.push(`${res.question}: ${qLabel} (${res.type}, n=${gtN})`);

    const withPct = pv.mains
      .map((m) => ({ main: m, pct: pv.lookup.get(`${m}\0GT`)?.pct ?? 0 }))
      .filter((e) => pv.lookup.has(`${e.main}\0GT`));
    const sorted = [...withPct].sort((a, b) => b.pct - a.pct);
    const top = sorted.slice(0, topN);
    const items = top.map((c) => {
      const label = resolveValueLabel(res.type, res.question, c.main, labelMap);
      return `${label}: ${c.pct.toFixed(1)}%`;
    });

    const rest = sorted.length - topN;
    if (rest > 0) items.push(t("ai.moreItems", { count: rest }));
    lines.push("  " + items.join(", "));
  }

  lines.push("");
  lines.push(t("ai.userPrompt"));
  return lines.join("\n");
}
