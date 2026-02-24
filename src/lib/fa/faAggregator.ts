/** FA（自由回答）集計 — テキストをトークナイズしDuckDBで単語頻度を集計 */

import type * as duckdb from "@duckdb/duckdb-wasm";
import type { FAResult, WordFreq } from "../aggregate";
import { initLindera, tokenizeText } from "./linderaBridge";

function esc(name: string): string {
  return name.replace(/"/g, '""');
}

const DEFAULT_TOP_N = 100;

export async function aggregateFA(
  conn: duckdb.AsyncDuckDBConnection,
  column: string,
  topN: number = DEFAULT_TOP_N,
): Promise<FAResult> {
  await initLindera();

  // 非空テキストを取得
  const sql = `
    SELECT "${esc(column)}" AS val
    FROM survey
    WHERE "${esc(column)}" IS NOT NULL AND "${esc(column)}" != ''
  `;
  const result = await conn.query(sql);
  const rows = result.toArray();
  const totalResponses = rows.length;

  // 各回答をトークナイズ
  const allWords: string[] = [];
  for (const row of rows) {
    const text = String(row.val);
    const words = tokenizeText(text);
    allWords.push(...words);
  }

  if (allWords.length === 0) {
    return { question: column, type: "FA", totalResponses, words: [] };
  }

  // 一時テーブルに単語を投入し SQL で頻度集計
  const tempTable = `__fa_words_${Date.now()}`;
  await conn.query(`CREATE TEMPORARY TABLE "${esc(tempTable)}" (word VARCHAR)`);

  const BATCH_SIZE = 1000;
  for (let i = 0; i < allWords.length; i += BATCH_SIZE) {
    const batch = allWords.slice(i, i + BATCH_SIZE);
    const values = batch.map((w) => `('${w.replace(/'/g, "''")}')`).join(",");
    await conn.query(`INSERT INTO "${esc(tempTable)}" VALUES ${values}`);
  }

  const freqSql = `
    SELECT word, COUNT(*) AS cnt
    FROM "${esc(tempTable)}"
    GROUP BY word
    ORDER BY cnt DESC
    LIMIT ${topN}
  `;
  const freqResult = await conn.query(freqSql);
  const words: WordFreq[] = freqResult.toArray().map((r) => ({
    word: String(r.word),
    count: Number(r.cnt),
  }));

  await conn.query(`DROP TABLE IF EXISTS "${esc(tempTable)}"`);

  return { question: column, type: "FA", totalResponses, words };
}
