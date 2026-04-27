<script lang="ts">
  import type { RawData, LayoutData, Tab } from "../lib/types";
  import ResultPanel from "./aggregation/ResultPanel.svelte";
  import SettingsPanel from "./aggregation/SettingsPanel.svelte";
  import DerivedRecipePanel from "./aggregation/DerivedRecipePanel.svelte";
  import {
    runAggregation,
    prepareDerivedLayout,
    dropDerivedColumn,
  } from "../lib/duckdb.svelte";
  import type { Layout } from "../lib/layout";
  import { buildQuestions, buildMatrixGroups, findWeightColumn } from "../lib/layout";
  import { t } from "../lib/i18n.svelte";
  import type { DerivedRecipe } from "../lib/derivedRecipe";
  import { validateRecipes } from "../lib/derivedRecipe";
  import { saveRecipes } from "../lib/opfs";

  interface Props {
    rawData: RawData;
    layout: LayoutData;
    preparedLayout: Layout;
    dateWarnings: string[];
    initialRecipes: DerivedRecipe[];
    folderId: string;
  }

  let {
    rawData,
    layout,
    preparedLayout,
    dateWarnings,
    initialRecipes,
    folderId,
  }: Props = $props();

  let recipes = $state<DerivedRecipe[]>(initialRecipes);
  let derivedLayout = $state<Layout>(preparedLayout);
  let derivedWarnings = $state<string[]>([]);

  let questions = $derived(buildQuestions(derivedLayout));
  let weightColumnName = $derived(findWeightColumn(derivedLayout));
  let matrixGroups = $derived(buildMatrixGroups(derivedLayout));
  let matrixLabels = $derived(
    Object.fromEntries(matrixGroups.map((g) => [g.matrixKey, g.matrixLabel])),
  );

  let crossSelected = $state<Record<string, boolean>>({});
  let weightEnabled = $state(true);
  let errorMsg = $state("");
  let aggResult = $state<{ tabs: Tab[]; weightCol: string } | null>(null);

  type ViewMode =
    | { kind: "results" }
    | { kind: "recipe"; mode: "type-select" | "edit"; editCode: string | null };
  let viewMode = $state<ViewMode>({ kind: "results" });

  // Re-prepare derived columns whenever recipes change.
  // The lib does DROP COLUMN IF EXISTS per recipe, so re-running is idempotent
  // for current recipes — but removed recipes' columns must be dropped explicitly
  // via the delete handler before the recipes array shrinks.
  let derivedRunId = 0;
  $effect(() => {
    const runId = ++derivedRunId;
    const snapshot = recipes;
    void (async () => {
      try {
        const result = await prepareDerivedLayout(preparedLayout, snapshot);
        if (runId !== derivedRunId) return;
        derivedLayout = result.layout;
        derivedWarnings = result.warnings;
      } catch (e) {
        if (runId !== derivedRunId) return;
        errorMsg = t("error.aggregation", { msg: (e as Error).message });
      }
    })();
  });

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

  // Persist recipes whenever they change. Best-effort.
  $effect(() => {
    const json = JSON.stringify(recipes);
    void saveRecipes(folderId, json).catch(() => {});
  });

  function handleAddRecipe(): void {
    viewMode = { kind: "recipe", mode: "type-select", editCode: null };
  }

  function handleEditRecipe(code: string): void {
    viewMode = { kind: "recipe", mode: "edit", editCode: code };
  }

  async function handleDeleteRecipe(code: string): Promise<void> {
    if (!confirm(t("derived.delete.confirm", { code }))) return;
    try {
      await dropDerivedColumn(code);
    } catch {
      // Best-effort: column may not exist if previous prepare failed
    }
    if (crossSelected[code]) {
      const next = { ...crossSelected };
      delete next[code];
      crossSelected = next;
    }
    recipes = recipes.filter((r) => r.code !== code);
  }

  async function handleRecipeCommit(next: DerivedRecipe[]): Promise<string | null> {
    const errs = validateRecipes(next, preparedLayout);
    if (errs.length > 0) return errs[0];
    try {
      const result = await prepareDerivedLayout(preparedLayout, next);
      derivedLayout = result.layout;
      derivedWarnings = result.warnings;
      recipes = next;
      viewMode = { kind: "results" };
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }

  function handleRecipeCancel(): void {
    viewMode = { kind: "results" };
  }
</script>

<SettingsPanel
  {rawData}
  {layout}
  {questions}
  {matrixGroups}
  dateWarnings={[...dateWarnings, ...derivedWarnings]}
  {recipes}
  onAddRecipe={handleAddRecipe}
  onEditRecipe={handleEditRecipe}
  onDeleteRecipe={handleDeleteRecipe}
/>

{#if viewMode.kind === "recipe"}
  <DerivedRecipePanel
    {recipes}
    baseLayout={preparedLayout}
    {derivedLayout}
    initialMode={viewMode.mode}
    initialEditCode={viewMode.editCode}
    onCommit={handleRecipeCommit}
    onCancel={handleRecipeCancel}
  />
{:else}
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
    onAddDerived={handleAddRecipe}
  />
{/if}
