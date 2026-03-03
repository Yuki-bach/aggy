import type { Question, Tally } from "../../agg/types";
import { NA_VALUE } from "../../agg/sqlHelpers";
import { t } from "../../i18n";
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

function resolveLabel(code: string, question: Question): string {
  if (code === NA_VALUE) return t("label.na");
  return question.labels[code] ?? code;
}

export function formatJSON(tallies: Tally[], weightCol: string, questions: Question[]): string {
  const questionCodes = [...new Set(tallies.map((t) => t.question))];

  const entries: JsonExportEntry[] = questionCodes.map((qCode) => {
    const question = questions.find((q) => q.code === qCode);
    const gtTally = tallies.find((t) => t.question === qCode && t.by === "GT")!;
    const crossTallies = tallies.filter((t) => t.question === qCode && t.by !== "GT");
    const gtSlice = gtTally.slices[0];

    const options: JsonOption[] = gtTally.codes.map((code, i) => {
      const gtCell = gtSlice.cells[i];
      const opt: JsonOption = {
        label: resolveLabel(code, question!),
        count: gtCell.count,
        pct: gtCell.pct,
      };

      if (crossTallies.length > 0) {
        opt.cross = {};
        for (const crossTally of crossTallies) {
          const crossQ = questions.find((q) => q.code === crossTally.by);
          for (const slice of crossTally.slices) {
            const cell = slice.cells[i];
            const label = crossQ ? resolveLabel(slice.code, crossQ) : slice.code;
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

export function downloadJSON(
  tallies: Tally[],
  weightCol: string,
  questions: Question[],
  hasCross?: boolean,
): void {
  const json = formatJSON(tallies, weightCol, questions);
  const prefix = hasCross ? "cross_result" : "gt_result";
  downloadFile(json, `${prefix}_${today()}.json`, "application/json;charset=utf-8;");
}
