import "./style.css";
import { initDropzone } from "./components/Dropzone";
import { initLayoutDropzone } from "./components/LayoutDropzone";
import { initCrossConfig, getCrossColsSelected } from "./components/CrossConfig";
import { renderResults } from "./components/ResultTable";
import type { QuestionDef } from "./lib/aggregator";
import {
  initDuckDB,
  loadCSV,
  runDuckDBAggregation,
} from "./lib/duckdbBridge";
import type { Layout, LayoutMeta } from "./lib/layout";

// データストア
let headers: string[] = [];
let dataRowCount = 0;
let layoutMeta: LayoutMeta | null = null;

// DuckDB Wasm をバックグラウンドで初期化開始
initDuckDB().catch(() => {
  // エラーはduckdbBridge内でUI表示済み
});

// CSV + レイアウト両方揃ったらUI初期化
function initAfterBothLoaded(): void {
  if (headers.length === 0 || !layoutMeta) return;

  // クロス集計軸候補: SA列 + MAグループ
  const crossCandidates: QuestionDef[] = [];
  const maAccumForCross: Record<string, string[]> = {};
  for (const col of headers) {
    const t = layoutMeta!.colTypes[col];
    if (!t) continue;
    if (t === "sa") {
      crossCandidates.push({ key: col, columns: [col], type: "SA" });
    } else if (t.startsWith("ma:")) {
      const prefix = t.slice(3);
      (maAccumForCross[prefix] ??= []).push(col);
    }
  }
  for (const [prefix, cols] of Object.entries(maAccumForCross)) {
    crossCandidates.push({ key: prefix, columns: cols, type: "MA" });
  }
  initCrossConfig(crossCandidates, layoutMeta!.questionLabels);

  document.getElementById("cross-config-section")!.classList.remove("hidden");
  document.getElementById("run-btn")!.classList.remove("hidden");
  (document.getElementById("run-btn") as HTMLButtonElement).disabled = false;
}

// CSV読み込みハンドラ: DuckDBにロードしてheaders/rowCountを取得
async function onCSVLoaded(csvText: string, fileName: string): Promise<void> {
  try {
    const result = await loadCSV(csvText);
    headers = result.headers;
    dataRowCount = result.rowCount;

    document.getElementById("file-info")!.textContent =
      `${fileName}  /  ${dataRowCount.toLocaleString()} 件  /  ${headers.length} 列`;

    initAfterBothLoaded();
  } catch (e) {
    showError("CSV読み込みエラー: " + (e as Error).message);
  }
}

// レイアウト読み込みハンドラ
function onLayoutLoaded(
  _layout: Layout,
  meta: LayoutMeta,
  fileName: string
): void {
  layoutMeta = meta;

  document.getElementById("layout-file-info")!.textContent =
    `${fileName}  /  ${Object.keys(meta.colTypes).length} 列定義`;

  initAfterBothLoaded();
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
    // layoutMeta.colTypes から全SA/MA列を questions に変換
    const questions: QuestionDef[] = [];
    const maAccum: Record<string, string[]> = {};
    for (const col of headers) {
      const t = layoutMeta.colTypes[col];
      if (!t) continue;
      if (t === "sa") {
        questions.push({ key: col, columns: [col], type: "SA" });
      } else if (t.startsWith("ma:")) {
        const prefix = t.slice(3);
        (maAccum[prefix] ??= []).push(col);
      }
    }
    for (const [prefix, cols] of Object.entries(maAccum)) {
      questions.push({ key: prefix, columns: cols, type: "MA" });
    }

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

// イベントバインド
initDropzone(onCSVLoaded, (msg) => showError(msg));
initLayoutDropzone(onLayoutLoaded, (msg) => showError(msg));

document.getElementById("run-btn")!.addEventListener("click", () => {
  runAggregation().catch((e) => showError("集計エラー: " + (e as Error).message));
});
