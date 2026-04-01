<script lang="ts">
  import type { RankedQuestion } from "../../lib/dashboard/types";
  import { t } from "../../lib/i18n.svelte";
  import MiniBarChart from "./MiniBarChart.svelte";

  interface Props {
    questions: RankedQuestion[];
  }

  let { questions }: Props = $props();
</script>

<section class="rounded-xl border border-border bg-surface p-5">
  <h3 class="mb-1 text-sm font-semibold text-muted">{t("dashboard.notable")}</h3>
  <p class="mb-4 text-xs text-muted">{t("dashboard.notable.description")}</p>

  {#if questions.length === 0}
    <p class="text-sm text-muted">{t("dashboard.notable.empty")}</p>
  {:else}
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {#each questions as q, i (q.questionCode)}
        <div class="rounded-lg border border-border bg-bg p-4">
          <div class="mb-2 flex items-baseline gap-2">
            <span
              class="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
            >
              {i + 1}
            </span>
            <div class="min-w-0">
              <div class="truncate text-sm font-medium text-text" title={q.label}>
                {q.questionCode}: {q.label}
              </div>
              <div class="text-xs text-muted">
                [{q.type}] {t("dashboard.notable.score")}: {(q.score * 100).toFixed(0)}
              </div>
            </div>
          </div>
          <MiniBarChart tab={q.tab} />
        </div>
      {/each}
    </div>
  {/if}
</section>
