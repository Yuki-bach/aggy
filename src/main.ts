import "./style.css";
import { initDropzone } from "./components/Dropzone";
import { initColConfig, type ColConfigState } from "./components/ColConfig";
import { renderResults } from "./components/ResultTable";
import { aggregate, type AggResult } from "./lib/aggregate";
import {
  initRubyVM,
  isReady as isWasmReady,
  runRubyAggregation,
} from "./lib/wasmBridge";
import type { ParseResult } from "./lib/csv";

// データストア
let parsedData: Record<string, string>[] = [];
let headers: string[] = [];
let colConfig: ColConfigState | null = null;

// Ruby Wasm をバックグラウンドで初期化開始
initRubyVM().catch(() => {
  // エラーはwasmBridge内でUI表示済み。JSフォールバックで動作継続。
});

// CSV読み込みハンドラ
function onCSVLoaded(result: ParseResult, fileName: string): void {
  headers = result.headers;
  parsedData = result.data;

  document.getElementById("file-info")!.textContent =
    `${fileName}  /  ${parsedData.length.toLocaleString()} 件  /  ${headers.length} 列`;

  colConfig = initColConfig(headers);

  document.getElementById("col-config-section")!.classList.remove("hidden");
  document.getElementById("weight-section")!.classList.remove("hidden");
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
function runAggregation(): void {
  if (!colConfig) return;
  const cfg = colConfig;
  showError("");

  const weightCol = (
    document.getElementById("weight-col-select") as HTMLSelectElement
  ).value;
  const selectedColumns = headers.filter((col) => cfg.colSelected[col]);
  const selectedSet = new Set(selectedColumns);
  const effectiveWeightCol =
    weightCol && selectedSet.has(weightCol) ? weightCol : "";

  try {
    let results: AggResult[];

    if (isWasmReady()) {
      // Ruby Wasm で集計
      const columns = selectedColumns
        .filter((col) => {
          const t = cfg.colTypes[col];
          return t === "sa" || (t && t.startsWith("ma:"));
        })
        .map((col) => {
          const t = cfg.colTypes[col];
          if (t.startsWith("ma:")) {
            return { name: col, type: "ma", ma_group: t.slice(3) };
          }
          return { name: col, type: "sa" };
        });

      const projectedData = projectRowsForWasm(parsedData, selectedColumns);

      const payload = {
        data: projectedData,
        columns,
        weight_col: effectiveWeightCol,
      };

      results = runRubyAggregation(payload);
    } else {
      // JSフォールバック
      const effectiveColTypes = { ...cfg.colTypes };
      headers.forEach((col) => {
        if (!selectedSet.has(col)) {
          effectiveColTypes[col] = "exclude";
        }
      });

      const projectedData = projectRowsForWasm(parsedData, selectedColumns);
      results = aggregate(
        projectedData,
        headers,
        effectiveColTypes,
        effectiveWeightCol
      );
    }

    renderResults(results, effectiveWeightCol, parsedData.length);
  } catch (e) {
    showError("集計エラー: " + (e as Error).message);
    console.error(e);
  }
}

// イベントバインド
initDropzone(onCSVLoaded, (msg) => showError(msg));

document.getElementById("run-btn")!.addEventListener("click", runAggregation);
