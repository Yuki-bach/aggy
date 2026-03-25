# VitePlus を導入する

- **Date**: 2026-03-10
- **Status**: Accepted
- **Issue**: #183

## Context

プロジェクトのツールチェーンとして Vite（dev/build）、Vitest（test）、oxlint（lint）、oxfmt（format）を個別にインストール・設定していた。これらはすべて VoidZero 社のエコシステムに属するツールであり、個別に `package.json` のスクリプトや設定ファイルを管理する必要があった。

VoidZero 社がこれらのツールを統合した **VitePlus**（統一CLIツールチェーン）をリリースした。VitePlus は `vp` コマンド一つで dev / build / test / check（lint + fmt + type check）を実行でき、既存の Vite + Vitest + Oxc 構成からの移行パスが用意されている。

アルファ版ではあるが、個人プロジェクトであるため採用リスクは低いと判断した。

## Decision

**Vite + Vitest + Oxc の個別構成から VitePlus に移行する。**

具体的な変更内容:

- `vp` CLI をプロジェクトのツールチェーンとして採用
- `package.json` のスクリプトを `vp dev` / `vp build` / `vp check` / `vp test` に統一
- CI ワークフローを `setup-vp` に切り替え、`pnpm` コマンドを `vp run` / `vp exec` に置き換え

## Consequences

**良い影響:**

- ツールチェーンの設定が統合され、`vp` コマンド一つで開発ワークフロー全体を操作できるようになった
- `vp check` で fmt → lint → type check をワンコマンドで実行でき、CI スクリプトが簡素化された
- 既存の Vite + Vitest + Oxc 構成からの移行がスムーズだった（ツールの実体が同じため設定の互換性が高い）

**悪い影響:**

- VitePlus はアルファ版であり、破壊的変更が入る可能性がある
- VitePlus 固有の問題が発生した場合、コミュニティやドキュメントがまだ成熟していないため、解決に時間がかかる可能性がある
- CI で `setup-vp` への依存が増え、VitePlus 側の障害がCI全体に影響しうる
