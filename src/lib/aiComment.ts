/** AI analysis comment generation via Chrome Built-in AI (Prompt API) */

import type { Question, Tally } from "./agg/types";
import { NA_VALUE } from "./agg/sqlHelpers";
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
  tallies: Tally[],
  weightCol: string,
  questions: Question[],
): string {
  for (const topN of [5, 3, 2]) {
    const text = summarizeResults(tallies, weightCol, questions, topN);
    if (text.length <= MAX_PAYLOAD_CHARS) return text;
  }
  return summarizeResults(tallies.slice(0, 20), weightCol, questions, 2);
}

export async function generateComment(
  tallies: Tally[],
  weightCol: string,
  questions: Question[],
): Promise<string | null> {
  try {
    if (tallies.length === 0) return null;

    const locale = getLocale();
    const payload = buildPromptPayload(tallies, weightCol, questions);
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
  tallies: Tally[],
  weightCol: string,
  questions: Question[],
  topN: number,
): string {
  const lines: string[] = [];
  if (weightCol) {
    lines.push(t("ai.weight", { col: weightCol }));
  }

  // Only use GT tallies
  const gtTallies = tallies.filter((t) => t.by === "GT");

  for (const tally of gtTallies) {
    const question = questions.find((q) => q.code === tally.question);
    const slice = tally.slices[0];
    if (!slice || tally.codes.length === 0) continue;

    const qLabel = question?.label ?? tally.question;
    lines.push(`${tally.question}: ${qLabel} (${tally.type}, n=${slice.n})`);

    const withPct = tally.codes.map((code, i) => ({
      code,
      pct: slice.cells[i]?.pct ?? 0,
    }));
    const sorted = [...withPct].sort((a, b) => b.pct - a.pct);
    const top = sorted.slice(0, topN);
    const items = top.map((c) => {
      const label = c.code === NA_VALUE ? t("label.na") : (question?.labels[c.code] ?? c.code);
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
