import type { QuestionDef } from "../lib/aggregator";

export interface CrossConfigState {
  questions: QuestionDef[];
  crossSelected: Record<string, boolean>;
}

let state: CrossConfigState = { questions: [], crossSelected: {} };

export function initCrossConfig(
  questions: QuestionDef[],
  questionLabels: Record<string, string>
): void {
  state = { questions, crossSelected: {} };
  questions.forEach((q) => (state.crossSelected[q.key] = false));

  const list = document.getElementById("cross-col-list")!;
  list.innerHTML = "";

  questions.forEach((q) => {
    const label = document.createElement("label");
    label.className = "cross-col-item";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "col-pick";
    cb.dataset.col = q.key;
    cb.addEventListener("change", () => {
      state.crossSelected[q.key] = cb.checked;
    });

    const qLabel = questionLabels[q.key];
    const typeTag = q.type === "MA" ? " [MA]" : "";
    const displayText = qLabel
      ? `${q.key}: ${qLabel}${typeTag}`
      : `${q.key}${typeTag}`;

    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + displayText));
    list.appendChild(label);
  });
}

export function getCrossColsSelected(): QuestionDef[] {
  return state.questions.filter((q) => state.crossSelected[q.key]);
}
