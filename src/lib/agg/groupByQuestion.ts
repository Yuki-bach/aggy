import type { Tally, CategoricalTally } from "./types";

export interface TallyGroup {
  questionCode: string;
  gtTally: Tally;
  crossTallies: Tally[];
}

export function groupByQuestion(tallies: Tally[]): TallyGroup[] {
  const questionCodes = [...new Set(tallies.map((t) => t.question))];
  return questionCodes.map((qCode) => ({
    questionCode: qCode,
    gtTally: tallies.find((t) => t.question === qCode && t.by === null)!,
    crossTallies: tallies.filter((t) => t.question === qCode && t.by !== null),
  }));
}

export function computeMaxPct(tallies: Tally[]): number {
  return Math.max(
    ...tallies
      .filter((t): t is CategoricalTally => t.by === null && t.type !== "NA")
      .flatMap((t) => t.slices[0]?.cells.map((c) => c.pct) ?? []),
    0,
  );
}
