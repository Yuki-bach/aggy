import type { Tally } from "../../agg/types";
import { downloadFile, today } from "../export";

interface JsonOption {
  label: string;
  count: number;
  pct: number;
  cross?: Record<string, { count: number; pct: number }>;
}

interface JsonExportEntry {
  question: string;
  type: "SA" | "MA";
  n: number;
  options: JsonOption[];
}

interface JsonExport {
  weightColumn: string | null;
  results: JsonExportEntry[];
}

export function formatJSON(tallies: Tally[], weightCol: string): string {
  const questionCodes = [...new Set(tallies.map((t) => t.question))];

  const entries: JsonExportEntry[] = questionCodes.map((qCode) => {
    const gtTally = tallies.find((t) => t.question === qCode && t.by === null)!;
    const crossTallies = tallies.filter((t) => t.question === qCode && t.by !== null);
    const gtSlice = gtTally.slices[0];

    const options: JsonOption[] = gtTally.codes.map((code, i) => {
      const gtCell = gtSlice.cells[i];
      const opt: JsonOption = {
        label: gtTally.labels[code] ?? code,
        count: gtCell.count,
        pct: gtCell.pct,
      };

      if (crossTallies.length > 0) {
        opt.cross = {};
        for (const crossTally of crossTallies) {
          const axis = crossTally.by!;
          for (const slice of crossTally.slices) {
            const cell = slice.cells[i];
            const label = axis.labels[slice.code!] ?? slice.code;
            if (cell) {
              opt.cross[label] = { count: cell.count, pct: cell.pct };
            }
          }
        }
      }

      return opt;
    });

    return { question: qCode, type: gtTally.type, n: gtSlice.n, options };
  });

  const output: JsonExport = {
    weightColumn: weightCol || null,
    results: entries,
  };
  return JSON.stringify(output, null, 2);
}

export function downloadJSON(tallies: Tally[], weightCol: string, hasCross?: boolean): void {
  const json = formatJSON(tallies, weightCol);
  const prefix = hasCross ? "cross_result" : "gt_result";
  downloadFile(json, `${prefix}_${today()}.json`, "application/json;charset=utf-8;");
}
