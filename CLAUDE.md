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
pnpm lint          # oxlint src/ scripts/ vite.config.ts
pnpm lint:fix      # oxlint --fix src/ scripts/ vite.config.ts
pnpm fmt           # oxfmt src/ scripts/ vite.config.ts index.html
pnpm fmt:check     # oxfmt --check src/ scripts/ vite.config.ts index.html
pnpm bench         # aggregate() benchmark (all patterns)
pnpm bench rows    # single pattern (rows / cols / both)
pnpm bench:gen     # generate benchmark data
```

## Architecture

### Data Flow

1. User uploads CSV → `ImportScreen` → `duckdbBridge.loadCSV()` (registers as DuckDB table)
2. User uploads JSON layout → `ImportScreen` → `layout.parseLayout()` + `buildLabelMap()`
3. Both loaded → `ImportScreen` calls `onComplete` → `AggregationScreen` builds `QuestionDef[]`
4. User clicks run → `aggregate()` executes SQL queries → returns `AggResult[]` (flat `Cell[]` arrays)
5. `TableContent` / `ChartContent` call `pivot()` to convert `Cell[]` → grid, then pass to `GtTable` / `CrossTable` as props
6. Export: `export.executeExport()` re-pivots and outputs files (CSV is BOM-prefixed UTF-8)

### Module Responsibilities

- **`src/components/`** — UI: event handling and DOM rendering only
- **`src/lib/`** — Pure logic (aggregation SQL, DuckDB bridge, layout parsing, pivot, CSV export)
- `agg/aggregate.ts` — Entry point; `gtAggregator.ts` / `crossAggregator.ts` build and run SQL for SA/MA GT and cross-tab (SA×SA, SA×MA, MA×SA, MA×MA)
- `duckdbBridge.ts` — DuckDB Wasm lifecycle (init, CSV load, query execution). Module-level singleton state
- `pivot.ts` — Converts flat `Cell[]` into `{ mains: string[], subs: { label, n }[], lookup: Map }` grid structure using `\0`-separated composite keys

### Key Types

```typescript
type QuestionDef = SAQuestion | MAQuestion;  // Tagged union
interface Cell { main: string; sub: string; n: number; count: number; pct: number; }
```

`LabelMap` maps question labels (`questionLabels: Record<string, string>`) and value labels (`valueLabels: Record<string, Record<string, string>>`).

## Conventions

- CSV columns use DuckDB type inference (no `all_varchar`); weight column is natively DOUBLE
- SQL column names escaped via `esc()` helper (double-quote escaping)
- MA truthy values: `1` (numeric)
- SA no-answer: numeric code (e.g. `99`) defined in layout JSON items; NULL = not shown
- Component files: PascalCase `.tsx` (`GtTable.tsx`); lib files: camelCase `.ts` (`aggregate.ts`)
- Components export Preact function components; PascalCase functions
- Module-level singleton state for infrastructure (`duckdbBridge`, `i18n`); UI state uses hooks + Context
- Formatting: oxfmt; Linting: oxlint; Testing: vitest
- File ordering: `imports → exports (Public API) → internal implementation`. Props interfaces stay with their exported component

## Vite Config Notes

DuckDB Wasm requires `SharedArrayBuffer`, so COOP/COEP headers are set in both `server.headers` and `preview.headers`. DuckDB Wasm is excluded from Vite's dependency pre-bundling (`optimizeDeps.exclude`).

`@preact/preset-vite` handles JSX transform; `tsconfig.json` has `jsxImportSource: "preact"`. Tailwind CSS v4 runs as a Vite plugin.
