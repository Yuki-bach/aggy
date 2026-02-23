import "./style.css";
import { initDropzone } from "./components/Dropzone";
import { initLayoutDropzone } from "./components/LayoutDropzone";
import { initColConfig, type ColConfigState } from "./components/ColConfig";
import { initCrossConfig, getCrossColsSelected } from "./components/CrossConfig";
import { renderResults } from "./components/ResultTable";
import type { AggResult } from "./lib/aggregator";
import {
  initDuckDB,
  runDuckDBAggregation,
} from "./lib/duckdbBridge";
import type { ParseResult } from "./lib/csv";
import type { Layout, LayoutMeta } from "./lib/layout";

// データストア
let parsedData: Record<string, string>[] = [];
let headers: string[] = [];
let colConfig: ColConfigState | null = null;
let layoutMeta: LayoutMeta | null = null;

// DuckDB Wasm をバックグラウンドで初期化開始
initDuckDB().catch(() => {
  // エラーはduckdbBridge内でUI表示済み
});

// CSV読み込みハンドラ
function onCSVLoaded(result: ParseResult, fileName: string): void {
  headers = result.headers;
  parsedData = result.data;

  document.getElementById("file-info")!.textContent =
    `${fileName}  /  ${parsedData.length.toLocaleString()} 件  /  ${headers.length} 列`;

  colConfig = initColConfig(headers, layoutMeta ?? undefined);

  // クロス集計軸候補: SA列（MA以外）
  const saColumns = headers.filter((col) => {
    const t = colConfig!.colTypes[col];
    return t === "sa";
  });
  initCrossConfig(saColumns);

  document.getElementById("col-config-section")!.classList.remove("hidden");
  document.getElementById("weight-section")!.classList.remove("hidden");
  document.getElementById("cross-config-section")!.classList.remove("hidden");
  document.getElementById("run-btn")!.classList.remove("hidden");
  (document.getElementById("run-btn") as HTMLButtonElement).disabled = false;
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

  // CSV読込済みの場合は列設定を再適用
  if (headers.length > 0) {
    colConfig = initColConfig(headers, layoutMeta);
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

function projectRowsForWasm(
  data: Record<string, string>[],
  columnNames: string[]
): Record<string, string>[] {
  const needed = new Set(columnNames);

  return data.map((row) => {
    const projected: Record<string, string> = {};
    needed.forEach((key) => {
      projected[key] = row[key] ?? "";
    });
    return projected;
  });
}

// 集計実行
async function runAggregation(): Promise<void> {
  if (!colConfig) return;
  const cfg = colConfig;
  showError("");

  const weightCol = (
    document.getElementById("weight-col-select") as HTMLSelectElement
  ).value;
  const crossCols = getCrossColsSelected();

  const selectedColumns = headers.filter((col) => cfg.colSelected[col]);
  const selectedSet = new Set(selectedColumns);
  const effectiveWeightCol =
    weightCol && selectedSet.has(weightCol) ? weightCol : "";

  // クロス軸列とウェイト列も投影に含める
  const allNeededCols = [
    ...new Set([
      ...selectedColumns,
      ...crossCols,
      ...(effectiveWeightCol ? [effectiveWeightCol] : []),
    ]),
  ];

  try {
    const sa_cols: string[] = [];
    const ma_groups: Record<string, string[]> = {};
    for (const col of selectedColumns) {
      if (crossCols.includes(col)) continue;
      const t = cfg.colTypes[col];
      if (t === "sa") {
        sa_cols.push(col);
      } else if (t?.startsWith("ma:")) {
        const prefix = t.slice(3);
        (ma_groups[prefix] ??= []).push(col);
      }
    }

    const projectedData = projectRowsForWasm(parsedData, allNeededCols);

    const payload = {
      data: projectedData,
      sa_cols,
      ma_groups,
      weight_col: effectiveWeightCol,
      cross_cols: crossCols,
    };

    const results: AggResult[] = await runDuckDBAggregation(payload);
    renderResults(results, effectiveWeightCol, parsedData.length, layoutMeta ?? undefined);
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
