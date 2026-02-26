import { t } from "../../../lib/i18n";
import { ToggleButton, ToggleGroup } from "../../shared/ToggleButton";

export function DataSummary({
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

export function WeightInfo({
  weightCol,
  enabled,
  onToggle,
}: {
  weightCol: string;
  enabled: boolean;
  onToggle: (on: boolean) => void;
}) {
  return (
    <div class="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 text-[0.875rem] text-text">
      <span>{t("weight.label", { col: weightCol })}</span>
      <div class="ml-auto flex">
        <ToggleGroup>
          <ToggleButton active={enabled} onClick={() => onToggle(true)}>
            {t("weight.on")}
          </ToggleButton>
          <ToggleButton active={!enabled} onClick={() => onToggle(false)}>
            {t("weight.off")}
          </ToggleButton>
        </ToggleGroup>
      </div>
    </div>
  );
}
