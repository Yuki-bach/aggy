import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type { Question, Tally } from "../../lib/agg/types";

export interface AggregationContextValue {
  tallies: Tally[];
  weightCol: string;
  questions: Question[];
  crossCols: Question[];
}

export const AggregationContext = createContext<AggregationContextValue | null>(null);

export function useAggregation(): AggregationContextValue {
  const ctx = useContext(AggregationContext);
  if (!ctx) throw new Error("useAggregation must be used within AggregationContext.Provider");
  return ctx;
}
