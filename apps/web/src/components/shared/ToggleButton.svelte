<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    active: boolean;
    onclick: () => void;
    children: Snippet;
  }

  let { active, onclick, children }: Props = $props();
</script>

<button
  class="min-h-9 cursor-pointer border px-4 py-2 font-sans text-sm font-medium transition-[background,color,border-color] duration-150 {active
    ? 'border-accent bg-accent text-accent-contrast'
    : 'border-border bg-surface text-text-secondary'}"
  {onclick}
>
  {@render children()}
</button>
