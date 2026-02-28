import { pivot } from "../../lib/agg/pivot";
import type { PctDirection } from "./Toolbar";
import { GtTable } from "./GtTable";
import { CrossTable } from "./CrossTable";
import { ResultCard } from "./ResultCard";
import { useAggregation } from "./AggregationContext";

interface TableContentProps {
  pctDirection: PctDirection;
}

export function TableContent({ pctDirection }: TableContentProps) {
  const { results, hasCross } = useAggregation();
  const allGtCells = results.flatMap((r) => r.cells.filter((c) => c.sub === "GT"));
  const maxPct = Math.max(...allGtCells.map((c) => c.pct), 0);

  return (
    <div
      class={
        hasCross
          ? "grid grid-cols-[1fr] gap-6"
          : "grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-6"
      }
    >
      {results.map((res) => {
        if (!hasCross) {
          const pv = pivot(res.cells);
          return (
            <ResultCard key={res.question} res={res}>
              <GtTable res={res} pv={pv} maxPct={maxPct} />
            </ResultCard>
          );
        }

        const gtCells = res.cells.filter((c) => c.sub === "GT");
        const crossCells = res.cells.filter((c) => c.sub !== "GT");
        const gtPv = pivot(gtCells);
        const crossPv = pivot(crossCells);

        return (
          <ResultCard key={res.question} res={res} extraClass="overflow-x-auto">
            <div class="flex items-end gap-4 pl-4">
              <div class="shrink-0">
                <GtTable res={res} pv={gtPv} maxPct={maxPct} />
              </div>
              <div class="min-w-0 overflow-x-auto">
                <CrossTable res={res} pv={crossPv} pctDir={pctDirection} />
              </div>
            </div>
          </ResultCard>
        );
      })}
    </div>
  );
}
