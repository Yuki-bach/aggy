import { render } from "preact";
import { t } from "../../../lib/i18n";
import { ToggleButton, ToggleGroup } from "../../shared/ToggleButton";

function DataSummary({
  csv,
  layout,
}: {
  csv: { fileName: string; rowCount: number; headers: string[] };
  layout: { fileName: string; colCount: number };
}) {
  return (
    <>
      <div class="mb-1 flex items-baseline gap-2 pl-4">
        <span class="overflow-hidden text-ellipsis whitespace-nowrap text-[0.875rem] text-text">
          {csv.fileName}
        </span>
      </div>
      <div class="mb-1 flex items-baseline gap-2 pl-4">
        <span class="overflow-hidden text-ellipsis whitespace-nowrap text-[0.875rem] text-text">
          {layout.fileName}
        </span>
      </div>
      <div class="mb-1 flex items-baseline gap-2 pl-4">
        <span class="overflow-hidden text-ellipsis whitespace-nowrap text-[0.875rem] text-text">
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
    <ToggleGroup>
      <ToggleButton active={enabled} onClick={() => !enabled || onToggle(true)}>
        {t("weight.on")}
      </ToggleButton>
      <ToggleButton active={!enabled} onClick={() => enabled && onToggle(false)}>
        {t("weight.off")}
      </ToggleButton>
    </ToggleGroup>
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
