<script lang="ts">
  import type { RawData, LayoutData, Tab } from "../lib/types";
  import ResultPanel from "./aggregation/ResultPanel.svelte";
  import SettingsPanel from "./aggregation/SettingsPanel.svelte";
  import { runAggregation } from "../lib/duckdb.svelte";
  import type { Layout } from "../lib/layout";
  import { buildQuestions, buildMatrixGroups, findWeightColumn } from "../lib/layout";
  import { t } from "../lib/i18n.svelte";

  interface Props {
    rawData: RawData;
    layout: LayoutData;
    preparedLayout: Layout;
    dateWarnings: string[];
  }

  let { rawData, layout, preparedLayout, dateWarnings }: Props = $props();

  let questions = $derived(buildQuestions(preparedLayout));
  let weightColumnName = $derived(findWeightColumn(preparedLayout));
  let matrixGroups = $derived(buildMatrixGroups(preparedLayout));
  let matrixLabels = $derived(
    Object.fromEntries(matrixGroups.map((g) => [g.matrixKey, g.matrixLabel])),
  );

  let crossSelected = $state<Record<string, boolean>>({});
  let weightEnabled = $state(true);
  let errorMsg = $state("");
  let aggResult = $state<{ tabs: Tab[]; weightCol: string } | null>(null);

  // Initialize crossSelected when questions change
  $effect(() => {
    const sel: Record<string, boolean> = {};
    for (const q of questions) sel[q.code] = false;
    crossSelected = sel;
  });

  // Increments per scheduled run; only the latest run is allowed to commit results
  let latestRunId = 0;

  async function handleRunAggregation(runId: number): Promise<void> {
    const activeWeightCol = weightEnabled ? weightColumnName : "";
    const crossQuestions = questions.filter((q) => crossSelected[q.code]);

    try {
      const tabs = await runAggregation(questions, crossQuestions, activeWeightCol, matrixLabels);
      if (runId !== latestRunId) return;
      aggResult = { tabs, weightCol: activeWeightCol };
      errorMsg = "";
    } catch (e) {
      if (runId !== latestRunId) return;
      errorMsg = t("error.aggregation", { msg: (e as Error).message });
    }
  }

  // Auto-run aggregation whenever cross selection or weight toggle changes.
  // A monotonic runId is captured per scheduling; older runs that finish later are dropped.
  $effect(() => {
    if (questions.length === 0) return;
    const runId = ++latestRunId;
    void handleRunAggregation(runId);
  });
</script>

<SettingsPanel {rawData} {layout} {questions} {matrixGroups} {dateWarnings} />

<ResultPanel
  tabs={aggResult?.tabs ?? null}
  weightCol={aggResult?.weightCol ?? ""}
  {questions}
  {crossSelected}
  onCrossToggle={(key, checked) => (crossSelected = { ...crossSelected, [key]: checked })}
  {weightColumnName}
  {weightEnabled}
  onWeightToggle={(on) => (weightEnabled = on)}
  {errorMsg}
/>
