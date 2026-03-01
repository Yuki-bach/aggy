import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type { LabelMap } from "../../lib/layout";
import type { AggResult, QuestionDef } from "../../lib/agg/aggregate";

export interface AggregationContextValue {
  results: AggResult[];
  labelMap: LabelMap;
  weightCol: string;
  crossCols: QuestionDef[];
  hasCross: boolean;
}

export const AggregationContext = createContext<AggregationContextValue | null>(null);

export function useAggregation(): AggregationContextValue {
  const ctx = useContext(AggregationContext);
  if (!ctx) throw new Error("useAggregation must be used within AggregationContext.Provider");
  return ctx;
}
