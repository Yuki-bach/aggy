# CLAUDE.md

## Project Overview

Aggy is a browser-based survey raw-data aggregation tool (アンケートローデータ集計システム). Users upload a CSV of survey responses and a JSON layout file, then run Grand Total and cross-tabulation — all client-side using DuckDB Wasm for SQL-based aggregation.

Tech: TypeScript (strict), VitePlus (Vite + Vitest + Oxc), Svelte 5 (SFC), DuckDB Wasm, Tailwind CSS v4.

## Commands

```bash
vp dev          # dev server
vp build        # production build
vp check        # fmt + lint + type check
vp test run     # vitest run
vp test         # vitest watch
vp fmt          # oxfmt
vp lint         # oxlint
pnpm bench      # aggregate() benchmark (all patterns)
pnpm bench rows # single pattern (rows / cols / both)
pnpm bench:gen  # generate benchmark data
```

## Release

1. `src/lib/changelog.json` に新バージョンのエントリを追加
2. `npm version minor` (or `patch` / `major`) — package.json更新 + git tag作成（`preversion` でchangelogエントリの存在を検証）
3. `git push origin main --tags`
4. `gh release create v0.x.0 --generate-notes`

## Architecture

- **`src/components/`** — UI: event handling, DOM rendering, and component-local helpers
- **`src/lib/`** — Shared pure logic used by multiple modules (aggregation SQL, DuckDB bridge, layout parsing, pivot, export)

## Branch Strategy

- `develop` — daily integration branch. Feature branches merge here.
- `main` — release branch. `develop` merges to `main` at release time.
- Tags: `v1.x.0` on `main` after merge. GitHub Release Notes auto-generated via `gh release create`.

## Conventions

- Data format conventions: see `.claude/skills/aggy-import/references/data-preparation-guide.md`
- Component files: PascalCase `.svelte`; lib files: camelCase `.ts` (reactive modules use `.svelte.ts`)
- Module-level singleton state for infrastructure (`duckdb`, `i18n.svelte.ts`); UI state uses `$state` / `$derived` / `$effect`
- File ordering: `<script> → template → <style>` for Svelte SFCs. Props interfaces stay with their component
- DuckDB Wasm runs sequentially on a single Web Worker — never use `Promise.all` with `duckdb` methods; call them with sequential `await`
- Prefer functional style by default. Use classes when multiple functions need shared state to avoid props drilling (e.g. `aggGrandTotal` — bundle related data into a class and access it via methods)
