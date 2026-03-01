import type { AggResult } from "../../agg/aggregate";
import type { LayoutMeta } from "../../layout";
import { pivot } from "../../agg/pivot";
import { resolveMainLabel } from "../exportGrid";
import { resolveValueLabel } from "../../labels";
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

export function formatJSON(
  results: AggResult[],
  weightCol: string,
  layoutMeta: LayoutMeta,
): string {
  const entries: JsonExportEntry[] = results.map((res) => {
    const pv = pivot(res.cells, res.question);
    const { mains, crossAxes } = pv;
    const gtCell = pv.cell(mains[0]);
    const gtN = gtCell?.n ?? 0;
    const qType = layoutMeta.questionTypes[res.question] ?? "SA";

    const allCrossValues = crossAxes.flatMap((axis) =>
      axis.values.map((v) => ({ question: axis.question, value: v.value })),
    );

    const options: JsonOption[] = mains.map((main) => {
      const gt = pv.cell(main)!;
      const opt: JsonOption = {
        label: resolveMainLabel(main),
        count: gt.count,
        pct: gt.pct,
      };

      if (allCrossValues.length > 0) {
        opt.cross = {};
        for (const cv of allCrossValues) {
          const cell = pv.cell(main, cv);
          const label = resolveValueLabel(cv.question, cv.value, layoutMeta);
          if (cell) {
            opt.cross[label] = { count: cell.count, pct: cell.pct };
          }
        }
      }

      return opt;
    });

    return { question: res.question, type: qType, n: gtN, options };
  });

  const output: JsonExport = {
    weightColumn: weightCol || null,
    results: entries,
  };
  return JSON.stringify(output, null, 2);
}

export function downloadJSON(
  results: AggResult[],
  weightCol: string,
  layoutMeta: LayoutMeta,
  hasCross?: boolean,
): void {
  const json = formatJSON(results, weightCol, layoutMeta);
  const prefix = hasCross ? "cross_result" : "gt_result";
  downloadFile(json, `${prefix}_${today()}.json`, "application/json;charset=utf-8;");
}
