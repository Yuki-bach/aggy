<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    class?: string;
    children: Snippet;
  }

  let { class: cls, children }: Props = $props();
</script>

<h2 class="text-sm font-bold tracking-wider text-muted {cls ?? 'mb-3'}">{@render children()}</h2>
