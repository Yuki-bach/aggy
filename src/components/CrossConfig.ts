export interface CrossConfigState {
  crossSelected: Record<string, boolean>;
}

let state: CrossConfigState = { crossSelected: {} };

export function initCrossConfig(
  saColumns: string[],
  questionLabels: Record<string, string>
): void {
  state = { crossSelected: {} };
  saColumns.forEach((col) => (state.crossSelected[col] = false));

  const list = document.getElementById("cross-col-list")!;
  list.innerHTML = "";

  saColumns.forEach((col) => {
    const label = document.createElement("label");
    label.className = "cross-col-item";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "col-pick";
    cb.dataset.col = col;
    cb.addEventListener("change", () => {
      state.crossSelected[col] = cb.checked;
    });

    const displayText = questionLabels[col]
      ? `${col}: ${questionLabels[col]}`
      : col;

    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + displayText));
    list.appendChild(label);
  });
}

export function getCrossColsSelected(): string[] {
  return Object.entries(state.crossSelected)
    .filter(([, v]) => v)
    .map(([k]) => k);
}
