# Preact から Svelte 5 に移行する

- **Date**: 2026-03-20
- **Status**: Accepted
- **Issue**: #206

## Context

PR #51 で Preact + Tailwind CSS を導入し、コンポーネントベースの開発体制は整った。機能面での不満はなかったが、クライアントサイドで DuckDB Wasm による集計処理を行うアプリケーション特性上、UIフレームワーク層のオーバーヘッドは小さいほど望ましい。より高速なフレームワークへの移行を検討した。

候補として **SolidJS** と **Svelte 5** を比較検討した結果、DX（開発体験）の観点で Svelte 5 を選択した。Svelte 5 はコンパイラベースで仮想DOMを持たず、SFC（Single File Component）形式でHTML・CSS・JSを1ファイルに記述できる。runes (`$state`, `$derived`, `$effect`) による直感的なリアクティビティモデルも、Preactのhooksより記述量が少なくシンプルである。

## Decision

**Preact (JSX + hooks) から Svelte 5 (SFC + runes) に全面移行する。**

移行方針:
- 全27コンポーネントをPreact JSXからSvelte SFCに書き換える
- `i18n.ts` → `i18n.svelte.ts`: `$state` ベースに変更し、`useLocaleRerender()` フックを廃止
- `useDismiss` フック → `clickOutside` Svelte action に置き換え
- `useSavedFiles` フック → `savedFilesStore.svelte.ts`（`$state` ベースのモジュール）に置き換え
- lib層（集計SQL、DuckDB、レイアウト、エクスポート）は変更しない — インポートパスの更新のみ

## Consequences

**良い影響:**
- **LCP が3倍高速化** (460ms → 152ms) — Svelte 5 のコンパイル済み出力はPreactの仮想DOM初期化より軽量
- **INP が29%改善** (56ms → 40ms) — fine-grained reactivity によりプレゼンテーション遅延が55ms→39msに短縮
- **コード量が858行削減** (2,817行追加 / 3,675行削除) — hooks より runes のほうが記述がシンプル
- SFCにより HTML・CSS・JS の同居がより自然な形になった
- Core Web Vitals はすべて "Good" 範囲を維持

**悪い影響:**
- **JSヒープ使用量が増加** (3.34MB → 7.81MB, +134%) — 大規模データセットでの影響は要監視
- Svelte のエコシステムは React/Preact と比べて小さく、サードパーティライブラリの選択肢が限られる
- Svelte 5 (runes) は比較的新しく、coding agent の学習データにおけるカバレッジがPreactより低い可能性がある
