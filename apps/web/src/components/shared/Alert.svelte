<script lang="ts">
  import type { Snippet } from "svelte";

  const VARIANT_STYLES = {
    error: "border-error-border bg-error-bg text-danger",
    warning: "border-warning-border bg-warning-bg text-warning",
    info: "border-accent-light bg-accent-bg text-text-secondary",
  } as const;

  interface Props {
    variant: keyof typeof VARIANT_STYLES;
    role?: "alert" | "status";
    class?: string;
    children: Snippet;
  }

  let { variant, role = "alert", class: cls, children }: Props = $props();
</script>

<div
  class="rounded-lg border px-4 py-3 text-sm leading-normal {VARIANT_STYLES[variant]} {cls ?? ''}"
  {role}
>
  {@render children()}
</div>
