/** AI analysis comment generation via Chrome Built-in AI (Prompt API) */

import type { Tab } from "./agg/types";
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

export function buildPromptPayload(tabs: Tab[], weightCol: string): string {
  for (const topN of [5, 3, 2]) {
    const text = summarizeResults(tabs, weightCol, topN);
    if (text.length <= MAX_PAYLOAD_CHARS) return text;
  }
  return summarizeResults(tabs.slice(0, 20), weightCol, 2);
}

export async function generateComment(tabs: Tab[], weightCol: string): Promise<string | null> {
  try {
    if (tabs.length === 0) return null;

    const locale = getLocale();
    const payload = buildPromptPayload(tabs, weightCol);
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

function summarizeResults(tabs: Tab[], weightCol: string, topN: number): string {
  const lines: string[] = [];
  if (weightCol) {
    lines.push(t("ai.weight", { col: weightCol }));
  }

  // Only use Tab (non-cross) results
  const tabOnly = tabs.filter((tab) => tab.by === null);

  for (const tab of tabOnly) {
    if (tab.type === "NA") {
      const stats = tab.slices[0].stats!;
      lines.push(`${tab.questionCode}: ${tab.label} (NA, n=${stats.n})`);
      lines.push(
        `  mean=${stats.mean?.toFixed(2) ?? "-"}, median=${stats.median?.toFixed(2) ?? "-"}, sd=${stats.sd?.toFixed(2) ?? "-"}`,
      );
      continue;
    }

    const slice = tab.slices[0];
    if (!slice || tab.codes.length === 0) continue;

    lines.push(`${tab.questionCode}: ${tab.label} (${tab.type}, n=${slice.n})`);

    const withPct = tab.codes.map((code, i) => ({
      code,
      pct: slice.cells[i]?.pct ?? 0,
    }));
    const sorted = [...withPct].sort((a, b) => b.pct - a.pct);
    const top = sorted.slice(0, topN);
    const items = top.map((c) => {
      const label = tab.labels[c.code];
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
