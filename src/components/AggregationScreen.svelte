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
  let matrixLabels = $derived(
    Object.fromEntries(buildMatrixGroups(preparedLayout).map((g) => [g.matrixKey, g.matrixLabel])),
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

  async function handleRunAggregation(): Promise<void> {
    errorMsg = "";
    const activeWeightCol = weightEnabled ? weightColumnName : "";
    const crossQuestions = questions.filter((q) => crossSelected[q.code]);

    try {
      const tabs = await runAggregation(questions, crossQuestions, activeWeightCol, matrixLabels);
      aggResult = { tabs, weightCol: activeWeightCol };
    } catch (e) {
      errorMsg = t("error.aggregation", { msg: (e as Error).message });
    }
  }

  // Auto-run aggregation whenever cross selection or weight toggle changes
  $effect(() => {
    if (questions.length === 0) return;
    void handleRunAggregation();
  });
</script>

<SettingsPanel {rawData} {layout} {dateWarnings} />

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
