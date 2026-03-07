import type { Tally } from "./types";

export interface QuestionGroup {
  questionCode: string;
  gtTally: Tally;
  crossTallies: Tally[];
}

export function groupByQuestion(tallies: Tally[]): QuestionGroup[] {
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
      .filter((t) => t.by === null)
      .flatMap((t) => t.slices[0]?.cells.map((c) => c.pct) ?? []),
    0,
  );
}
