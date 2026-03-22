import type { Question } from "../../lib/agg/types";
import { t } from "../../lib/i18n";
import { Button } from "../shared/Button";
import { ToggleButton, ToggleGroup } from "../shared/ToggleButton";
import { SectionTitle } from "../shared/SectionTitle";
import { Alert } from "../shared/Alert";
import type { RawData, LayoutData } from "../../lib/types";
import type { Layout } from "../../lib/layout";
import { countLayoutColumns } from "../../lib/layout";

interface SettingsPanelProps {
  rawData: RawData;
  layout: LayoutData;
  preparedLayout: Layout;
  questions: Question[];
  crossSelected: Record<string, boolean>;
  onCrossToggle: (key: string, checked: boolean) => void;
  weightCol: string;
  weightEnabled: boolean;
  onWeightToggle: (on: boolean) => void;
  dateWarnings: string[];
  errorMsg: string;
  onRun: () => void;
}

export default function SettingsPanel({
  rawData,
  layout,
  preparedLayout,
  questions,
  crossSelected,
  onCrossToggle,
  weightCol,
  weightEnabled,
  onWeightToggle,
  dateWarnings,
  errorMsg,
  onRun,
}: SettingsPanelProps) {
  return (
    <div
      class="flex flex-col overflow-hidden border-r border-border bg-surface max-md:max-h-[50vh] max-md:border-b max-md:border-r-0"
      role="region"
      aria-label={t("section.settings")}
    >
      {/* Data Summary */}
      <section class="shrink-0 border-b border-border p-4">
        <SectionTitle>{t("section.summary")}</SectionTitle>
        <div class="text-sm leading-relaxed text-text-secondary">
          <DataSummary
            rawData={{
              fileName: rawData.fileName,
              rowCount: rawData.rowCount,
              headers: rawData.headers,
            }}
            layout={{
              fileName: layout.fileName,
              colCount: countLayoutColumns(preparedLayout),
            }}
          />
        </div>
      </section>

      {/* Cross Config */}
      <section class="flex min-h-0 flex-1 flex-col overflow-hidden border-b border-border p-4">
        <SectionTitle>{t("section.cross")}</SectionTitle>
        <div
          class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
          role="group"
          aria-label={t("section.cross.label")}
        >
          <CrossConfig
            questions={questions.filter((q) => q.type !== "NA")}
            crossSelected={crossSelected}
            onToggle={onCrossToggle}
          />
        </div>
      </section>

      {/* Weight Info */}
      {weightCol && (
        <WeightInfo weightCol={weightCol} enabled={weightEnabled} onToggle={onWeightToggle} />
      )}

      {/* Date Warnings */}
      {dateWarnings.length > 0 && (
        <Alert variant="warning" role="status" class="mx-4 shrink-0">
          {dateWarnings.map((w) => {
            const [col, count] = w.split(":");
            return <p key={w}>{t("warn.date.cast", { col, count })}</p>;
          })}
        </Alert>
      )}

      {/* Error Message */}
      {errorMsg && (
        <Alert variant="error" class="mx-4 shrink-0">
          {errorMsg}
        </Alert>
      )}

      {/* Run Button */}
      <div class="mx-4 my-4 shrink-0">
        <Button variant="primary" size="lg" fullWidth onClick={onRun}>
          {t("run.button")}
        </Button>
      </div>
    </div>
  );
}

function CrossConfig({
  questions,
  crossSelected,
  onToggle,
}: {
  questions: Question[];
  crossSelected: Record<string, boolean>;
  onToggle: (key: string, checked: boolean) => void;
}) {
  return (
    <>
      {questions.map((q) => {
        const typeTag = q.type === "MA" ? " [MA]" : "";
        const hasLabel = q.label !== q.code;
        const displayText = hasLabel ? `${q.code}: ${q.label}${typeTag}` : `${q.code}${typeTag}`;

        return (
          <label
            key={q.code}
            class="flex min-h-9 cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-surface2"
          >
            <input
              type="checkbox"
              class="size-4.5 cursor-pointer accent-accent"
              checked={crossSelected[q.code] ?? false}
              onChange={(e) => {
                onToggle(q.code, (e.target as HTMLInputElement).checked);
              }}
            />{" "}
            {displayText}
          </label>
        );
      })}
    </>
  );
}

export function DataSummary({
  rawData,
  layout,
}: {
  rawData: { fileName: string; rowCount: number; headers: string[] };
  layout: { fileName: string; colCount: number };
}) {
  return (
    <>
      <div class="mb-1 flex items-baseline gap-2 pl-4">
        <span class="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-text">
          {rawData.fileName}
        </span>
      </div>
      <div class="mb-1 flex items-baseline gap-2 pl-4">
        <span class="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-text">
          {layout.fileName}
        </span>
      </div>
      <div class="mb-1 flex items-baseline gap-2 pl-4">
        <span class="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-text">
          {t("summary.rows", {
            rows: rawData.rowCount.toLocaleString(),
            cols: rawData.headers.length,
          })}
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
    <div class="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 text-sm text-text">
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
