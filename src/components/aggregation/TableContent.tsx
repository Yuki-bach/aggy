import type { PctDirection } from "./Toolbar";
import { GtTable } from "./GtTable";
import { CrossTable } from "./CrossTable";
import { ResultCard } from "./ResultCard";
import { useAggregation } from "./AggregationContext";

interface TableContentProps {
  pctDirection: PctDirection;
}

export function TableContent({ pctDirection }: TableContentProps) {
  const { tallies, crossCols } = useAggregation();
  const hasCross = crossCols.length > 0;

  // Compute maxPct across all GT slices for bar chart scaling
  const maxPct = Math.max(
    ...tallies
      .filter((t) => t.by === null)
      .flatMap((t) => t.slices[0]?.cells.map((c) => c.pct) ?? []),
    0,
  );

  // Group tallies by question
  const questionCodes = [...new Set(tallies.map((t) => t.question))];

  return (
    <div
      class={
        hasCross
          ? "grid grid-cols-[1fr] gap-6"
          : "grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-6"
      }
    >
      {questionCodes.map((qCode) => {
        const gtTally = tallies.find((t) => t.question === qCode && t.by === null)!;
        const crossTallies = tallies.filter((t) => t.question === qCode && t.by !== null);

        return (
          <ResultCard
            key={qCode}
            tally={gtTally}
            extraClass={crossTallies.length > 0 ? "overflow-x-auto" : undefined}
          >
            {crossTallies.length > 0 ? (
              <CrossTable gtTally={gtTally} crossTallies={crossTallies} pctDir={pctDirection} />
            ) : (
              <GtTable tally={gtTally} maxPct={maxPct} />
            )}
          </ResultCard>
        );
      })}
    </div>
  );
}
