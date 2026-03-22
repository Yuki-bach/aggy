# Aggy

ブラウザだけで動くアンケートローデータ集計ツール。CSV と レイアウト JSON をアップロードするだけで、GT 集計・クロス集計が実行できる。サーバー不要・完全クライアントサイド処理。

## 特徴

### 集計

- **GT 集計（単純集計）** — SA（単一回答）・MA（複数回答）に対応
- **クロス集計** — SA×SA / SA×MA / MA×SA / MA×MA の全組み合わせ対応
- **数値集計（NA）** — 平均・中央値・標準偏差・最小値/最大値・分布ヒストグラム
- **日付集計** — 年/月/週/日の粒度で集計可能
- **ウェイトバック** — 全集計タイプでウェイト付き集計に対応（ON/OFF 切替）

### 可視化

- **チャート表示** — 横棒・縦棒・帯グラフ（Chart.js）
- **NA ヒストグラム** — 平均・中央値ライン付き分布チャート
- **テーブル表示** — 行%/列%の切替対応

### エクスポート

- **ダウンロード** — CSV（BOM 付き）/ Markdown / JSON
- **クリップボードコピー** — TSV / Markdown / JSON

### データ管理

- **バリデーション** — レイアウト構造チェック・不明コード検出・MA 値検証・数値列検証
- **OPFS 保存** — ブラウザ内にデータセットを永続保存・復元
- **5 種の質問タイプ** — SA / MA / NA / DATE / WEIGHT

### その他

- **AI コメント生成** — Chrome Built-in AI による集計結果の自動分析コメント
- **多言語対応（i18n）** — 日本語・英語切替
- **完全クライアントサイド** — DuckDB Wasm による SQL ベースの高速集計。データはブラウザ外に送信されない

## Tech Stack

TypeScript (strict), VitePlus (Vite + Vitest + Oxc), Preact, DuckDB Wasm, Tailwind CSS v4

## Quick Start

```bash
curl -fsSL https://vite.plus | bash   # install VitePlus CLI
vp install
vp dev
```

> VitePlus CLI は `pnpm add -g vite-plus` でもインストールできます。
