<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    class?: string;
    children: Snippet;
  }

  let { class: cls, children }: Props = $props();
</script>

<div
  class="flex [&>:first-child]:rounded-l [&>:last-child]:rounded-r [&>:last-child]:border-l-0{cls ? ` ${cls}` : ''}"
>
  {@render children()}
</div>
