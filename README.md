# Aggy

DuckDB Wasm でブラウザ内完結するアンケートローデータ集計ツール。

## 特徴

- **ブラウザ完結** — DuckDB Wasm による SQL ベース集計。データはブラウザ外に送信されない
- **OPFS 保存** — データセットをブラウザ内に永続保存・復元
- **設問タイプ** — SA / MA / NA / DATE / WEIGHT
- **集計** — GT 集計・クロス集計（SA×MA 等の全組み合わせ）・数値統計・日付集計・ウェイトバック
- **可視化** — 横棒・縦棒・帯グラフ・ヒストグラム
- **エクスポート** — CSV / TSV / Markdown / JSON（ダウンロード & クリップボード）
- **AI コメント** — Chrome Built-in AI による集計結果の自動分析
- **i18n** — 日本語・英語

## Tech Stack

TypeScript (strict), VitePlus (Vite + Vitest + Oxc), Preact, DuckDB Wasm, Tailwind CSS v4

## Quick Start

```bash
curl -fsSL https://vite.plus | bash   # install VitePlus CLI
vp install
vp dev
```

> VitePlus CLI は `pnpm add -g vite-plus` でもインストールできます。
