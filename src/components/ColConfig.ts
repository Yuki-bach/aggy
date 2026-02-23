import { detectMAGroups, guessColType } from "../lib/colDetect";
import type { LayoutMeta } from "../lib/layout";

export interface ColConfigState {
  colTypes: Record<string, string>;
  colSelected: Record<string, boolean>;
}

export function initColConfig(
  headers: string[],
  layoutMeta?: LayoutMeta
): ColConfigState {
  const colTypes: Record<string, string> = {};
  const colSelected: Record<string, boolean> = {};
  const list = document.getElementById("col-list")!;
  list.innerHTML = "";

  const weightSel = document.getElementById(
    "weight-col-select"
  ) as HTMLSelectElement;
  weightSel.innerHTML =
    '<option value="">— ウェイトなし（実数集計）—</option>';

  const maGroups = detectMAGroups(headers);

  headers.forEach((col) => {
    // レイアウトの種別指定を優先し、なければ自動推定
    const defaultType = layoutMeta?.colTypes[col] ?? guessColType(col, maGroups);
    colTypes[col] = defaultType;
    colSelected[col] =
      defaultType !== "id" &&
      defaultType !== "weight" &&
      defaultType !== "exclude";

    const maPrefix = defaultType.startsWith("ma:")
      ? defaultType.slice(3)
      : (maGroups[col] ?? null);

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
      ? layoutMeta?.questionLabels[maPrefix]
      : layoutMeta?.questionLabels[col];
    if (qLabel) {
      const labelEl = document.createElement("div");
      labelEl.className = "col-question-label";
      labelEl.textContent = qLabel;
      nameEl.appendChild(labelEl);
    }

    const sel = document.createElement("select");
    sel.className = "col-type";
    const options = [
      { value: `ma:${maPrefix || col}`, label: "MA" },
      { value: "sa", label: "SA" },
      { value: "weight", label: "WEIGHT" },
      { value: "id", label: "ID（除外）" },
      { value: "exclude", label: "除外" },
    ];
    options.forEach((o) => {
      const opt = document.createElement("option");
      opt.value = o.value;
      opt.textContent = o.label;
      if (o.value === defaultType) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.addEventListener("change", () => {
      colTypes[col] = sel.value;
      if (sel.value === "id" || sel.value === "weight") {
        pick.checked = false;
        colSelected[col] = false;
      }
    });

    item.appendChild(pick);
    item.appendChild(nameEl);
    item.appendChild(sel);
    list.appendChild(item);

    // ウェイト列候補
    const wOpt = document.createElement("option");
    wOpt.value = col;
    wOpt.textContent = col;
    if (defaultType === "weight") wOpt.selected = true;
    weightSel.appendChild(wOpt);
  });

  return { colTypes, colSelected };
}
