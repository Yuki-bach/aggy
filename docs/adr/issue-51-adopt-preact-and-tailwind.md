# Preact + Tailwind CSS を導入する

- **Date**: 2025-05-01
- **Status**: Accepted
- **Issue**: #51

## Context

プロジェクト初期は Vanilla JS + CSS でUIを構築していたが、単一の `style.css` が約1,700行に膨張し、メンテナンスが困難になっていた。HTMLの生成も `innerHTML` や `classList` の直接操作で行っており、画面の状態管理が複雑化していた。

開発者はRails出身でフロントエンドフレームワークの経験が浅いため、以下の要件でフレームワークを選定した。

- **軽量であること** — クライアントサイドで DuckDB Wasm を動かすため、フレームワーク自体のバンドルサイズは小さいほうがよい
- **コンポーネントベースであること** — HTML・CSS・JSを1ファイルにまとめ、関心の分離と再利用性を確保したい
- **coding agent が書きやすいこと** — AI支援による開発が主体のため、エコシステムが大きく学習データの多いフレームワークが望ましい

## Decision

**Preact + Tailwind CSS v4** を採用する。

- **Preact** (3KB) — React互換のAPIを持ちながらバンドルサイズが極めて小さい。JSX によるコンポーネント記述でVanilla DOMの手続き的な操作を宣言的に置き換える
- **Tailwind CSS v4** — ユーティリティファーストのCSSフレームワーク。1,700行超の `style.css` を削除し、スタイルをコンポーネントのインラインクラスに移行する

具体的な移行内容:
- `index.html` を約250行から17行に簡素化
- Vanilla DOM操作を宣言的なPreact JSXに全面移行（App, ImportScreen, AggregationScreen 等10以上のコンポーネント）
- 画面切替をCSSセレクタからPreactの条件レンダリングに変更
- データロードロジックを `useDataLoader` カスタムフックに抽出

## Consequences

**良い影響:**
- CSSファイルの肥大化問題が解消された（`style.css` 1,732行を削除、`tailwind.css` は418行に集約）
- コンポーネント内にHTML・CSS（Tailwind）・JSをまとめて書けるようになり、関心の分離が改善された
- `App.tsx` が約100行の純粋なレイアウトシェルになり、画面構成の見通しが良くなった

**悪い影響:**
- Preact固有のエコシステムはReactに比べて小さく、一部ライブラリに互換性の問題が出る可能性がある
- Tailwind のユーティリティクラスが長くなると、テンプレートの可読性が下がる場面がある
