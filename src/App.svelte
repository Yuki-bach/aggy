<script lang="ts">
  import { onMount } from "svelte";
  import { requireDuckDB } from "./lib/duckdb.svelte";
  import { initTheme } from "./lib/theme";
  import Header from "./components/Header.svelte";
  import ImportScreen from "./components/ImportScreen.svelte";
  const AggregationScreen = () =>
    import("./components/AggregationScreen.svelte");
  import type { Layout } from "./lib/layout";
  import type { RawData, LayoutData } from "./lib/types";
  import type { DerivedRecipe } from "./lib/derivedRecipe";

  let screen = $state<"import" | "aggregation">("import");
  let loadedData = $state<{
    rawData: RawData;
    layout: LayoutData;
    preparedLayout: Layout;
    dateWarnings: string[];
    recipes: DerivedRecipe[];
    folderId: string;
  } | null>(null);

  let isImport = $derived(screen === "import");

  function handleComplete(
    rawData: RawData,
    layout: LayoutData,
    dateWarnings: string[],
    preparedLayout: Layout,
    recipes: DerivedRecipe[],
    folderId: string,
  ) {
    loadedData = { rawData, layout, preparedLayout, dateWarnings, recipes, folderId };
    screen = "aggregation";
  }

  // Imperative initialization (runs once after mount)
  onMount(() => {
    initTheme();
    requireDuckDB().catch(() => {});
  });
</script>

<div class="flex h-screen flex-col overflow-hidden">
  <Header {isImport} onBack={() => (screen = "import")} />

  <main
    class="grid min-h-0 flex-1 grid-rows-1"
    style:grid-template-columns={isImport ? "1fr" : "360px 1fr"}
  >
    {#if isImport}
      <ImportScreen onComplete={handleComplete} />
    {:else if loadedData}
      {#await AggregationScreen() then { default: Agg }}
        <Agg
          rawData={loadedData.rawData}
          layout={loadedData.layout}
          preparedLayout={loadedData.preparedLayout}
          dateWarnings={loadedData.dateWarnings}
          initialRecipes={loadedData.recipes}
          folderId={loadedData.folderId}
        />
      {/await}
    {/if}
  </main>
</div>
