import { initCsvInput, initLayoutInput } from "./components/FileInput";
import { initCrossConfig, getCrossColsSelected } from "./components/CrossConfig";
import { renderResults } from "./components/ResultTable";
import {
  initDuckDB,
  loadCSV,
  runDuckDBAggregation,
} from "./lib/duckdbBridge";
import { parseLayout, buildLayoutMeta, buildQuestionDefs, type Layout, type LayoutMeta } from "./lib/layout";
import { saveData, loadSaved } from "./lib/opfs";
import { initSavedFiles, refreshList } from "./components/SavedFiles";

// 現在読み込み済みの CSV / Layout データ
let currentCsv: { text: string; fileName: string; headers: string[]; rowCount: number } | null = null;
let currentLayout: { json: string; fileName: string; meta: LayoutMeta } | null = null;

// テーマ切り替え
function initThemeToggle(): void {
  const toggle = document.getElementById("theme-toggle")!;
  const saved = localStorage.getItem("temotto-theme");
  if (saved === "dark") {
    document.documentElement.dataset.theme = "dark";
    toggle.textContent = "☀️";
    toggle.setAttribute("aria-label", "ライトモードに切り替え");
  }
  toggle.addEventListener("click", () => {
    const isDark = document.documentElement.dataset.theme === "dark";
    if (isDark) {
      delete document.documentElement.dataset.theme;
      toggle.textContent = "🌙";
      toggle.setAttribute("aria-label", "ダークモードに切り替え");
      localStorage.setItem("temotto-theme", "light");
    } else {
      document.documentElement.dataset.theme = "dark";
      toggle.textContent = "☀️";
      toggle.setAttribute("aria-label", "ライトモードに切り替え");
      localStorage.setItem("temotto-theme", "dark");
    }
  });
}

initThemeToggle();

// DuckDB Wasm をバックグラウンドで初期化開始
initDuckDB().catch(() => {
  // エラーはduckdbBridge内でUI表示済み
});

// CSV + レイアウト両方揃ったらUI初期化
function initAfterBothLoaded(): void {
  if (!currentCsv || !currentLayout) return;

  const crossCandidates = buildQuestionDefs(currentCsv.headers, currentLayout.meta.colTypes);
  initCrossConfig(crossCandidates, currentLayout.meta.questionLabels);

  document.getElementById("cross-config-section")!.classList.remove("hidden");
  document.getElementById("run-btn")!.classList.remove("hidden");
  (document.getElementById("run-btn") as HTMLButtonElement).disabled = false;
}

// 読み込み済みデータ情報を表示
function updateLoadedInfo(): void {
  const el = document.getElementById("loaded-data-info")!;
  if (!currentCsv && !currentLayout) {
    el.classList.add("hidden");
    return;
  }
  const lines: string[] = [];
  if (currentCsv) {
    lines.push(`CSV: ${currentCsv.fileName}  —  ${currentCsv.rowCount.toLocaleString()} 行 / ${currentCsv.headers.length} 列`);
  }
  if (currentLayout) {
    lines.push(`JSON: ${currentLayout.fileName}  —  ${Object.keys(currentLayout.meta.colTypes).length} 列定義`);
  }
  el.textContent = lines.join("\n");
  el.classList.remove("hidden");
}

// OPFS自動保存（CSV+レイアウト両方揃ったとき）
async function trySaveToOPFS(): Promise<void> {
  if (!currentCsv || !currentLayout) return;
  try {
    await saveData(currentCsv.fileName, currentCsv.text, currentLayout.fileName, currentLayout.json);
    refreshList();
  } catch (e) {
    console.warn("OPFS save failed:", e);
  }
}

// CSV読み込みハンドラ: DuckDBにロードしてheaders/rowCountを取得
async function onCSVLoaded(csvText: string, fileName: string): Promise<void> {
  try {
    const result = await loadCSV(csvText);
    currentCsv = { text: csvText, fileName, headers: result.headers, rowCount: result.rowCount };

    updateLoadedInfo();
    initAfterBothLoaded();
    trySaveToOPFS();
  } catch (e) {
    showError("CSV読み込みエラー: " + (e as Error).message);
  }
}

// レイアウト読み込みハンドラ
function onLayoutLoaded(
  _layout: Layout,
  meta: LayoutMeta,
  fileName: string,
  rawText: string
): void {
  currentLayout = { json: rawText, fileName, meta };

  updateLoadedInfo();
  initAfterBothLoaded();
  trySaveToOPFS();
}

// 保存データから読み込み（OPFS再保存は不要なのでtrySaveToOPFSを呼ばない）
async function loadFromSaved(folderId: string): Promise<void> {
  try {
    const { csvText, csvName, layoutJson, layoutName } = await loadSaved(folderId);
    const layout = parseLayout(layoutJson);
    const meta = buildLayoutMeta(layout);
    const result = await loadCSV(csvText);

    currentCsv = { text: csvText, fileName: csvName, headers: result.headers, rowCount: result.rowCount };
    currentLayout = { json: layoutJson, fileName: layoutName, meta };

    updateLoadedInfo();
    initAfterBothLoaded();
  } catch (e) {
    showError("保存データの読み込みエラー: " + (e as Error).message);
  }
}

function showError(msg: string): void {
  const el = document.getElementById("error-msg")!;
  if (msg) {
    el.textContent = msg;
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}

// 集計実行
async function runAggregation(): Promise<void> {
  if (!currentCsv || !currentLayout) return;
  showError("");

  // ウェイト列はレイアウトから自動決定
  const weightCol =
    Object.entries(currentLayout.meta.colTypes).find(([, t]) => t === "weight")?.[0] ?? "";
  const crossCols = getCrossColsSelected();

  try {
    const questions = buildQuestionDefs(currentCsv.headers, currentLayout.meta.colTypes);
    const results = await runDuckDBAggregation({
      questions,
      weight_col: weightCol,
      cross_cols: crossCols,
    });
    renderResults(results, weightCol, currentCsv.rowCount, currentLayout.meta, crossCols);
  } catch (e) {
    showError("集計エラー: " + (e as Error).message);
    console.error(e);
  }
}

// タブ切り替え
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".load-tab"));

function activateTab(tab: HTMLButtonElement): void {
  for (const t of tabs) {
    const isActive = t === tab;
    t.classList.toggle("active", isActive);
    t.setAttribute("aria-selected", String(isActive));
    t.tabIndex = isActive ? 0 : -1;
  }
  const target = tab.dataset.tab!;
  document.getElementById("tab-file")!.classList.toggle("hidden", target !== "file");
  document.getElementById("tab-saved")!.classList.toggle("hidden", target !== "saved");
  tab.focus();
}

// 初期状態: 非アクティブタブを tabIndex=-1 に設定
for (const t of tabs) {
  if (!t.classList.contains("active")) t.tabIndex = -1;
}

for (const tab of tabs) {
  tab.addEventListener("click", () => activateTab(tab));
  tab.addEventListener("keydown", (e: KeyboardEvent) => {
    const idx = tabs.indexOf(tab);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      activateTab(tabs[(idx + 1) % tabs.length]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      activateTab(tabs[(idx - 1 + tabs.length) % tabs.length]);
    } else if (e.key === "Home") {
      e.preventDefault();
      activateTab(tabs[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      activateTab(tabs[tabs.length - 1]);
    }
  });
}

// イベントバインド
initCsvInput(onCSVLoaded, (msg) => showError(msg));
initLayoutInput(onLayoutLoaded, (msg) => showError(msg));
initSavedFiles(loadFromSaved);

document.getElementById("run-btn")!.addEventListener("click", () => {
  runAggregation().catch((e) => showError("集計エラー: " + (e as Error).message));
});
