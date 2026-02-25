/** AI analysis comment generation via Chrome Built-in AI (Prompt API) */

import type { AggResult } from "./aggregate";
import type { LayoutMeta } from "./layout";
import { getLocale } from "./i18n";

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

// --- Feature Detection ---

export async function isAIAvailable(): Promise<boolean> {
  try {
    if (typeof LanguageModel === "undefined") return false;
    const status = await LanguageModel.availability();
    return status !== "no";
  } catch {
    return false;
  }
}

// --- Prompt Payload ---

const SYSTEM_PROMPTS: Record<string, string> = {
  ja: "あなたはアンケート分析の専門家です。回答は必ず日本語で2〜3文以内にしてください。",
  en: "You are a survey analysis expert. Keep your response to 2-3 sentences in English.",
};

const USER_PROMPTS: Record<string, string> = {
  ja: "上記の集計結果の注目すべき傾向を2〜3文で短く述べてください。箇条書き・見出し・提案・注意点は不要です。",
  en: "Briefly describe notable trends in the aggregation results above in 2-3 sentences. No bullet points, headings, suggestions, or caveats.",
};

const MAX_PAYLOAD_CHARS = 3500;

function resolveQLabel(col: string, meta?: LayoutMeta): string {
  return meta?.questionLabels[col] ?? col;
}

function resolveVLabel(type: "SA" | "MA", col: string, code: string, meta?: LayoutMeta): string {
  if (!meta) return code;
  if (type === "SA") return meta.valueLabels[col]?.[code] ?? code;
  return meta.valueLabels[code]?.["1"] ?? code;
}

function summarizeResults(
  results: AggResult[],
  weightCol: string,
  layoutMeta: LayoutMeta | undefined,
  topN: number,
  locale: string,
): string {
  const lines: string[] = [];
  if (weightCol) {
    lines.push(locale === "ja" ? `※ウェイト列: ${weightCol}` : `* Weight column: ${weightCol}`);
  }

  for (const res of results) {
    const gtCells = res.cells.filter((c) => c.sub === "GT");
    if (gtCells.length === 0) continue;

    const n = gtCells[0].n;
    const qLabel = resolveQLabel(res.question, layoutMeta);
    lines.push(`${res.question}: ${qLabel} (${res.type}, n=${n})`);

    const sorted = [...gtCells].sort((a, b) => b.pct - a.pct);
    const top = sorted.slice(0, topN);
    const items = top.map((c) => {
      const label = resolveVLabel(res.type, res.question, c.main, layoutMeta);
      return `${label}: ${c.pct.toFixed(1)}%`;
    });

    const rest = sorted.length - topN;
    if (rest > 0) items.push(locale === "ja" ? `...他${rest}件` : `...${rest} more`);
    lines.push("  " + items.join(", "));
  }

  lines.push("");
  lines.push(USER_PROMPTS[locale] ?? USER_PROMPTS["en"]);
  return lines.join("\n");
}

export function buildPromptPayload(
  results: AggResult[],
  weightCol: string,
  layoutMeta?: LayoutMeta,
): string {
  const locale = getLocale();
  for (const topN of [5, 3, 2]) {
    const text = summarizeResults(results, weightCol, layoutMeta, topN, locale);
    if (text.length <= MAX_PAYLOAD_CHARS) return text;
  }
  return summarizeResults(results.slice(0, 20), weightCol, layoutMeta, 2, locale);
}

// --- Comment Generation ---

export async function generateComment(
  results: AggResult[],
  weightCol: string,
  layoutMeta?: LayoutMeta,
): Promise<string | null> {
  try {
    if (results.length === 0) return null;
    if (!(await isAIAvailable())) return null;

    const locale = getLocale();
    const payload = buildPromptPayload(results, weightCol, layoutMeta);
    const session = await LanguageModel!.create({
      systemPrompt: SYSTEM_PROMPTS[locale] ?? SYSTEM_PROMPTS["en"],
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
