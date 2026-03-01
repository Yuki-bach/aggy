import type { ComponentChildren } from "preact";
import type { AggResult } from "../../lib/agg/aggregate";
import { resolveQuestionLabel } from "../../lib/labels";
import { useAggregation } from "./AggregationContext";

interface ResultCardProps {
  res: AggResult;
  extraClass?: string;
  children: ComponentChildren;
}

export function ResultCard({ res, extraClass, children }: ResultCardProps) {
  const { labelMap, weightCol } = useAggregation();

  const gtN = res.cells.find((c) => c.sub === "GT")!.n;
  const nLabel = weightCol ? `n=${gtN.toFixed(1)}` : `n=${gtN.toLocaleString()}`;

  const questionLabel = resolveQuestionLabel(res.question, labelMap);
  const hasLabel = questionLabel !== res.question;

  return (
    <div
      class={`overflow-hidden rounded-xl border border-border bg-surface shadow-sm${extraClass ? ` ${extraClass}` : ""}`}
    >
      <div class="flex items-baseline gap-3 border-b border-border p-4">
        <div class="flex min-w-0 flex-col gap-0.5">
          <span class="text-sm font-bold text-accent">{questionLabel}</span>
          {hasLabel && <span class="text-xs tracking-wide text-muted">{res.question}</span>}
        </div>
        <span class="text-xs tracking-wide text-muted">{res.type}</span>
        <span class="ml-auto text-xs text-muted">{nLabel}</span>
      </div>
      {children}
    </div>
  );
}
