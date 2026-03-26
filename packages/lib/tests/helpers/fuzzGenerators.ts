import type { Layout } from "../../src/layout";
import { Rng } from "./generators";
import { buildCSV } from "./csv";

// ── Random primitives ───────────────────────────────────────────────

const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-. あいうえお";

export function fuzzString(rng: Rng, maxLen: number): string {
  const len = rng.int(0, maxLen);
  let s = "";
  for (let i = 0; i < len; i++) {
    s += CHARS[rng.int(0, CHARS.length - 1)];
  }
  return s;
}

function fuzzPrimitive(rng: Rng): unknown {
  const r = rng.next();
  if (r < 0.15) return null;
  if (r < 0.3) return rng.int(-100, 100);
  if (r < 0.45) return rng.next() < 0.5;
  if (r < 0.6) return undefined;
  if (r < 0.75) return [];
  return fuzzString(rng, 20);
}

// ── Layout fuzz ─────────────────────────────────────────────────────

const VALID_TYPES = ["SA", "MA", "NA", "WEIGHT", "DATE"];
const INVALID_TYPES = ["sa", "XX", "", "NUMERIC", "SELECT", "123", "null"];
const GRANULARITIES = ["year", "month", "week", "day"];

function fuzzItems(rng: Rng): unknown {
  const r = rng.next();
  // 不正値を返す確率
  if (r < 0.1) return undefined;
  if (r < 0.15) return "not-an-array";
  if (r < 0.2) return [];
  if (r < 0.25) return null;

  const len = rng.int(1, 8);
  const items: unknown[] = [];
  const usedCodes = new Set<string>();
  for (let i = 0; i < len; i++) {
    const roll = rng.next();
    if (roll < 0.1) {
      // 非オブジェクト要素
      items.push(fuzzPrimitive(rng));
    } else if (roll < 0.2) {
      // code/label 欠損
      items.push({ code: rng.int(1, 5) }); // code が数値
    } else {
      const code =
        rng.next() < 0.15 && usedCodes.size > 0
          ? [...usedCodes][0] // 重複 code
          : String(i + 1);
      usedCodes.add(code);
      items.push({ code, label: `Label${i + 1}` });
    }
  }
  return items;
}

/** Generate a single random layout entry (may be invalid). */
export function fuzzLayoutEntry(rng: Rng): unknown {
  const r = rng.next();

  // 非オブジェクト
  if (r < 0.05) return null;
  if (r < 0.1) return "string-entry";
  if (r < 0.15) return 42;
  if (r < 0.18) return [1, 2, 3];

  const entry: Record<string, unknown> = {};

  // key
  if (rng.next() < 0.9) {
    entry["key"] = rng.next() < 0.05 ? "" : `q${rng.int(1, 20)}`;
  } else {
    // key 欠損 or 型違い
    if (rng.next() < 0.5) entry["key"] = rng.int(1, 10);
  }

  // type
  if (rng.next() < 0.8) {
    entry["type"] = rng.pick(VALID_TYPES);
  } else {
    entry["type"] = rng.next() < 0.5 ? rng.pick(INVALID_TYPES) : fuzzPrimitive(rng);
  }

  // label
  if (rng.next() < 0.85) {
    entry["label"] = `Question ${rng.int(1, 20)}`;
  } else {
    // label 欠損 or 型違い
    if (rng.next() < 0.5) entry["label"] = rng.int(1, 10);
  }

  // items (SA/MA 用)
  const type = entry["type"];
  if (type === "SA" || type === "MA" || rng.next() < 0.2) {
    entry["items"] = fuzzItems(rng);
  }

  // granularity (DATE 用)
  if (type === "DATE") {
    if (rng.next() < 0.7) {
      entry["granularity"] = rng.pick(GRANULARITIES);
    } else {
      entry["granularity"] = rng.next() < 0.5 ? "invalid" : rng.int(1, 10);
    }
  }

  return entry;
}

/** Generate a random layout array (0–20 entries, mix of valid and invalid). */
export function fuzzLayoutArray(rng: Rng): unknown[] {
  const len = rng.int(0, 20);
  return Array.from({ length: len }, () => fuzzLayoutEntry(rng));
}

// ── JSON text fuzz ──────────────────────────────────────────────────

/** Generate random JSON text that may be malformed. */
export function fuzzJsonText(rng: Rng): string {
  const r = rng.next();

  // 完全ランダム文字列
  if (r < 0.15) return fuzzString(rng, 100);

  // 空文字列
  if (r < 0.2) return "";

  // 非配列の有効 JSON
  if (r < 0.3) {
    const values = ["{}", '"hello"', "42", "true", "null", '{"key": "value"}'];
    return rng.pick(values);
  }

  // 切り詰められた JSON
  if (r < 0.4) {
    const arr = fuzzLayoutArray(rng);
    const full = JSON.stringify(arr);
    const cutAt = rng.int(0, full.length - 1);
    return full.slice(0, cutAt);
  }

  // 正常な配列 JSON（内容は不正エントリ混在）
  const arr = fuzzLayoutArray(rng);
  return JSON.stringify(arr);
}

// ── Raw data (CSV + Layout) fuzz ────────────────────────────────────

interface FuzzRawDataResult {
  csv: string;
  layout: Layout;
  headers: string[];
}

/** Generate a CSV with corrupted values paired with a valid layout. */
export function fuzzRawData(rng: Rng): FuzzRawDataResult {
  const layout: Layout = [];
  const allHeaders = ["id"];

  // SA question
  const saCodes = Array.from({ length: rng.int(2, 5) }, (_, i) => String(i + 1));
  layout.push({
    type: "SA",
    key: "q_sa",
    label: "SA Question",
    items: saCodes.map((c) => ({ code: c, label: `SA${c}` })),
  });
  allHeaders.push("q_sa");

  // MA question
  const maCount = rng.int(2, 4);
  const maCodes = Array.from({ length: maCount }, (_, i) => String(i + 1));
  const maColumns = maCodes.map((c) => `q_ma_${c}`);
  layout.push({
    type: "MA",
    key: "q_ma",
    label: "MA Question",
    items: maCodes.map((c) => ({ code: c, label: `MA${c}` })),
  });
  allHeaders.push(...maColumns);

  // NA question
  layout.push({ type: "NA", key: "q_na", label: "NA Question" });
  allHeaders.push("q_na");

  // Decide which columns to include in CSV (may drop some)
  const csvHeaders = allHeaders.filter((h) => {
    if (h === "id") return true;
    return rng.next() < 0.85; // 15% chance of dropping
  });

  const rowCount = rng.int(5, 50);
  const rows: (string | number | null)[][] = [];

  for (let i = 1; i <= rowCount; i++) {
    const row: (string | number | null)[] = [i];

    for (let j = 1; j < csvHeaders.length; j++) {
      const col = csvHeaders[j];

      if (col === "q_sa") {
        row.push(fuzzSAValue(rng, saCodes));
      } else if (col.startsWith("q_ma_")) {
        row.push(fuzzMAValue(rng));
      } else if (col === "q_na") {
        row.push(fuzzNAValue(rng));
      } else {
        row.push(null);
      }
    }
    rows.push(row);
  }

  return {
    csv: buildCSV(csvHeaders, rows),
    layout,
    headers: csvHeaders,
  };
}

function fuzzSAValue(rng: Rng, validCodes: string[]): string | number | null {
  const r = rng.next();
  if (r < 0.3) return rng.pick(validCodes); // valid code
  if (r < 0.45) return null;
  if (r < 0.6) return String(rng.int(90, 99)); // unknown code
  if (r < 0.7) return "abc"; // non-numeric string
  if (r < 0.8) return ""; // empty string
  return rng.int(-5, 20); // numeric out of range
}

function fuzzMAValue(rng: Rng): string | number | null {
  const r = rng.next();
  if (r < 0.35) return rng.pick([0, 1]); // valid
  if (r < 0.5) return null;
  if (r < 0.6) return rng.int(2, 10); // invalid numeric
  if (r < 0.7) return "yes"; // string
  if (r < 0.8) return ""; // empty
  return rng.next() < 0.5 ? -1 : 0.5; // negative or float
}

function fuzzNAValue(rng: Rng): string | number | null {
  const r = rng.next();
  if (r < 0.3) return rng.int(0, 100); // valid
  if (r < 0.45) return null;
  if (r < 0.55) return Math.round(rng.next() * 1000) / 10; // float
  if (r < 0.65) return "abc"; // non-numeric
  if (r < 0.75) return ""; // empty
  return rng.next() < 0.5 ? "N/A" : "999";
}
