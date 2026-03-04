import { useEffect, useRef, useState } from "preact/hooks";
import CrossConfig from "./aggregation/CrossConfig";
import ResultView from "./aggregation/ResultView";
import { AggregationContext, type AggregationContextValue } from "./aggregation/AggregationContext";
import { runAggregation, getHeaders, getRowCount } from "../lib/duckdbBridge";
import { filterLayout, buildQuestions, findWeightColumn } from "../lib/layout";
import type { Question } from "../lib/agg/types";
import { t } from "../lib/i18n";
import { ToggleButton, ToggleGroup } from "./shared/ToggleButton";
import type { CsvData, LayoutData } from "../lib/types";

interface AggregationScreenProps {
  csv: CsvData;
  layout: LayoutData;
}

export default function AggregationScreen({ csv, layout }: AggregationScreenProps) {
  const weightCol = findWeightColumn(layout.layout);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [summaryInfo, setSummaryInfo] = useState<{ rowCount: number; colCount: number } | null>(
    null,
  );
  const [crossSelected, setCrossSelected] = useState<Record<string, boolean>>({});
  const [weightEnabled, setWeightEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [aggCtx, setAggCtx] = useState<AggregationContextValue | null>(null);

  const questionsRef = useRef(questions);
  questionsRef.current = questions;

  // Initialize: fetch headers from bridge, build questions, then auto-run aggregation
  useEffect(() => {
    (async () => {
      try {
        const [headers, rowCount] = await Promise.all([getHeaders(), getRowCount()]);
        const filtered = filterLayout(headers, layout.layout);
        const qs = buildQuestions(filtered);
        const sel: Record<string, boolean> = {};
        qs.forEach((q) => (sel[q.code] = false));

        setQuestions(qs);
        setCrossSelected(sel);
        setSummaryInfo({ rowCount, colCount: headers.length });

        // Auto-run GT aggregation
        const wCol = weightCol;
        const tallies = await runAggregation(qs, [], wCol);
        setAggCtx({ tallies, weightCol: wCol });
      } catch (e) {
        setErrorMsg(t("error.aggregation", { msg: (e as Error).message }));
        console.error(e);
      }
    })();
  }, []);

  async function handleRunAggregation(): Promise<void> {
    setErrorMsg("");

    const wCol = weightEnabled ? weightCol : "";
    const crossCols = questionsRef.current.filter((q) => crossSelected[q.code]);

    try {
      const tallies = await runAggregation(questionsRef.current, crossCols, wCol);
      setAggCtx({
        tallies,
        weightCol: wCol,
      });
    } catch (e) {
      setErrorMsg(t("error.aggregation", { msg: (e as Error).message }));
      console.error(e);
    }
  }

  return (
    <>
      {/* Left Panel */}
      <div
        class="flex flex-col overflow-hidden border-r border-border bg-surface max-md:max-h-[50vh] max-md:border-b max-md:border-r-0"
        role="region"
        aria-label={t("section.settings")}
      >
        {/* Data Summary */}
        <section class="shrink-0 border-b border-border p-4">
          <h2 class="mb-3 text-sm font-bold tracking-wider text-muted">{t("section.summary")}</h2>
          <div class="text-sm leading-relaxed text-text-secondary">
            <DataSummary
              csvFileName={csv.fileName}
              layoutFileName={layout.fileName}
              summaryInfo={summaryInfo}
            />
          </div>
        </section>

        {/* Cross Config */}
        <section class="flex min-h-0 flex-1 flex-col overflow-hidden border-b border-border p-4">
          <h2 class="mb-3 text-sm font-bold tracking-wider text-muted">{t("section.cross")}</h2>
          <div
            class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
            role="group"
            aria-label={t("section.cross.label")}
          >
            <CrossConfig
              questions={questions}
              crossSelected={crossSelected}
              onToggle={(key, checked) => setCrossSelected((prev) => ({ ...prev, [key]: checked }))}
            />
          </div>
        </section>

        {/* Weight Info */}
        {weightCol && (
          <WeightInfo weightCol={weightCol} enabled={weightEnabled} onToggle={setWeightEnabled} />
        )}

        {/* Error Message */}
        {errorMsg && (
          <div
            class="mx-4 shrink-0 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-sm leading-normal text-danger"
            role="alert"
            aria-live="assertive"
          >
            {errorMsg}
          </div>
        )}

        {/* Run Button */}
        <button
          class="mx-4 my-4 min-h-12 w-[calc(100%-32px)] shrink-0 cursor-pointer rounded-lg border-none bg-accent text-base font-bold tracking-wide text-accent-contrast transition-[background] duration-150 hover:bg-accent-hover active:bg-[var(--color-primary-900)]"
          onClick={() => handleRunAggregation()}
        >
          {t("run.button")}
        </button>
      </div>

      {/* Right Panel */}
      <div class="overflow-y-auto bg-bg p-6" role="region" aria-label={t("section.results")}>
        {aggCtx ? (
          <div aria-live="polite">
            <AggregationContext.Provider value={aggCtx}>
              <ResultView />
            </AggregationContext.Provider>
          </div>
        ) : (
          <div class="flex h-full flex-col items-center justify-center gap-3 text-muted">
            <span class="text-4xl" aria-hidden="true">
              ⬛
            </span>
            <p class="text-base">{t("empty.text")}</p>
          </div>
        )}
      </div>
    </>
  );
}

export function DataSummary({
  csvFileName,
  layoutFileName,
  summaryInfo,
}: {
  csvFileName: string;
  layoutFileName: string;
  summaryInfo: { rowCount: number; colCount: number } | null;
}) {
  return (
    <>
      <div class="mb-1 flex items-baseline gap-2 pl-4">
        <span class="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-text">
          {csvFileName}
        </span>
      </div>
      <div class="mb-1 flex items-baseline gap-2 pl-4">
        <span class="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-text">
          {layoutFileName}
        </span>
      </div>
      {summaryInfo && (
        <div class="mb-1 flex items-baseline gap-2 pl-4">
          <span class="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-text">
            {t("summary.rows", {
              rows: summaryInfo.rowCount.toLocaleString(),
              cols: summaryInfo.colCount,
            })}
          </span>
        </div>
      )}
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
