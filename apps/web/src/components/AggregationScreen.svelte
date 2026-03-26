<script lang="ts">
  import { onMount } from "svelte";
  import type { Tab, Layout, RawData, LayoutData } from "@aggy/lib";
  import { buildQuestions, findWeightColumn } from "@aggy/lib";
  import ResultPanel from "./aggregation/ResultPanel.svelte";
  import SettingsPanel from "./aggregation/SettingsPanel.svelte";
  import { runAggregation } from "../lib/duckdb";
  import { t } from "../lib/i18n.svelte";

  interface Props {
    rawData: RawData;
    layout: LayoutData;
    preparedLayout: Layout;
    dateWarnings: string[];
  }

  let { rawData, layout, preparedLayout, dateWarnings }: Props = $props();

  let questions = $derived(buildQuestions(preparedLayout));
  let weightCol = $derived(findWeightColumn(preparedLayout));

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
    const activeWeightCol = weightEnabled ? weightCol : "";
    const crossQuestions = questions.filter((q) => crossSelected[q.code]);

    try {
      const tabs = await runAggregation(questions, crossQuestions, activeWeightCol);
      aggResult = { tabs, weightCol: activeWeightCol };
    } catch (e) {
      errorMsg = t("error.aggregation", { msg: (e as Error).message });
    }
  }

  // Run aggregation once on mount
  onMount(() => {
    void handleRunAggregation();
  });
</script>

<SettingsPanel
  {rawData}
  {layout}
  {preparedLayout}
  {questions}
  {crossSelected}
  onCrossToggle={(key, checked) => (crossSelected = { ...crossSelected, [key]: checked })}
  {weightCol}
  {weightEnabled}
  onWeightToggle={(on) => (weightEnabled = on)}
  {dateWarnings}
  {errorMsg}
  onRun={() => handleRunAggregation()}
/>

<ResultPanel tabs={aggResult?.tabs ?? null} weightCol={aggResult?.weightCol ?? ""} />
