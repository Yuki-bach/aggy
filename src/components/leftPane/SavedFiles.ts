import { listSaved, deleteSaved } from "../../lib/opfs";

type OnSelectCallback = (folderId: string) => void;

let onSelect: OnSelectCallback = () => {};

export function initSavedFiles(onSelectCb: OnSelectCallback): void {
  onSelect = onSelectCb;
  refreshList();
}

export async function refreshList(): Promise<void> {
  const container = document.getElementById("saved-files-list")!;

  let entries;
  try {
    entries = await listSaved();
  } catch {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = "";

  if (entries.length === 0) {
    container.innerHTML = `<div class="saved-empty">保存データなし</div>`;
    return;
  }

  for (const entry of entries) {
    const row = document.createElement("div");
    row.className = "saved-item";

    const loadBtn = document.createElement("button");
    loadBtn.className = "saved-item-load";
    loadBtn.type = "button";
    const date = new Date(entry.timestamp);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
    loadBtn.textContent = `${entry.csvName}  (${dateStr})`;
    loadBtn.addEventListener("click", () => onSelect(entry.folderId));

    const delBtn = document.createElement("button");
    delBtn.className = "saved-item-del";
    delBtn.type = "button";
    delBtn.textContent = "×";
    delBtn.setAttribute("aria-label", `${entry.csvName} を削除`);
    delBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await deleteSaved(entry.folderId);
      refreshList();
    });

    row.appendChild(loadBtn);
    row.appendChild(delBtn);
    container.appendChild(row);
  }
}
