<script lang="ts">
  import type { DashboardData } from "../../lib/dashboard/types";
  import { t } from "../../lib/i18n.svelte";
  import OverviewCard from "./OverviewCard.svelte";
  import NotableRanking from "./NotableRanking.svelte";

  interface Props {
    data: DashboardData;
  }

  let { data }: Props = $props();
</script>

<section class="mb-8 space-y-6">
  <h2 class="text-xl font-bold">{t("dashboard.title")}</h2>
  <OverviewCard overview={data.overview} />
  <NotableRanking questions={data.notableQuestions} />
</section>
