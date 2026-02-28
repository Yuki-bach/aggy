import type { AggResult } from "../../agg/aggregate";
import type { LayoutMeta } from "../../layout";
import { pivot } from "../../agg/pivot";
import { resolveMainLabel, resolveSubLabel } from "../exportGrid";
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

export function formatJSON(results: AggResult[], layoutMeta?: LayoutMeta): string {
  const entries: JsonExportEntry[] = results.map((res) => {
    const { mains, subs, lookup } = pivot(res.cells);
    const gtSub = subs.find((s) => s.label === "GT")!;
    const crossSubs = subs.filter((s) => s.label !== "GT");

    const options: JsonOption[] = mains.map((main) => {
      const gtCell = lookup.get(`${main}\0GT`)!;
      const opt: JsonOption = {
        label: resolveMainLabel(main),
        count: gtCell.count,
        pct: gtCell.pct,
      };

      if (crossSubs.length > 0) {
        opt.cross = {};
        for (const sub of crossSubs) {
          const cell = lookup.get(`${main}\0${sub.label}`);
          const label = resolveSubLabel(sub.label, layoutMeta);
          if (cell) {
            opt.cross[label] = { count: cell.count, pct: cell.pct };
          }
        }
      }

      return opt;
    });

    return { question: res.question, type: res.type, n: gtSub.n, options };
  });

  return JSON.stringify(entries, null, 2);
}

export function downloadJSON(
  results: AggResult[],
  layoutMeta?: LayoutMeta,
  hasCross?: boolean,
): void {
  const json = formatJSON(results, layoutMeta);
  const prefix = hasCross ? "cross_result" : "gt_result";
  downloadFile(json, `${prefix}_${today()}.json`, "application/json;charset=utf-8;");
}
