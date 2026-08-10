<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    children: Snippet;
  }

  let { class: cls, children, ...rest }: Props = $props();
</script>

<div
  class="flex [&>:first-child]:rounded-l [&>:last-child]:rounded-r [&>:last-child]:border-l-0{cls ? ` ${cls}` : ''}"
  {...rest}
>
  {@render children()}
</div>
