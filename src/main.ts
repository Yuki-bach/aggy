import "./style.css";
import { initDropzone } from "./components/Dropzone";
import { initColConfig, type ColConfigState } from "./components/ColConfig";
import { initCrossConfig, getCrossColsSelected } from "./components/CrossConfig";
import { renderResults } from "./components/ResultTable";
import type { AggResult } from "./lib/aggregator";
import {
  initDuckDB,
  runDuckDBAggregation,
} from "./lib/duckdbBridge";
import type { ParseResult } from "./lib/csv";

// データストア
let parsedData: Record<string, string>[] = [];
let headers: string[] = [];
let colConfig: ColConfigState | null = null;

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

  colConfig = initColConfig(headers);

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
    const columns = selectedColumns
      .filter((col) => {
        const t = cfg.colTypes[col];
        return (
          (t === "sa" || (t && t.startsWith("ma:"))) &&
          !crossCols.includes(col)
        );
      })
      .map((col) => {
        const t = cfg.colTypes[col];
        if (t.startsWith("ma:")) {
          return { name: col, type: "ma" as const, ma_group: t.slice(3) };
        }
        return { name: col, type: "sa" as const };
      });

    const projectedData = projectRowsForWasm(parsedData, allNeededCols);

    const payload = {
      data: projectedData,
      columns,
      weight_col: effectiveWeightCol,
      mode: (crossCols.length > 0 ? "cross" : "gt") as "gt" | "cross",
      cross_cols: crossCols,
    };

    const results: AggResult[] = await runDuckDBAggregation(payload);
    renderResults(results, effectiveWeightCol, parsedData.length);
  } catch (e) {
    showError("集計エラー: " + (e as Error).message);
    console.error(e);
  }
}

// イベントバインド
initDropzone(onCSVLoaded, (msg) => showError(msg));

document.getElementById("run-btn")!.addEventListener("click", () => {
  runAggregation().catch((e) => showError("集計エラー: " + (e as Error).message));
});
