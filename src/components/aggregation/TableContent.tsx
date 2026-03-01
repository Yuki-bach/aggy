import { isGT } from "../../lib/agg/aggregate";
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
  const allGtCells = results.flatMap((r) => r.cells.filter(isGT));
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
        const pv = pivot(res.cells, res.question);
        const isCross = pv.crossAxes.length > 0;

        return (
          <ResultCard
            key={res.question}
            res={res}
            extraClass={isCross ? "overflow-x-auto" : undefined}
          >
            {isCross ? (
              <CrossTable res={res} pv={pv} pctDir={pctDirection} />
            ) : (
              <GtTable res={res} pv={pv} maxPct={maxPct} />
            )}
          </ResultCard>
        );
      })}
    </div>
  );
}
