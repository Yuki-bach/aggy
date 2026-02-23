import type { LayoutMeta } from "../lib/layout";

export interface ColConfigState {
  colTypes: Record<string, string>;
  colSelected: Record<string, boolean>;
}

export function initColConfig(
  headers: string[],
  layoutMeta: LayoutMeta
): ColConfigState {
  const colTypes: Record<string, string> = {};
  const colSelected: Record<string, boolean> = {};
  const list = document.getElementById("col-list")!;
  list.innerHTML = "";

  headers.forEach((col) => {
    const colType = layoutMeta.colTypes[col] ?? "exclude";
    colTypes[col] = colType;
    const isSAorMA = colType === "sa" || colType.startsWith("ma:");
    colSelected[col] = isSAorMA;

    // SA/MA列のみUIに表示
    if (!isSAorMA) return;

    const maPrefix = colType.startsWith("ma:") ? colType.slice(3) : null;

    const item = document.createElement("div");
    item.className = "col-item";

    const pick = document.createElement("input");
    pick.type = "checkbox";
    pick.className = "col-pick";
    pick.checked = colSelected[col];
    pick.addEventListener("change", () => {
      colSelected[col] = pick.checked;
    });

    const nameEl = document.createElement("div");
    nameEl.className = "col-name";
    nameEl.textContent = col;
    if (maPrefix) {
      const badge = document.createElement("span");
      badge.className = "ma-badge";
      badge.textContent = "MA";
      nameEl.appendChild(badge);
    }

    // レイアウトから設問ラベルがあれば表示
    const qLabel = maPrefix
      ? layoutMeta.questionLabels[maPrefix]
      : layoutMeta.questionLabels[col];
    if (qLabel) {
      const labelEl = document.createElement("div");
      labelEl.className = "col-question-label";
      labelEl.textContent = qLabel;
      nameEl.appendChild(labelEl);
    }

    item.appendChild(pick);
    item.appendChild(nameEl);
    list.appendChild(item);
  });

  return { colTypes, colSelected };
}
