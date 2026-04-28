<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLTableCellElement> {
    right?: boolean;
    mono?: boolean;
    children?: Snippet;
  }

  let { right, mono, class: cls, children, ...props }: Props = $props();
</script>

<td
  class="py-3 px-4 border-b border-row-border leading-[1.2] {right
    ? 'text-right'
    : ''} {mono ? 'tabular-nums font-mono' : ''} {cls ?? ''}"
  {...props}
>
  {#if children}{@render children()}{/if}
</td>
