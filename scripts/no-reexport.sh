#!/usr/bin/env bash
# Detect re-exports: export { ... } from "..." / export type { ... } from "..."
# Exits non-zero if any re-export is found.

matches=$(grep -rn --include="*.ts" --include="*.svelte" -E 'export\s+(type\s+)?\{[^}]*\}\s+from\s' src)

if [ -n "$matches" ]; then
  echo "Re-exports detected — import directly from the source module instead:"
  echo "$matches"
  exit 1
fi
