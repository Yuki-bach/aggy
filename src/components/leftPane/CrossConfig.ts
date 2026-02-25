import { questionKey, type QuestionDef } from "../../lib/agg/aggregate";

export interface CrossConfigState {
  questions: QuestionDef[];
  crossSelected: Record<string, boolean>;
}

let state: CrossConfigState = { questions: [], crossSelected: {} };

export function initCrossConfig(
  questions: QuestionDef[],
  questionLabels: Record<string, string>,
): void {
  state = { questions, crossSelected: {} };
  questions.forEach((q) => (state.crossSelected[questionKey(q)] = false));

  const list = document.getElementById("cross-col-list")!;
  list.innerHTML = "";

  questions.forEach((q) => {
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

export function getCrossColsSelected(): QuestionDef[] {
  return state.questions.filter((q) => state.crossSelected[questionKey(q)]);
}
