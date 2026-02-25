import { questionKey, type QuestionDef, type CrossableQuestion } from "../../lib/aggregate";

export interface CrossConfigState {
  questions: CrossableQuestion[];
  crossSelected: Record<string, boolean>;
}

let state: CrossConfigState = { questions: [], crossSelected: {} };

export function initCrossConfig(
  questions: QuestionDef[],
  questionLabels: Record<string, string>,
): void {
  // FA questions are excluded from cross-tabulation
  const crossCandidates = questions.filter(
    (q): q is CrossableQuestion => q.type !== "FA",
  );
  state = { questions: crossCandidates, crossSelected: {} };
  crossCandidates.forEach((q) => (state.crossSelected[questionKey(q)] = false));

  const list = document.getElementById("cross-col-list")!;
  list.innerHTML = "";

  crossCandidates.forEach((q) => {
    const key = questionKey(q);
    const label = document.createElement("label");
    label.className = "cross-col-item";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "col-pick";
    cb.dataset.col = key;
    cb.addEventListener("change", () => {
      state.crossSelected[key] = cb.checked;
    });

    const qLabel = questionLabels[key];
    const typeTag = q.type === "MA" ? " [MA]" : "";
    const displayText = qLabel ? `${key}: ${qLabel}${typeTag}` : `${key}${typeTag}`;

    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + displayText));
    list.appendChild(label);
  });
}

export function getCrossColsSelected(): CrossableQuestion[] {
  return state.questions.filter((q) => state.crossSelected[questionKey(q)]);
}
