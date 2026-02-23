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

// 中間状態: CSV / Layout それぞれ到着時にオブジェクトごと差し替え
let pendingCsv: { text: string; fileName: string; headers: string[]; rowCount: number } | null = null;
let pendingLayout: { json: string; fileName: string; meta: LayoutMeta } | null = null;

// DuckDB Wasm をバックグラウンドで初期化開始
initDuckDB().catch(() => {
  // エラーはduckdbBridge内でUI表示済み
});

// CSV + レイアウト両方揃ったらUI初期化
function initAfterBothLoaded(): void {
  if (!pendingCsv || !pendingLayout) return;

  const crossCandidates = buildQuestionDefs(pendingCsv.headers, pendingLayout.meta.colTypes);
  initCrossConfig(crossCandidates, pendingLayout.meta.questionLabels);

  document.getElementById("cross-config-section")!.classList.remove("hidden");
  document.getElementById("run-btn")!.classList.remove("hidden");
  (document.getElementById("run-btn") as HTMLButtonElement).disabled = false;
}

// 読み込み済みデータ情報を表示
function updateLoadedInfo(): void {
  const el = document.getElementById("loaded-data-info")!;
  if (!pendingCsv && !pendingLayout) {
    el.classList.add("hidden");
    return;
  }
  const lines: string[] = [];
  if (pendingCsv) {
    lines.push(`CSV: ${pendingCsv.fileName}  —  ${pendingCsv.rowCount.toLocaleString()} 行 / ${pendingCsv.headers.length} 列`);
  }
  if (pendingLayout) {
    lines.push(`JSON: ${pendingLayout.fileName}  —  ${Object.keys(pendingLayout.meta.colTypes).length} 列定義`);
  }
  el.textContent = lines.join("\n");
  el.classList.remove("hidden");
}

// OPFS自動保存（CSV+レイアウト両方揃ったとき）
async function trySaveToOPFS(): Promise<void> {
  if (!pendingCsv || !pendingLayout) return;
  try {
    await saveData(pendingCsv.fileName, pendingCsv.text, pendingLayout.fileName, pendingLayout.json);
    refreshList();
  } catch (e) {
    console.warn("OPFS save failed:", e);
  }
}

// CSV読み込みハンドラ: DuckDBにロードしてheaders/rowCountを取得
async function onCSVLoaded(csvText: string, fileName: string): Promise<void> {
  try {
    const result = await loadCSV(csvText);
    pendingCsv = { text: csvText, fileName, headers: result.headers, rowCount: result.rowCount };

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
  pendingLayout = { json: rawText, fileName, meta };

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

    pendingCsv = { text: csvText, fileName: csvName, headers: result.headers, rowCount: result.rowCount };
    pendingLayout = { json: layoutJson, fileName: layoutName, meta };

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
  if (!pendingCsv || !pendingLayout) return;
  showError("");

  // ウェイト列はレイアウトから自動決定
  const weightCol =
    Object.entries(pendingLayout.meta.colTypes).find(([, t]) => t === "weight")?.[0] ?? "";
  const crossCols = getCrossColsSelected();

  try {
    const questions = buildQuestionDefs(pendingCsv.headers, pendingLayout.meta.colTypes);
    const results = await runDuckDBAggregation({
      questions,
      weight_col: weightCol,
      cross_cols: crossCols,
    });
    renderResults(results, weightCol, pendingCsv.rowCount, pendingLayout.meta);
  } catch (e) {
    showError("集計エラー: " + (e as Error).message);
    console.error(e);
  }
}

// タブ切り替え
for (const tab of document.querySelectorAll<HTMLButtonElement>(".load-tab")) {
  tab.addEventListener("click", () => {
    for (const t of document.querySelectorAll<HTMLButtonElement>(".load-tab")) {
      t.classList.toggle("active", t === tab);
    }
    const target = tab.dataset.tab!;
    document.getElementById("tab-file")!.classList.toggle("hidden", target !== "file");
    document.getElementById("tab-saved")!.classList.toggle("hidden", target !== "saved");
  });
}

// イベントバインド
initCsvInput(onCSVLoaded, (msg) => showError(msg));
initLayoutInput(onLayoutLoaded, (msg) => showError(msg));
initSavedFiles(loadFromSaved);

document.getElementById("run-btn")!.addEventListener("click", () => {
  runAggregation().catch((e) => showError("集計エラー: " + (e as Error).message));
});
