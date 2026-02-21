export interface CrossConfigState {
  crossSelected: Record<string, boolean>;
}

let state: CrossConfigState = { crossSelected: {} };

export function initCrossConfig(saColumns: string[]): void {
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

    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + col));
    list.appendChild(label);
  });
}

export function getCrossColsSelected(): string[] {
  return Object.entries(state.crossSelected)
    .filter(([, v]) => v)
    .map(([k]) => k);
}
