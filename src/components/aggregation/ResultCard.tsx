import type { ComponentChildren } from "preact";
import type { Tally } from "../../lib/agg/types";
import { useAggregation } from "./AggregationContext";

interface ResultCardProps {
  tally: Tally;
  extraClass?: string;
  children: ComponentChildren;
}

export function ResultCard({ tally, extraClass, children }: ResultCardProps) {
  const { weightCol } = useAggregation();

  const gtTally = tally.by === null ? tally : undefined;
  const gtN = gtTally?.slices[0]?.n ?? 0;
  const nLabel = weightCol ? `n=${gtN.toFixed(1)}` : `n=${gtN.toLocaleString()}`;

  const hasLabel = tally.label !== tally.question;

  return (
    <div
      class={`overflow-hidden rounded-xl border border-border bg-surface shadow-sm${extraClass ? ` ${extraClass}` : ""}`}
    >
      <div class="flex items-baseline gap-3 border-b border-border p-4">
        <div class="flex min-w-0 flex-col gap-0.5">
          <span class="text-sm font-bold text-accent">{tally.label}</span>
          {hasLabel && <span class="text-xs tracking-wide text-muted">{tally.question}</span>}
        </div>
        <span class="text-xs tracking-wide text-muted">{tally.type}</span>
        <span class="ml-auto text-xs text-muted">{nLabel}</span>
      </div>
      {children}
    </div>
  );
}
