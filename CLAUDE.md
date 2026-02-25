# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aggy is a browser-based survey raw-data aggregation tool (アンケートローデータ集計システム). Users upload a CSV of survey responses and a JSON layout file, then run GT (Grand Total) and cross-tabulation — all client-side using DuckDB Wasm for SQL-based aggregation.

Tech: TypeScript (strict), Vite, DuckDB Wasm, vanilla DOM (no UI framework), plain CSS.

## Commands

```bash
npm run dev        # Start Vite dev server (sets COOP/COEP headers for SharedArrayBuffer)
npm run build      # Type-check (tsc --noEmit) + vite build
npm run preview    # Serve dist/ locally
```

No test framework is configured. Type checking via `tsc --noEmit` is the only validation step.

## Architecture

### Data Flow

1. User uploads CSV → `Dropzone.ts` → `duckdbBridge.loadCSV()` (registers as DuckDB view)
2. User uploads JSON layout → `LayoutDropzone.ts` → `layout.parseLayout()` + `buildLayoutMeta()`
3. Both loaded → `main.ts:initAfterBothLoaded()` builds `QuestionDef[]`, shows CrossConfig UI
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
- Component files: PascalCase (`ResultTable.ts`); lib files: camelCase (`aggregator.ts`)
- Component initializers: `init*`; DOM renderers: `render*`; sub-element builders: `build*`
- Module-level variables as app state (no state management library)
- UI language is Japanese

## Vite Config Notes

DuckDB Wasm requires `SharedArrayBuffer`, so COOP/COEP headers are set in both `server.headers` and `preview.headers`. DuckDB Wasm is excluded from Vite's dependency pre-bundling (`optimizeDeps.exclude`).
