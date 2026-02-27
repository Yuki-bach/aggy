import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type { LayoutMeta } from "../../lib/layout";
import type { QuestionDef } from "../../lib/agg/aggregate";

export interface AggregationContextValue {
  layoutMeta: LayoutMeta;
  weightCol: string;
  crossCols: QuestionDef[];
}

export const AggregationContext = createContext<AggregationContextValue | null>(null);

export function useAggregation(): AggregationContextValue {
  const ctx = useContext(AggregationContext);
  if (!ctx) throw new Error("useAggregation must be used within AggregationContext.Provider");
  return ctx;
}
