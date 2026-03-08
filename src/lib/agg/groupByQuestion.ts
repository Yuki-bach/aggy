import type { Tally, CategoricalTally, NumericTally } from "./types";

export interface CategoricalQuestionGroup {
  type: "SA" | "MA";
  questionCode: string;
  gtTally: CategoricalTally;
  crossTallies: CategoricalTally[];
}

export interface NumericQuestionGroup {
  type: "NA";
  questionCode: string;
  gtTally: NumericTally;
  crossTallies: NumericTally[];
}

export type QuestionGroup = CategoricalQuestionGroup | NumericQuestionGroup;

export function groupByQuestion(tallies: Tally[]): QuestionGroup[] {
  const questionCodes = [...new Set(tallies.map((t) => t.question))];
  return questionCodes.map((qCode) => {
    const gtTally = tallies.find((t) => t.question === qCode && t.by === null)!;
    const crossTallies = tallies.filter((t) => t.question === qCode && t.by !== null);
    // 同一設問のtallyは同じtypeなので、gtTallyで判別して安全にnarrowする
    if (gtTally.type === "NA") {
      return {
        type: "NA" as const,
        questionCode: qCode,
        gtTally,
        crossTallies: crossTallies as NumericTally[],
      };
    }
    return {
      type: gtTally.type,
      questionCode: qCode,
      gtTally,
      crossTallies: crossTallies as CategoricalTally[],
    };
  });
}

export function computeMaxPct(tallies: Tally[]): number {
  return Math.max(
    ...tallies
      .filter((t): t is CategoricalTally => t.by === null && t.type !== "NA")
      .flatMap((t) => t.slices[0]?.cells.map((c) => c.pct) ?? []),
    0,
  );
}
