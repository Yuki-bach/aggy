<script lang="ts">
  import type { Snippet } from "svelte";
  import { clickOutside } from "../../lib/dismiss";

  interface Props {
    open: boolean;
    onclose: () => void;
    trigger: Snippet;
    children: Snippet;
  }

  let { open, onclose, trigger, children }: Props = $props();
</script>

<div class="relative" {@attach clickOutside({ onClose: onclose })}>
  {@render trigger()}
  {#if open}
    <div
      class="absolute top-[calc(100%+8px)] right-0 z-100 w-[300px] rounded-xl border border-border bg-surface p-4 shadow-lg"
    >
      {@render children()}
    </div>
  {/if}
</div>
