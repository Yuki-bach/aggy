<script lang="ts">
  import "./tailwind.css";
  import { initTheme } from "@aggy/ui";
  import { onMount } from "svelte";

  onMount(() => {
    initTheme();
  });
</script>

<div class="flex h-screen flex-col items-center justify-center gap-4 bg-bg text-text">
  <h1 class="text-3xl font-bold">Aggy</h1>
  <p class="text-muted">Desktop app scaffold — Step 5 で集計機能を接続します</p>
</div>
