# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aggy is a browser-based survey raw-data aggregation tool (アンケートローデータ集計システム). Users upload a CSV of survey responses and a JSON layout file, then run GT (Grand Total) and cross-tabulation — all client-side using DuckDB Wasm for SQL-based aggregation.

Tech: TypeScript (strict), Vite, Preact (JSX), DuckDB Wasm, Tailwind CSS v4.

## Commands

```bash
pnpm dev           # Vite dev server (COOP/COEP headers for SharedArrayBuffer)
pnpm build         # tsc + vite build
pnpm check         # fmt:check + lint + tsc --noEmit (CI validation)
pnpm test          # vitest run
pnpm lint          # oxlint
pnpm lint:fix      # oxlint --fix
pnpm fmt           # oxfmt (format)
pnpm fmt:check     # oxfmt --check
```

## Architecture

### Data Flow

1. User uploads CSV → `Dropzone.ts` → `duckdbBridge.loadCSV()` (registers as DuckDB view)
2. User uploads JSON layout → `LayoutDropzone.ts` → `layout.parseLayout()` + `buildLayoutMeta()`
3. Both loaded → `main.tsx:initAfterBothLoaded()` builds `QuestionDef[]`, shows CrossConfig UI
4. User clicks run → `aggregator.aggregate()` executes SQL queries → returns `AggResult[]` (flat `Cell[]` arrays)
5. `ResultTable.renderResults()` calls `pivot()` to convert `Cell[]` → grid, then renders HTML tables
6. CSV download: `download.downloadAllCSV()` re-pivots and outputs BOM-prefixed UTF-8 CSV

### Module Responsibilities

- **`src/components/`** — UI: event handling and DOM rendering only
- **`src/lib/`** — Pure logic (aggregation SQL, DuckDB bridge, layout parsing, pivot, CSV export)
- `aggregator.ts` — Core: builds and runs SQL for SA/MA GT and all cross-tab combinations (SA×SA, SA×MA, MA×SA, MA×MA)
- `duckdbBridge.ts` — DuckDB Wasm lifecycle (init, CSV load, query execution). Module-level singleton state
- `pivot.ts` — Converts flat `Cell[]` into `{ mains, subs, lookup }` grid structure using `\0`-separated composite keys in Maps

### Key Types

```typescript
type QuestionDef = SAQuestion | MAQuestion;  // Tagged union
interface Cell { main: string; sub: string; n: number; count: number; pct: number; }
```

`LayoutMeta` maps column names to labels, value labels, and column types (`"sa"|"ma:PREFIX"|"id"|"weight"|"exclude"`).

## Conventions

- All CSV columns read as `VARCHAR` (`all_varchar=true`); weight uses `TRY_CAST` to float
- SQL column names escaped via `esc()` helper (double-quote escaping)
- MA truthy values: `'1'` only
- Component files: PascalCase `.tsx` (`GtTable.tsx`); lib files: camelCase `.ts` (`aggregator.ts`)
- Components export Preact function components; bridge functions (`build*`) wrap them for legacy vanilla DOM callers
- Component initializers: `init*`; DOM renderers: `render*`; Preact components: PascalCase functions
- Module-level variables as app state (no state management library); migrating toward hooks
- UI language is Japanese
- Formatting: oxfmt; Linting: oxlint; Testing: vitest
- File ordering: `imports → exports (Public API) → internal implementation`. Props interfaces stay with their exported component

## Vite Config Notes

DuckDB Wasm requires `SharedArrayBuffer`, so COOP/COEP headers are set in both `server.headers` and `preview.headers`. DuckDB Wasm is excluded from Vite's dependency pre-bundling (`optimizeDeps.exclude`).

`@preact/preset-vite` handles JSX transform; `tsconfig.json` has `jsxImportSource: "preact"`. Tailwind CSS v4 runs as a Vite plugin.
