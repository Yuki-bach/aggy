import { render } from "preact";
import { questionKey, type QuestionDef } from "../../lib/agg/aggregate";

export interface CrossConfigState {
  questions: QuestionDef[];
  crossSelected: Record<string, boolean>;
}

let state: CrossConfigState = { questions: [], crossSelected: {} };

function CrossConfigList({
  questions,
  questionLabels,
}: {
  questions: QuestionDef[];
  questionLabels: Record<string, string>;
}) {
  return (
    <>
      {questions.map((q) => {
        const key = questionKey(q);
        const qLabel = questionLabels[key];
        const typeTag = q.type === "MA" ? " [MA]" : "";
        const displayText = qLabel ? `${key}: ${qLabel}${typeTag}` : `${key}${typeTag}`;

        return (
          <label
            key={key}
            class="flex min-h-9 cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-[0.875rem] transition-[background] duration-100 hover:bg-surface2"
          >
            <input
              type="checkbox"
              class="h-[18px] w-[18px] cursor-pointer accent-accent"
              data-col={key}
              onChange={(e) => {
                state.crossSelected[key] = (e.target as HTMLInputElement).checked;
              }}
            />{" "}
            {displayText}
          </label>
        );
      })}
    </>
  );
}

export function initCrossConfig(
  questions: QuestionDef[],
  questionLabels: Record<string, string>,
): void {
  state = { questions, crossSelected: {} };
  questions.forEach((q) => (state.crossSelected[questionKey(q)] = false));

  const list = document.getElementById("cross-col-list")!;
  render(<CrossConfigList questions={questions} questionLabels={questionLabels} />, list);
}

export function getCrossColsSelected(): QuestionDef[] {
  return state.questions.filter((q) => state.crossSelected[questionKey(q)]);
}
