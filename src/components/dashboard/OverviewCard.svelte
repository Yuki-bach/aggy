<script lang="ts">
  import type { SurveyOverview } from "../../lib/dashboard/types";
  import { t } from "../../lib/i18n.svelte";

  interface Props {
    overview: SurveyOverview;
  }

  let { overview }: Props = $props();
</script>

<section class="rounded-xl border border-border bg-surface p-5">
  <h3 class="mb-3 text-sm font-semibold text-muted">{t("dashboard.overview")}</h3>
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
    <div>
      <div class="text-2xl font-bold text-text">{overview.responseCount.toLocaleString()}</div>
      <div class="text-xs text-muted">{t("dashboard.overview.responses")}</div>
    </div>
    <div>
      <div class="text-2xl font-bold text-text">{overview.questionCount}</div>
      <div class="text-xs text-muted">{t("dashboard.overview.questions")}</div>
    </div>
    <div>
      <div class="text-lg font-semibold text-text">
        SA {overview.saCount} / MA {overview.maCount}
      </div>
      <div class="text-xs text-muted">{t("dashboard.overview.choice")}</div>
    </div>
    <div>
      <div class="text-lg font-semibold text-text">NA {overview.naCount}</div>
      <div class="text-xs text-muted">{t("dashboard.overview.numeric")}</div>
    </div>
  </div>
</section>
