import { render } from "preact";
import { t } from "../../../lib/i18n";

function DataSummary({
  csv,
  layout,
}: {
  csv: { fileName: string; rowCount: number; headers: string[] };
  layout: { fileName: string; colCount: number };
}) {
  return (
    <>
      <div class="data-summary-row indent">
        <span class="data-summary-value">{csv.fileName}</span>
      </div>
      <div class="data-summary-row indent">
        <span class="data-summary-value">{layout.fileName}</span>
      </div>
      <div class="data-summary-row indent">
        <span class="data-summary-value">
          {t("summary.rows", { rows: csv.rowCount.toLocaleString(), cols: csv.headers.length })}
        </span>
      </div>
    </>
  );
}

export function renderDataSummary(
  csv: { fileName: string; rowCount: number; headers: string[] },
  layout: { fileName: string; colCount: number },
): void {
  const el = document.getElementById("data-summary")!;
  render(<DataSummary csv={csv} layout={layout} />, el);
}

// Weight toggle state
let weightEnabled = true;

export function getWeightEnabled(): boolean {
  return weightEnabled;
}

function WeightToggle({
  weightCol,
  enabled,
  onToggle,
}: {
  weightCol: string;
  enabled: boolean;
  onToggle: (on: boolean) => void;
}) {
  return (
    <>
      <button
        class={`view-toggle-btn${enabled ? " active" : ""}`}
        onClick={() => !enabled || onToggle(true)}
      >
        {t("weight.on")}
      </button>
      <button
        class={`view-toggle-btn${!enabled ? " active" : ""}`}
        onClick={() => enabled && onToggle(false)}
      >
        {t("weight.off")}
      </button>
    </>
  );
}

function renderWeightToggle(weightCol: string): void {
  const toggle = document.getElementById("weight-toggle")!;
  render(
    <WeightToggle
      weightCol={weightCol}
      enabled={weightEnabled}
      onToggle={(on) => {
        weightEnabled = on;
        renderWeightToggle(weightCol);
      }}
    />,
    toggle,
  );
}

export function renderWeightInfo(weightCol: string): void {
  const el = document.getElementById("weight-info")!;
  if (weightCol) {
    const label = document.getElementById("weight-label")!;
    label.textContent = t("weight.label", { col: weightCol });
    renderWeightToggle(weightCol);
    el.classList.remove("hidden");
  } else {
    weightEnabled = true;
    el.classList.add("hidden");
  }
}
