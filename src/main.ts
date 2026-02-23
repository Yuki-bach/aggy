import "./style.css";
import { initDropzone } from "./components/Dropzone";
import { initLayoutDropzone } from "./components/LayoutDropzone";
import { initColConfig, type ColConfigState } from "./components/ColConfig";
import { initCrossConfig, getCrossColsSelected } from "./components/CrossConfig";
import { renderResults } from "./components/ResultTable";
import type { AggResult, QuestionDef } from "./lib/aggregator";
import {
  initDuckDB,
  runDuckDBAggregation,
} from "./lib/duckdbBridge";
import type { ParseResult } from "./lib/csv";
import type { Layout, LayoutMeta } from "./lib/layout";

// データストア
let parsedData: Record<string, string>[] = [];
let rawCSVText = "";
let headers: string[] = [];
let colConfig: ColConfigState | null = null;
let layoutMeta: LayoutMeta | null = null;

// DuckDB Wasm をバックグラウンドで初期化開始
initDuckDB().catch(() => {
  // エラーはduckdbBridge内でUI表示済み
});

// CSV + レイアウト両方揃ったらUI初期化
function initAfterBothLoaded(): void {
  if (headers.length === 0 || !layoutMeta) return;

  colConfig = initColConfig(headers, layoutMeta);

  // クロス集計軸候補: SA列のみ
  const saColumns = headers.filter((col) => colConfig!.colTypes[col] === "sa");
  initCrossConfig(saColumns);

  document.getElementById("col-config-section")!.classList.remove("hidden");
  document.getElementById("cross-config-section")!.classList.remove("hidden");
  document.getElementById("run-btn")!.classList.remove("hidden");
  (document.getElementById("run-btn") as HTMLButtonElement).disabled = false;
}

// CSV読み込みハンドラ
function onCSVLoaded(result: ParseResult, fileName: string): void {
  headers = result.headers;
  parsedData = result.data;
  rawCSVText = result.rawText;

  document.getElementById("file-info")!.textContent =
    `${fileName}  /  ${parsedData.length.toLocaleString()} 件  /  ${headers.length} 列`;

  initAfterBothLoaded();
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
  if (!colConfig || !layoutMeta) return;
  const cfg = colConfig;
  showError("");

  // ウェイト列はレイアウトから自動決定
  const weightCol =
    Object.entries(layoutMeta.colTypes).find(([, t]) => t === "weight")?.[0] ?? "";
  const crossCols = getCrossColsSelected();

  const selectedColumns = headers.filter((col) => cfg.colSelected[col]);

  try {
    const questions: QuestionDef[] = [];
    const maAccum: Record<string, string[]> = {};
    for (const col of selectedColumns) {
      if (crossCols.includes(col)) continue;
      const t = cfg.colTypes[col];
      if (t === "sa") {
        questions.push({ key: col, columns: [col], type: "SA" });
      } else if (t?.startsWith("ma:")) {
        const prefix = t.slice(3);
        (maAccum[prefix] ??= []).push(col);
      }
    }
    for (const [prefix, cols] of Object.entries(maAccum)) {
      questions.push({ key: prefix, columns: cols, type: "MA" });
    }

    const payload = {
      csvText: rawCSVText,
      questions,
      weight_col: weightCol,
      cross_cols: crossCols,
    };

    const results: AggResult[] = await runDuckDBAggregation(payload);
    renderResults(results, weightCol, parsedData.length, layoutMeta);
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
