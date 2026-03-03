---
name: measure-e2e-perf
description: Measure end-to-end performance from aggregation button click to result rendering using Chrome DevTools Performance tracing. Use when investigating UI performance, measuring render time, or profiling the aggregation pipeline.
disable-model-invocation: true
argument-hint: "[pattern: rows|cols|both|sa-only|ma-only]"
allowed-tools: mcp__chrome-devtools__*, Bash(pnpm dev *), Bash(pnpm bench:gen *), Bash(rm /tmp/aggy-perf-*)
---

# E2E Performance Measurement

Measure the wall-clock time from clicking the aggregation ("Run") button to the results being fully rendered on screen, using Chrome DevTools Performance tracing via the chrome-devtools MCP.

## Prerequisites

- Chrome is open and chrome-devtools MCP is connected
- Benchmark data has been generated (`pnpm bench:gen`)
- Dev server is running (`pnpm dev`)

## Pattern selection

Use `$ARGUMENTS` to specify the benchmark data pattern. Defaults to `rows` if omitted.

Available patterns and their characteristics are defined in `bench/generate.ts` (`PATTERNS` array). Read that file to see the current pattern names, row counts, and column counts.

Benchmark data paths:
- CSV: `bench/data/{pattern}.csv`
- Layout JSON: `bench/data/{pattern}_layout.json`

## Measurement procedure

### Step 1: Verify dev server

Check that `pnpm dev` is running (default: `http://localhost:5173`). If not, start it in the background.

### Step 2: Open the app in Chrome

Use `navigate_page` to open the app URL. Then `take_snapshot` to confirm the ImportScreen is displayed.

### Step 3: Upload benchmark files

On the ImportScreen:

1. `take_snapshot` to locate the file input elements
2. Upload the CSV file using `upload_file` with `bench/data/{pattern}.csv`
3. Upload the layout file using `upload_file` with `bench/data/{pattern}_layout.json`
4. Confirm both files are loaded (the "Proceed" button should appear)

### Step 4: Navigate to AggregationScreen

Click the "Proceed" button. The app transitions to AggregationScreen and auto-runs the first aggregation. Wait for the result table to appear using `wait_for`.

### Step 5: Run GT-only aggregation with Performance tracing

Measure Grand Total only (no cross-tab):

1. `take_snapshot` to locate the Run button and confirm no cross-tab columns are selected
2. Start tracing with `performance_start_trace` (`reload: false`, `autoStop: false`)
3. Click the Run button
4. Wait for result rendering to complete using `wait_for` (look for table content)
5. Wait 1-2 seconds for paint to settle
6. Stop tracing with `performance_stop_trace`, saving to `/tmp/aggy-perf-{pattern}_gt.json.gz`

### Step 6: Run cross-tab aggregation with Performance tracing

Measure with cross-tabulation enabled:

1. `take_snapshot` to locate cross-tab checkboxes in the left panel
2. Select 2 SA columns as cross-tab axes (check the first two SA question checkboxes)
3. Start tracing with `performance_start_trace` (`reload: false`, `autoStop: false`)
4. Click the Run button
5. Wait for result rendering to complete using `wait_for` (look for table content)
6. Wait 1-2 seconds for paint to settle
7. Stop tracing with `performance_stop_trace`, saving to `/tmp/aggy-perf-{pattern}_cross.json.gz`

### Step 7: Analyze and report

Use `performance_analyze_insight` to inspect both trace results. Report a comparison table:

| Metric | GT only | Cross-tab (SA x2) |
|--------|---------|-------------------|
| INP | | |
| Input delay | | |
| Processing duration | | |
| Presentation delay | | |
| Long Tasks | | |
| CLS | | |

Also report:
- **Pattern**: which data pattern was used
- **Bottlenecks**: any identified bottlenecks and their causes
- **Recommendations**: actionable suggestions if issues are found

### Step 8: Cleanup

Delete the trace files after analysis is complete:

```
rm /tmp/aggy-perf-*
```

## Notes

- Trace files are temporary and deleted after analysis — they are not kept for later inspection
- This measures a single run (not median of multiple runs) — the goal is bottleneck identification, not precise benchmarking
- For SQL-only execution time, use `pnpm bench` instead
