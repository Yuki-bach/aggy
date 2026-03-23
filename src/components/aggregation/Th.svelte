<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLTableCellElement> {
    right?: boolean;
    children?: Snippet;
  }

  let { right, class: cls, children, ...props }: Props = $props();
</script>

<th
  class="py-3 px-4 text-xs font-bold tracking-wide border-b-2 border-border-strong text-text-secondary bg-surface2 {right
    ? 'text-right'
    : 'text-left'} {cls ?? ''}"
  {...props}
>
  {#if children}{@render children()}{/if}
</th>
