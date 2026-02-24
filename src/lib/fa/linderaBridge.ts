/** Lindera Wasm シングルトン — 日本語形態素解析 */

import type { Tokenizer } from "lindera-wasm-ipadic";

let tokenizer: Tokenizer | null = null;
let initPromise: Promise<void> | null = null;

/** ワードクラウドに含める品詞（IPAdic details[0]） */
const ALLOWED_POS = new Set(["名詞", "動詞", "形容詞"]);

/** 除外する名詞サブカテゴリ（details[1]） */
const EXCLUDED_NOUN_SUB = new Set(["非自立", "代名詞", "数", "接尾"]);

const MIN_WORD_LENGTH = 2;

export async function initLindera(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const lindera = await import("lindera-wasm-ipadic");
    await lindera.default();

    const builder = new lindera.TokenizerBuilder();
    builder.setDictionary("embedded://ipadic");
    builder.setMode("normal");
    builder.appendCharacterFilter("unicode_normalize", { kind: "nfkc" });
    builder.appendTokenFilter("lowercase", {});
    tokenizer = builder.build();
  })();
  return initPromise;
}

/** テキストをトークナイズし、品詞フィルタ済みの単語リストを返す */
export function tokenizeText(text: string): string[] {
  if (!tokenizer) throw new Error("Lindera is not initialized");
  const tokens = tokenizer.tokenize(text);
  const words: string[] = [];
  for (const token of tokens) {
    const pos = token.details[0] ?? "";
    if (!ALLOWED_POS.has(pos)) continue;
    // 名詞のうち意味の薄いサブカテゴリを除外
    if (pos === "名詞") {
      const sub = token.details[1] ?? "";
      if (EXCLUDED_NOUN_SUB.has(sub)) continue;
    }
    // 動詞・形容詞は原形（details[6]）を使用
    const surface = pos !== "名詞" ? (token.details[6] ?? token.surface) : token.surface;
    if (surface.length < MIN_WORD_LENGTH) continue;
    words.push(surface);
  }
  return words;
}
