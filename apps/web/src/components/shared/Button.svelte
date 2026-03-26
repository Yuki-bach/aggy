<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props extends HTMLButtonAttributes {
    variant: "primary" | "secondary" | "ghost";
    size: "md" | "lg";
    fullWidth?: boolean;
    children: Snippet;
  }

  let { variant, size, fullWidth, children, ...rest }: Props = $props();

  const base =
    "cursor-pointer rounded-lg transition-[background,color,border-color] duration-150 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary:
      "border-none bg-accent text-accent-contrast font-bold hover:bg-accent-hover active:bg-[var(--color-primary-900)]",
    secondary: "border border-border bg-surface text-text font-medium hover:bg-surface2",
    ghost: "border-none bg-transparent text-text font-normal hover:bg-accent-bg",
  } as const;

  const sizes = {
    md: "px-4 py-2 text-sm",
    lg: "min-h-12 px-4 py-3 text-base tracking-wide",
  } as const;
</script>

<button
  class="{base} {variants[variant]} {sizes[size]}{fullWidth ? ' w-full' : ''}"
  {...rest}
>
  {@render children()}
</button>
