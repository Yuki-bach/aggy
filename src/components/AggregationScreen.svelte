<script lang="ts">
  import type { Tab } from "../lib/agg/types";
  import ResultPanel from "./aggregation/ResultPanel.svelte";
  import { runAggregation } from "../lib/duckdb";
  import type { Layout } from "../lib/layout";
  import { buildQuestions, findWeightColumn } from "../lib/layout";
  import { t } from "../lib/i18n.svelte";
  import type { RawData, LayoutData } from "../lib/types";
  import { buildDashboard } from "../lib/dashboard/buildDashboard";

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
  let running = $state(false);

  // Initialize crossSelected when questions change
  $effect(() => {
    const sel: Record<string, boolean> = {};
    for (const q of questions) sel[q.code] = false;
    crossSelected = sel;
  });

  // Debounced auto-aggregation
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    // Track dependencies
    const _cross = crossSelected;
    const _weightEnabled = weightEnabled;
    const _questions = questions;
    const _weightCol = weightCol;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void doAggregation(_questions, _cross, _weightEnabled ? _weightCol : "");
    }, 300);

    return () => clearTimeout(debounceTimer);
  });

  async function doAggregation(
    qs: typeof questions,
    cross: Record<string, boolean>,
    wCol: string,
  ): Promise<void> {
    if (running) return;
    running = true;
    errorMsg = "";
    const crossQuestions = qs.filter((q) => cross[q.code]);
    try {
      const tabs = await runAggregation(qs, crossQuestions, wCol);
      aggResult = { tabs, weightCol: wCol };
    } catch (e) {
      errorMsg = t("error.aggregation", { msg: (e as Error).message });
    } finally {
      running = false;
    }
  }

  let dashboardData = $derived(
    aggResult
      ? buildDashboard(aggResult.tabs, questions, rawData.rowCount)
      : null,
  );
</script>

<ResultPanel
  tabs={aggResult?.tabs ?? null}
  weightCol={aggResult?.weightCol ?? ""}
  {dashboardData}
  {questions}
  {crossSelected}
  onCrossToggle={(key, checked) => (crossSelected = { ...crossSelected, [key]: checked })}
  activeWeightCol={weightEnabled ? weightCol : ""}
  {weightEnabled}
  onWeightToggle={(on) => (weightEnabled = on)}
  {dateWarnings}
  {errorMsg}
/>
