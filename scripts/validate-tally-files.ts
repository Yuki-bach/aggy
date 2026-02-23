/**
 * Tally フォーマット検証スクリプト
 *
 * Usage: npx tsx scripts/validate-tally-files.ts <csv-path> <layout-json-path>
 *
 * CSVローデータとJSONレイアウトファイルがTallyの期待する形式に適合しているか検証する。
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// ── 型定義（src/lib/layout.ts と同等） ──

interface LayoutItem {
  code: string;
  label: string;
  column?: string;
}

type LayoutColType = "SA" | "MA" | "ID" | "WEIGHT" | "EXCLUDE";

interface LayoutEntry {
  key: string;
  label?: string;
  type: LayoutColType;
  items?: LayoutItem[];
}

type Layout = LayoutEntry[];

// ── CSV パース ──

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  // BOM除去
  const text = content.replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(parseCSVLine);
  return { headers, rows };
}

// ── 検証ロジック ──

interface ValidationResult {
  errors: string[];
  warnings: string[];
}

function validateCSVStructure(
  headers: string[],
  rows: string[][]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (headers.length === 0) {
    errors.push("CSVにヘッダー行がありません");
    return { errors, warnings };
  }

  // 空カラム名チェック
  headers.forEach((h, i) => {
    if (h.trim() === "") {
      errors.push(`列${i + 1}のカラム名が空です`);
    }
  });

  // 重複カラム名チェック
  const seen = new Set<string>();
  for (const h of headers) {
    if (seen.has(h)) {
      errors.push(`カラム名 "${h}" が重複しています`);
    }
    seen.add(h);
  }

  // 列数一致チェック（先頭100行）
  const sample = rows.slice(0, 100);
  for (let i = 0; i < sample.length; i++) {
    if (sample[i].length !== headers.length) {
      warnings.push(
        `データ行${i + 1}: 列数が${sample[i].length}（ヘッダーは${headers.length}列）`
      );
    }
  }

  return { errors, warnings };
}

function validateLayoutSchema(jsonText: string): {
  layout: Layout | null;
  result: ValidationResult;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    errors.push("JSONの解析に失敗しました。ファイルの形式を確認してください。");
    return { layout: null, result: { errors, warnings } };
  }

  if (!Array.isArray(parsed)) {
    errors.push("レイアウトファイルはJSON配列である必要があります");
    return { layout: null, result: { errors, warnings } };
  }

  const validTypes: Set<string> = new Set([
    "SA",
    "MA",
    "ID",
    "WEIGHT",
    "EXCLUDE",
  ]);
  const keys = new Set<string>();

  for (let i = 0; i < parsed.length; i++) {
    const entry = parsed[i];
    const pos = `エントリ[${i}]`;

    if (typeof entry !== "object" || entry === null) {
      errors.push(`${pos}: オブジェクトである必要があります`);
      continue;
    }

    const e = entry as Record<string, unknown>;

    if (typeof e["key"] !== "string" || e["key"] === "") {
      errors.push(`${pos}: "key"（空でない文字列）が必要です`);
      continue;
    }

    if (typeof e["type"] !== "string") {
      errors.push(`${pos}: "type"（文字列）が必要です`);
      continue;
    }

    const key = e["key"] as string;
    const type = e["type"] as string;

    if (keys.has(key)) {
      errors.push(`${pos}: key "${key}" が重複しています`);
    }
    keys.add(key);

    if (!validTypes.has(type)) {
      errors.push(
        `${pos}: type "${type}" は無効です（有効値: SA, MA, ID, WEIGHT, EXCLUDE）`
      );
    }

    if (type === "SA" || type === "MA") {
      if (!Array.isArray(e["items"]) || e["items"].length === 0) {
        errors.push(`${pos}: type "${type}" には items 配列が必要です`);
      } else {
        const items = e["items"] as unknown[];
        for (let j = 0; j < items.length; j++) {
          const item = items[j] as Record<string, unknown>;
          if (typeof item !== "object" || item === null) {
            errors.push(`${pos}.items[${j}]: オブジェクトである必要があります`);
            continue;
          }
          if (typeof item["code"] !== "string" || item["code"] === "") {
            errors.push(
              `${pos}.items[${j}]: "code"（空でない文字列）が必要です`
            );
          }
          if (typeof item["label"] !== "string" || item["label"] === "") {
            errors.push(
              `${pos}.items[${j}]: "label"（空でない文字列）が必要です`
            );
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    return { layout: null, result: { errors, warnings } };
  }

  return { layout: parsed as Layout, result: { errors, warnings } };
}

function validateConsistency(
  headers: string[],
  layout: Layout
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const headerSet = new Set(headers);
  const mappedColumns = new Set<string>();

  for (const entry of layout) {
    switch (entry.type) {
      case "ID":
      case "WEIGHT":
      case "EXCLUDE":
      case "SA": {
        mappedColumns.add(entry.key);
        if (!headerSet.has(entry.key)) {
          errors.push(
            `レイアウトの列 "${entry.key}" (${entry.type}) がCSVヘッダーに存在しません`
          );
        }
        break;
      }
      case "MA": {
        if (entry.items) {
          for (const item of entry.items) {
            const colName = item.column ?? `${entry.key}_${item.code}`;
            mappedColumns.add(colName);
            if (!headerSet.has(colName)) {
              errors.push(
                `レイアウトのMA列 "${colName}" (${entry.key}, code=${item.code}) がCSVヘッダーに存在しません`
              );
            }
          }
        }
        break;
      }
    }
  }

  // 未マッピングのCSV列を警告
  for (const h of headers) {
    if (!mappedColumns.has(h)) {
      warnings.push(`CSVの列 "${h}" はレイアウトに定義されていません`);
    }
  }

  return { errors, warnings };
}

function validateDataValues(
  headers: string[],
  rows: string[][],
  layout: Layout
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const headerIndex = new Map<string, number>();
  headers.forEach((h, i) => headerIndex.set(h, i));

  const sample = rows.slice(0, 100);
  if (sample.length === 0) {
    warnings.push("データ行がないため値検証をスキップしました");
    return { errors, warnings };
  }

  for (const entry of layout) {
    const colIdx = headerIndex.get(entry.key);

    switch (entry.type) {
      case "WEIGHT": {
        if (colIdx === undefined) break;
        let nonNumericCount = 0;
        for (const row of sample) {
          const val = row[colIdx]?.trim();
          if (val === "" || val === undefined) continue;
          if (isNaN(Number(val))) {
            nonNumericCount++;
          }
        }
        if (nonNumericCount > 0) {
          warnings.push(
            `WEIGHT列 "${entry.key}": ${nonNumericCount}行に数値でない値があります（TRY_CASTでNULL扱いになります）`
          );
        }
        break;
      }
      case "SA": {
        if (colIdx === undefined || !entry.items) break;
        const validCodes = new Set(entry.items.map((it) => it.code));
        validCodes.add("N/A"); // 無回答マーカーは有効値
        let unmatchedCount = 0;
        const unmatchedValues = new Set<string>();
        for (const row of sample) {
          const val = row[colIdx]?.trim();
          if (val === "" || val === undefined) continue; // 空 = 回答対象外
          if (!validCodes.has(val)) {
            unmatchedCount++;
            if (unmatchedValues.size < 5) unmatchedValues.add(val);
          }
        }
        if (unmatchedCount > 0) {
          warnings.push(
            `SA列 "${entry.key}": ${unmatchedCount}行にitemsのcodeに一致しない値があります（例: ${[...unmatchedValues].join(", ")}）`
          );
        }
        break;
      }
      case "MA": {
        if (!entry.items) break;
        const validMA = new Set(["1", "0", ""]);
        for (const item of entry.items) {
          const maCol = item.column ?? `${entry.key}_${item.code}`;
          const maIdx = headerIndex.get(maCol);
          if (maIdx === undefined) continue;
          let invalidCount = 0;
          const invalidValues = new Set<string>();
          for (const row of sample) {
            const val = row[maIdx]?.trim();
            if (val === undefined) continue;
            if (!validMA.has(val)) {
              invalidCount++;
              if (invalidValues.size < 5) invalidValues.add(val);
            }
          }
          if (invalidCount > 0) {
            warnings.push(
              `MA列 "${maCol}": ${invalidCount}行に不正な値があります（期待: 1/0/空, 検出: ${[...invalidValues].join(", ")}）`
            );
          }
        }
        break;
      }
      case "ID": {
        if (colIdx === undefined) break;
        let emptyCount = 0;
        for (const row of sample) {
          const val = row[colIdx]?.trim();
          if (val === "" || val === undefined) emptyCount++;
        }
        if (emptyCount > 0) {
          warnings.push(
            `ID列 "${entry.key}": ${emptyCount}行に空の値があります`
          );
        }
        break;
      }
    }
  }

  return { errors, warnings };
}

// ── メイン ──

function main(): void {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      "Usage: npx tsx scripts/validate-tally-files.ts <csv-path> <layout-json-path>"
    );
    process.exit(1);
  }

  const csvPath = resolve(args[0]);
  const layoutPath = resolve(args[1]);

  let csvContent: string;
  let layoutContent: string;
  try {
    csvContent = readFileSync(csvPath, "utf-8");
  } catch {
    console.error(`CSVファイルの読み込みに失敗しました: ${csvPath}`);
    process.exit(1);
  }
  try {
    layoutContent = readFileSync(layoutPath, "utf-8");
  } catch {
    console.error(
      `レイアウトファイルの読み込みに失敗しました: ${layoutPath}`
    );
    process.exit(1);
  }

  console.log("=== Tally フォーマット検証結果 ===\n");

  let totalErrors = 0;
  let totalWarnings = 0;

  // Step 1: CSV構造
  const { headers, rows } = parseCSV(csvContent);
  const csvResult = validateCSVStructure(headers, rows);
  totalErrors += csvResult.errors.length;
  totalWarnings += csvResult.warnings.length;

  if (csvResult.errors.length > 0) {
    console.log(`[CSV構造] エラー`);
    csvResult.errors.forEach((e) => console.log(`  エラー: ${e}`));
  } else {
    console.log(
      `[CSV構造] OK - ヘッダー列数: ${headers.length}, データ行数: ${rows.length}`
    );
  }
  csvResult.warnings.forEach((w) => console.log(`  警告: ${w}`));

  // Step 2: レイアウトスキーマ
  const { layout, result: layoutResult } = validateLayoutSchema(layoutContent);
  totalErrors += layoutResult.errors.length;
  totalWarnings += layoutResult.warnings.length;

  if (layoutResult.errors.length > 0) {
    console.log(`[レイアウトスキーマ] エラー`);
    layoutResult.errors.forEach((e) => console.log(`  エラー: ${e}`));
  } else {
    console.log(
      `[レイアウトスキーマ] OK - エントリ数: ${layout?.length ?? 0}`
    );
  }
  layoutResult.warnings.forEach((w) => console.log(`  警告: ${w}`));

  // Step 3 & 4: 整合性とデータ値（レイアウト解析成功時のみ）
  if (layout && headers.length > 0) {
    const consistencyResult = validateConsistency(headers, layout);
    totalErrors += consistencyResult.errors.length;
    totalWarnings += consistencyResult.warnings.length;

    if (consistencyResult.errors.length > 0) {
      console.log(`[CSV↔レイアウト整合性] エラー`);
      consistencyResult.errors.forEach((e) => console.log(`  エラー: ${e}`));
    } else {
      console.log(`[CSV↔レイアウト整合性] OK`);
    }
    consistencyResult.warnings.forEach((w) => console.log(`  警告: ${w}`));

    const valueResult = validateDataValues(headers, rows, layout);
    totalErrors += valueResult.errors.length;
    totalWarnings += valueResult.warnings.length;

    if (valueResult.errors.length > 0) {
      console.log(`[データ値] エラー`);
      valueResult.errors.forEach((e) => console.log(`  エラー: ${e}`));
    } else {
      console.log(`[データ値] OK`);
    }
    valueResult.warnings.forEach((w) => console.log(`  警告: ${w}`));
  }

  console.log(`\nエラー: ${totalErrors}件 / 警告: ${totalWarnings}件`);
  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
