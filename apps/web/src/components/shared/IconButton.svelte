<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props extends HTMLButtonAttributes {
    size: "sm" | "md" | "lg";
    label: string;
    children: Snippet;
  }

  let { size, label, children, ...rest }: Props = $props();

  const base =
    "cursor-pointer rounded-lg flex items-center justify-center text-muted transition-colors hover:bg-surface2 hover:text-text";

  const sizes = {
    sm: "size-8",
    md: "size-9",
    lg: "min-h-11 min-w-11",
  } as const;
</script>

<button class="{base} {sizes[size]}" aria-label={label} {...rest}>
  {@render children()}
</button>
