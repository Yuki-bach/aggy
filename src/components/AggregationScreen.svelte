<script lang="ts">
  import { onMount, untrack } from "svelte";
  import type { RawData, LayoutData } from "../lib/types";
  import ResultPanel from "./aggregation/ResultPanel.svelte";
  import SettingsPanel from "./aggregation/SettingsPanel.svelte";
  import DerivedRecipePanel from "./aggregation/DerivedRecipePanel.svelte";
  import type { Layout } from "../lib/layout";
  import { t } from "../lib/i18n.svelte";
  import type { DerivedRecipe } from "../lib/derivedRecipe";
  import { saveRecipes } from "../lib/opfs";
  import { AnalysisSession } from "../lib/analysisSession.svelte";
  import { registerAggyWebMcpTools } from "../lib/webmcp";

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

  // A new AggregationScreen is mounted for each imported dataset; these props are session seeds.
  const session = untrack(
    () => new AnalysisSession(rawData, layout, preparedLayout, initialRecipes),
  );
  const recipeStore = session.recipeStore;
  const aggRunner = session.aggRunner;

  type ViewMode =
    | { kind: "results" }
    | { kind: "recipe"; mode: "type-select" | "edit"; editCode: string | null };
  let viewMode = $state<ViewMode>({ kind: "results" });

  onMount(() => {
    let disposed = false;
    let unregister: (() => void) | undefined;
    void session
      .initialize()
      .then(async (error) => {
        if (error || disposed) return;
        const cleanup = await registerAggyWebMcpTools(session);
        if (disposed) cleanup();
        else unregister = cleanup;
      })
      .catch(() => {});
    return () => {
      disposed = true;
      unregister?.();
    };
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
    await session.deleteRecipe(code);
  }

  async function handleRecipeCommit(next: DerivedRecipe[]): Promise<string | null> {
    const err = await session.commitRecipes(next);
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
    onCrossToggle={(key, checked) => void session.setCrossAxis(key, checked)}
    weightColumnName={recipeStore.weightColumnName}
    weightEnabled={aggRunner.weightEnabled}
    onWeightToggle={(on) => void session.setWeighting(on)}
    errorMsg={resultError}
    onAddDerived={handleAddRecipe}
  />
{/if}
