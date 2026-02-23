import { initCsvInput, initLayoutInput } from "./components/FileInput";
import { initCrossConfig, getCrossColsSelected } from "./components/CrossConfig";
import { renderResults } from "./components/ResultTable";
import type { QuestionDef } from "./lib/aggregate";
import {
  initDuckDB,
  loadCSV,
  runDuckDBAggregation,
} from "./lib/duckdbBridge";
import { parseLayout, buildLayoutMeta, type Layout, type LayoutMeta } from "./lib/layout";
import { saveData, loadSaved } from "./lib/opfs";
import { initSavedFiles, refreshList } from "./components/SavedFiles";

// データストア
let headers: string[] = [];
let dataRowCount = 0;
let layoutMeta: LayoutMeta | null = null;

// OPFS保存用
let lastCsvText = "";
let lastCsvFileName = "";
let lastLayoutJson = "";
let lastLayoutFileName = "";
let skipNextSave = false;

// DuckDB Wasm をバックグラウンドで初期化開始
initDuckDB().catch(() => {
  // エラーはduckdbBridge内でUI表示済み
});

// headers + colTypes から QuestionDef[] を組み立てる
function buildQuestionDefs(hdrs: string[], colTypes: Record<string, string>): QuestionDef[] {
  const questions: QuestionDef[] = [];
  const maAccum: Record<string, string[]> = {};
  for (const col of hdrs) {
    const t = colTypes[col];
    if (!t) continue;
    if (t === "sa") {
      questions.push({ type: "SA", column: col });
    } else if (t.startsWith("ma:")) {
      (maAccum[t.slice(3)] ??= []).push(col);
    }
  }
  for (const [prefix, cols] of Object.entries(maAccum)) {
    questions.push({ type: "MA", prefix, columns: cols });
  }
  return questions;
}

// CSV + レイアウト両方揃ったらUI初期化
function initAfterBothLoaded(): void {
  if (headers.length === 0 || !layoutMeta) return;

  const crossCandidates = buildQuestionDefs(headers, layoutMeta.colTypes);
  initCrossConfig(crossCandidates, layoutMeta.questionLabels);

  document.getElementById("cross-config-section")!.classList.remove("hidden");
  document.getElementById("run-btn")!.classList.remove("hidden");
  (document.getElementById("run-btn") as HTMLButtonElement).disabled = false;
}

// 読み込み済みデータ情報を表示
function updateLoadedInfo(): void {
  const el = document.getElementById("loaded-data-info")!;
  if (!lastCsvFileName && !lastLayoutFileName) {
    el.classList.add("hidden");
    return;
  }
  const lines: string[] = [];
  if (lastCsvFileName) {
    lines.push(`CSV: ${lastCsvFileName}  —  ${dataRowCount.toLocaleString()} 行 / ${headers.length} 列`);
  }
  if (lastLayoutFileName && layoutMeta) {
    lines.push(`JSON: ${lastLayoutFileName}  —  ${Object.keys(layoutMeta.colTypes).length} 列定義`);
  }
  el.textContent = lines.join("\n");
  el.classList.remove("hidden");
}

// CSV読み込みハンドラ: DuckDBにロードしてheaders/rowCountを取得
async function onCSVLoaded(csvText: string, fileName: string): Promise<void> {
  try {
    const result = await loadCSV(csvText);
    headers = result.headers;
    dataRowCount = result.rowCount;
    lastCsvText = csvText;
    lastCsvFileName = fileName;

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
  layoutMeta = meta;
  lastLayoutJson = rawText;
  lastLayoutFileName = fileName;

  updateLoadedInfo();
  initAfterBothLoaded();
  trySaveToOPFS();
}

// OPFS自動保存（CSV+レイアウト両方揃ったとき）
async function trySaveToOPFS(): Promise<void> {
  if (skipNextSave) return;
  if (!lastCsvText || !lastLayoutJson) return;
  try {
    await saveData(lastCsvFileName, lastCsvText, lastLayoutFileName, lastLayoutJson);
    refreshList();
  } catch (e) {
    console.warn("OPFS save failed:", e);
  }
}

// 保存データから読み込み
async function loadFromSaved(folderId: string): Promise<void> {
  try {
    skipNextSave = true;
    const { csvText, csvName, layoutJson, layoutName } = await loadSaved(folderId);
    const layout = parseLayout(layoutJson);
    const meta = buildLayoutMeta(layout);
    await onCSVLoaded(csvText, csvName);
    onLayoutLoaded(layout, meta, layoutName, layoutJson);
  } catch (e) {
    showError("保存データの読み込みエラー: " + (e as Error).message);
  } finally {
    skipNextSave = false;
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
  if (!layoutMeta) return;
  showError("");

  // ウェイト列はレイアウトから自動決定
  const weightCol =
    Object.entries(layoutMeta.colTypes).find(([, t]) => t === "weight")?.[0] ?? "";
  const crossCols = getCrossColsSelected();

  try {
    const questions = buildQuestionDefs(headers, layoutMeta.colTypes);
    const results = await runDuckDBAggregation({
      questions,
      weight_col: weightCol,
      cross_cols: crossCols,
    });
    renderResults(results, weightCol, dataRowCount, layoutMeta);
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
