<script lang="ts">
  import { onMount } from "svelte";
  import { initDuckDB } from "./lib/duckdb";
  import { initTheme } from "@aggy/ui";
  import Header from "./components/Header.svelte";
  import ImportScreen from "./components/ImportScreen.svelte";
  import AggregationScreen from "./components/AggregationScreen.svelte";
  import type { Layout, RawData, LayoutData } from "@aggy/lib";

  let screen = $state<"import" | "aggregation">("import");
  let loadedData = $state<{
    rawData: RawData;
    layout: LayoutData;
    preparedLayout: Layout;
    dateWarnings: string[];
  } | null>(null);

  let isImport = $derived(screen === "import");

  function handleComplete(
    rawData: RawData,
    layout: LayoutData,
    dateWarnings: string[],
    preparedLayout: Layout,
  ) {
    loadedData = { rawData, layout, preparedLayout, dateWarnings };
    screen = "aggregation";
  }

  // Imperative initialization (runs once after mount)
  onMount(() => {
    initTheme();
    initDuckDB().catch(() => {});
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
      <AggregationScreen
        rawData={loadedData.rawData}
        layout={loadedData.layout}
        preparedLayout={loadedData.preparedLayout}
        dateWarnings={loadedData.dateWarnings}
      />
    {/if}
  </main>
</div>
