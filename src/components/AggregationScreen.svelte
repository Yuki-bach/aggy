<script lang="ts">
  import { onMount } from "svelte";
  import type { RawData, LayoutData } from "../lib/types";
  import ResultPanel from "./aggregation/ResultPanel.svelte";
  import SettingsPanel from "./aggregation/SettingsPanel.svelte";
  import DerivedRecipePanel from "./aggregation/DerivedRecipePanel.svelte";
  import type { Layout } from "../lib/layout";
  import { t } from "../lib/i18n.svelte";
  import type { DerivedRecipe } from "../lib/derivedRecipe";
  import { saveRecipes } from "../lib/opfs";
  import { RecipeStore } from "../lib/recipeStore.svelte";
  import { AggRunner } from "../lib/aggRunner.svelte";

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

  const recipeStore = new RecipeStore(preparedLayout, initialRecipes);
  const aggRunner = new AggRunner();

  type ViewMode =
    | { kind: "results" }
    | { kind: "recipe"; mode: "type-select" | "edit"; editCode: string | null };
  let viewMode = $state<ViewMode>({ kind: "results" });

  onMount(() => {
    void recipeStore.restoreInitial();
  });

  // Auto-run aggregation whenever questions / cross selection / weight toggle change.
  // The runner's internal runId guards against out-of-order completions.
  $effect(() => {
    if (recipeStore.questions.length === 0) return;
    void aggRunner.run(
      recipeStore.questions,
      recipeStore.weightColumnName,
      recipeStore.matrixLabels,
    );
  });

  // Persist recipes whenever they change. Best-effort.
  $effect(() => {
    const json = JSON.stringify(recipeStore.recipes);
    void saveRecipes(folderId, json).catch(() => {});
  });

  // Surface either the recipe-side or aggregation-side error on the result screen.
  let resultError = $derived(aggRunner.error || recipeStore.error);

  function handleAddRecipe(): void {
    viewMode = { kind: "recipe", mode: "type-select", editCode: null };
  }

  function handleEditRecipe(code: string): void {
    viewMode = { kind: "recipe", mode: "edit", editCode: code };
  }

  async function handleDeleteRecipe(code: string): Promise<void> {
    if (!confirm(t("derived.delete.confirm", { code }))) return;
    await recipeStore.remove(code);
    aggRunner.pruneCode(code);
  }

  async function handleRecipeCommit(next: DerivedRecipe[]): Promise<string | null> {
    const err = await recipeStore.commit(next);
    if (err === null) viewMode = { kind: "results" };
    return err;
  }

  function handleRecipeCancel(): void {
    viewMode = { kind: "results" };
  }
</script>

<SettingsPanel
  {rawData}
  {layout}
  questions={recipeStore.questions}
  matrixGroups={recipeStore.matrixGroups}
  dateWarnings={[...dateWarnings, ...recipeStore.derivedWarnings]}
  recipes={recipeStore.recipes}
  onAddRecipe={handleAddRecipe}
  onEditRecipe={handleEditRecipe}
  onDeleteRecipe={handleDeleteRecipe}
/>

{#if viewMode.kind === "recipe"}
  <DerivedRecipePanel
    recipes={recipeStore.recipes}
    baseLayout={preparedLayout}
    derivedLayout={recipeStore.derivedLayout}
    initialMode={viewMode.mode}
    initialEditCode={viewMode.editCode}
    onCommit={handleRecipeCommit}
    onCancel={handleRecipeCancel}
  />
{:else}
  <ResultPanel
    tabs={aggRunner.result?.tabs ?? null}
    weightCol={aggRunner.result?.weightCol ?? ""}
    questions={recipeStore.questions}
    crossSelected={aggRunner.crossSelected}
    onCrossToggle={(key, checked) => aggRunner.toggleCross(key, checked)}
    weightColumnName={recipeStore.weightColumnName}
    weightEnabled={aggRunner.weightEnabled}
    onWeightToggle={(on) => aggRunner.toggleWeight(on)}
    errorMsg={resultError}
    onAddDerived={handleAddRecipe}
  />
{/if}
