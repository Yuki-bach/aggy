<script lang="ts">
  import type { Tab } from "../../lib/agg/types";
  import type { DashboardData } from "../../lib/dashboard/types";
  import { t } from "../../lib/i18n.svelte";
  import OverviewCard from "./OverviewCard.svelte";
  import NotableRanking from "./NotableRanking.svelte";
  import TabCard from "../aggregation/TabCard.svelte";

  interface Props {
    data: DashboardData;
    tabs: Tab[];
  }

  let { data, tabs }: Props = $props();

  let topCrossItems = $derived(
    data.topCrossTabs.map((crossTab) => ({
      grandTotal: tabs.find(
        (tab) => tab.questionCode === crossTab.questionCode && tab.by === null,
      )!,
      crossTab,
    })),
  );
</script>

<section class="mb-8 space-y-6">
  <h2 class="text-xl font-bold">{t("dashboard.title")}</h2>
  <OverviewCard overview={data.overview} />
  <NotableRanking questions={data.notableQuestions} />

  {#if topCrossItems.length > 0}
    <div>
      <h3 class="mb-1 text-base font-bold">{t("dashboard.segment.title")}</h3>
      <p class="mb-3 text-xs text-muted">{t("dashboard.segment.description")}</p>
      <div class="grid grid-cols-1 gap-4">
        {#each topCrossItems as item (item.crossTab.questionCode + ":" + item.crossTab.by?.code)}
          <TabCard
            tab={item.grandTotal}
            crossTabs={[item.crossTab]}
            viewMode="table"
            tableOpts={{ basis: "column", maxPct: 0 }}
            chartOpts={{ saChartType: "bar-h", maChartType: "bar-h", paletteId: "default" }}
          />
        {/each}
      </div>
    </div>
  {/if}
</section>
