/** Chrome Built-in AI (Prompt API) によるAI分析コメント生成 */

import type { AggResult } from "./aggregate";
import type { LayoutMeta } from "./layout";

// --- Chrome Prompt API 型宣言 ---

declare global {
  interface LanguageModelCreateOptions {
    systemPrompt?: string;
    expectedInputLanguages?: string[];
    expectedOutputLanguages?: string[];
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

const SYSTEM_PROMPT =
  "あなたはアンケート分析の専門家です。回答は必ず日本語で2〜3文以内にしてください。";

const MAX_PAYLOAD_CHARS = 3500;

function resolveQLabel(col: string, meta?: LayoutMeta): string {
  return meta?.questionLabels[col] ?? col;
}

function resolveVLabel(
  type: "SA" | "MA",
  col: string,
  code: string,
  meta?: LayoutMeta,
): string {
  if (!meta) return code;
  if (type === "SA") return meta.valueLabels[col]?.[code] ?? code;
  return meta.valueLabels[code]?.["1"] ?? code;
}

function summarizeResults(
  results: AggResult[],
  weightCol: string,
  layoutMeta: LayoutMeta | undefined,
  topN: number,
): string {
  const lines: string[] = [];
  if (weightCol) lines.push(`※ウェイト列: ${weightCol}`);

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
    if (rest > 0) items.push(`...他${rest}件`);
    lines.push("  " + items.join(", "));
  }

  lines.push("");
  lines.push("上記の集計結果の注目すべき傾向を2〜3文で短く述べてください。箇条書き・見出し・提案・注意点は不要です。");
  return lines.join("\n");
}

export function buildPromptPayload(
  results: AggResult[],
  weightCol: string,
  layoutMeta?: LayoutMeta,
): string {
  for (const topN of [5, 3, 2]) {
    const text = summarizeResults(results, weightCol, layoutMeta, topN);
    if (text.length <= MAX_PAYLOAD_CHARS) return text;
  }
  return summarizeResults(
    results.slice(0, 20),
    weightCol,
    layoutMeta,
    2,
  );
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

    const payload = buildPromptPayload(results, weightCol, layoutMeta);
    const session = await LanguageModel!.create({
      systemPrompt: SYSTEM_PROMPT,
      expectedInputLanguages: ["ja"],
      expectedOutputLanguages: ["ja"],
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
