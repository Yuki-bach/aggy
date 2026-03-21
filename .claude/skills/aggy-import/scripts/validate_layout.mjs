#!/usr/bin/env node
/**
 * Aggy レイアウトJSON バリデーター
 *
 * Usage:
 *     node validate_layout.mjs <layout.json> [--csv <rawdata.csv>]
 *
 * layout.schema.json に基づいてレイアウトJSONを検証する。
 * --csv を指定すると、CSVヘッダーとの整合性もチェックする。
 */
import { readFileSync } from "fs";
import { resolve } from "path";

// --- Layout validation ---

function validateLayout(layout) {
  const errors = [];

  if (!Array.isArray(layout)) {
    return ["ルート要素がJSON配列ではありません"];
  }
  if (layout.length === 0) {
    return ["レイアウトが空です"];
  }

  const seenKeys = new Set();

  for (let i = 0; i < layout.length; i++) {
    const entry = layout[i];
    const prefix = `[${i}]`;

    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      errors.push(`${prefix}: オブジェクトではありません`);
      continue;
    }

    // key: 必須、文字列
    const key = entry.key;
    if (key === undefined || key === null) {
      errors.push(`${prefix}: 'key' がありません`);
    } else if (typeof key !== "string" || key === "") {
      errors.push(`${prefix}: 'key' が空または文字列ではありません`);
    } else {
      if (seenKeys.has(key)) {
        errors.push(`${prefix}: key '${key}' が重複しています`);
      }
      seenKeys.add(key);
    }

    // type: 必須、SA/MA/WEIGHT/DATE
    const typ = entry.type;
    const validTypes = new Set(["SA", "MA", "WEIGHT", "DATE"]);
    if (typ === undefined || typ === null) {
      errors.push(`${prefix}: 'type' がありません`);
      continue;
    }
    if (!validTypes.has(typ)) {
      errors.push(`${prefix}: type '${typ}' は無効です（有効: ${[...validTypes].join(", ")}）`);
      continue;
    }

    // 許可されるフィールドのチェック
    const allowed = new Set(["key", "type", "label", "items", "granularity"]);
    const extra = Object.keys(entry).filter((k) => !allowed.has(k));
    if (extra.length > 0) {
      errors.push(`${prefix}: 不明なフィールド: {${extra.join(", ")}}`);
    }

    // 型別ルール
    if (typ === "SA" || typ === "MA") {
      validateSaMa(entry, prefix, typ, errors);
    } else if (typ === "WEIGHT") {
      validateWeight(entry, prefix, errors);
    } else if (typ === "DATE") {
      validateDate(entry, prefix, errors);
    }
  }

  return errors;
}

function validateSaMa(entry, prefix, typ, errors) {
  const items = entry.items;
  if (items === undefined || items === null) {
    errors.push(`${prefix}: ${typ} には 'items' が必須です`);
    return;
  }
  if (!Array.isArray(items)) {
    errors.push(`${prefix}: 'items' が配列ではありません`);
    return;
  }
  if (items.length === 0) {
    errors.push(`${prefix}: 'items' が空です（1つ以上必要）`);
    return;
  }

  const seenCodes = new Set();
  for (let j = 0; j < items.length; j++) {
    const item = items[j];
    const ip = `${prefix}.items[${j}]`;

    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      errors.push(`${ip}: オブジェクトではありません`);
      continue;
    }

    // code: 必須、文字列
    const code = item.code;
    if (code === undefined || code === null) {
      errors.push(`${ip}: 'code' がありません`);
    } else if (typeof code !== "string") {
      errors.push(
        `${ip}: 'code' が文字列ではありません（値: ${JSON.stringify(code)}, 型: ${typeof code}）`,
      );
    } else {
      if (seenCodes.has(code)) {
        errors.push(`${ip}: code '${code}' が重複しています`);
      }
      seenCodes.add(code);
    }

    // label: 必須、文字列
    const label = item.label;
    if (label === undefined || label === null) {
      errors.push(`${ip}: 'label' がありません`);
    } else if (typeof label !== "string") {
      errors.push(`${ip}: 'label' が文字列ではありません`);
    }

    // 余分なフィールド
    const extraFields = Object.keys(item).filter((k) => k !== "code" && k !== "label");
    if (extraFields.length > 0) {
      errors.push(`${ip}: 不明なフィールド: {${extraFields.join(", ")}}`);
    }
  }
}

function validateWeight(entry, prefix, errors) {
  if ("items" in entry) {
    errors.push(`${prefix}: WEIGHT に 'items' は不要です`);
  }
  if ("granularity" in entry) {
    errors.push(`${prefix}: WEIGHT に 'granularity' は不要です`);
  }
}

function validateDate(entry, prefix, errors) {
  if ("items" in entry) {
    errors.push(`${prefix}: DATE に 'items' は不要です`);
  }

  const gran = entry.granularity;
  const validGran = new Set(["year", "month", "week", "day"]);
  if (gran === undefined || gran === null) {
    errors.push(`${prefix}: DATE には 'granularity' が必須です`);
  } else if (!validGran.has(gran)) {
    errors.push(
      `${prefix}: granularity '${gran}' は無効です（有効: ${[...validGran].join(", ")}）`,
    );
  }
}

// --- CSV consistency check ---

function parseCsvFirstLine(csvPath) {
  const content = readFileSync(csvPath, "utf-8");
  // Handle both \r\n and \n line endings
  const firstLine = content.split(/\r?\n/)[0];
  // Simple CSV header parse (no quotes handling needed for headers typically)
  return firstLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
}

function checkCsvConsistency(layout, csvPath) {
  const errors = [];
  const headers = parseCsvFirstLine(csvPath);
  const headerSet = new Set(headers);
  const expected = new Set();

  for (const entry of layout) {
    const typ = entry.type;
    const key = entry.key || "";

    if (typ === "SA" || typ === "WEIGHT" || typ === "DATE") {
      expected.add(key);
      if (!headerSet.has(key)) {
        errors.push(`レイアウトの key '${key}' (${typ}) がCSVヘッダーにありません`);
      }
    } else if (typ === "MA") {
      for (const item of entry.items || []) {
        const col = `${key}_${item.code}`;
        expected.add(col);
        if (!headerSet.has(col)) {
          errors.push(`MA列 '${col}' がCSVヘッダーにありません`);
        }
      }
    }
  }

  const extra = [...headerSet].filter((h) => !expected.has(h)).sort();
  if (extra.length > 0) {
    errors.push(`レイアウト未定義のCSV列があります: [${extra.join(", ")}]`);
  }

  return errors;
}

// --- Main ---

function printUsage() {
  console.log(`Aggy レイアウトJSON バリデーター

Usage:
    node validate_layout.mjs <layout.json> [--csv <rawdata.csv>]

layout.schema.json に基づいてレイアウトJSONを検証する。
--csv を指定すると、CSVヘッダーとの整合性もチェックする。`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const layoutPath = resolve(args[0]);
  let csvPath = null;

  const csvIdx = args.indexOf("--csv");
  if (csvIdx !== -1 && csvIdx + 1 < args.length) {
    csvPath = resolve(args[csvIdx + 1]);
  }

  // レイアウトJSON読み込み
  let layout;
  try {
    const raw = readFileSync(layoutPath, "utf-8");
    layout = JSON.parse(raw);
  } catch (e) {
    if (e.code === "ENOENT") {
      console.log(`FAIL: ファイルが見つかりません: ${layoutPath}`);
    } else {
      console.log(`FAIL: JSONパースエラー: ${e.message}`);
    }
    process.exit(1);
  }

  // スキーマバリデーション
  const errors = validateLayout(layout);

  // CSV整合性チェック
  let csvErrors = [];
  if (csvPath) {
    try {
      csvErrors = checkCsvConsistency(layout, csvPath);
    } catch (e) {
      if (e.code === "ENOENT") {
        csvErrors = [`CSVファイルが見つかりません: ${csvPath}`];
      } else {
        csvErrors = [`CSV読み込みエラー: ${e.message}`];
      }
    }
  }

  const allErrors = [...errors, ...csvErrors];

  if (allErrors.length > 0) {
    console.log(`FAIL: ${allErrors.length} 件のエラー`);
    for (const e of allErrors) {
      console.log(`  - ${e}`);
    }
    process.exit(1);
  } else {
    // サマリー
    const typeCounts = {};
    for (const entry of layout) {
      const t = entry.type || "?";
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    }
    const summary = Object.entries(typeCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([t, c]) => `${t} x${c}`)
      .join(", ");
    console.log(`OK: ${layout.length} エントリ (${summary})`);
    if (csvPath) {
      console.log("OK: CSV整合性チェック通過");
    }
    process.exit(0);
  }
}

main();
