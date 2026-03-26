<script lang="ts">
  import type { Tab } from "@aggy/lib";
  import { generateComment } from "../../lib/aiComment";
  import { t } from "../../lib/i18n.svelte";
  import { isAICommentEnabled } from "../../lib/theme";
  import IconButton from "../shared/IconButton.svelte";

  interface Props {
    tabs: Tab[];
    weightCol: string;
  }

  let { tabs, weightCol }: Props = $props();

  let comment = $state<string | null>(null);
  let loading = $state(true);
  let visible = $state(true);

  $effect(() => {
    const _tabs = tabs;
    const _weightCol = weightCol;

    if (!isAICommentEnabled()) {
      visible = false;
      return;
    }
    let cancelled = false;
    loading = true;
    comment = null;
    visible = true;
    void generateComment(_tabs, _weightCol).then((c) => {
      if (cancelled) return;
      if (c) {
        comment = c;
        loading = false;
      } else {
        visible = false;
      }
    });
    return () => {
      cancelled = true;
    };
  });
</script>

{#if visible}
  <div
    class="fixed bottom-6 right-6 z-100 min-w-[280px] max-w-[380px] rounded-2xl border border-border bg-surface px-5 py-4 shadow-lg animate-[bubbleIn_0.3s_ease-out]"
  >
    <!-- Triangle pointer -->
    <div
      class="absolute -bottom-2 right-6 h-0 w-0"
      style:border-left="8px solid transparent"
      style:border-right="8px solid transparent"
      style:border-top="8px solid var(--surface)"
    ></div>
    <div class="absolute top-2 right-3">
      <IconButton size="lg" label={t("ai.close")} onclick={() => (visible = false)}>
        {"\u00d7"}
      </IconButton>
    </div>
    <div class="mb-3 text-sm font-bold text-accent2">{t("ai.header")}</div>
    <div
      class="whitespace-pre-wrap text-sm leading-relaxed text-text{loading
        ? ' text-muted animate-[pulse_1.2s_ease-in-out_infinite]'
        : ''}"
    >
      {loading ? t("ai.loading") : comment}
    </div>
  </div>
{/if}
