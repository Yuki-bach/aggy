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
  class="min-h-7 cursor-pointer border px-3 py-1 font-sans text-xs font-medium transition-[background,color,border-color] duration-150 {active
    ? 'border-accent bg-accent text-accent-contrast'
    : 'border-border bg-surface text-text-secondary'}"
  {onclick}
>
  {@render children()}
</button>
