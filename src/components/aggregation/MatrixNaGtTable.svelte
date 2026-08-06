<script lang="ts">
  import type { Tab } from "../../lib/types";
  import { formatStat } from "../../lib/format";
  import { t } from "../../lib/i18n.svelte";
  import Th from "./Th.svelte";
  import Td from "./Td.svelte";
  import { TD_BASE } from "./tableCellStyles";

  interface Props {
    tabs: Tab[];
    caption: string;
  }

  let { tabs, caption }: Props = $props();

  const STAT_KEYS = ["n", "mean", "median", "sd", "min", "max"] as const;
</script>

<table class="w-full border-collapse text-sm tabular-nums">
  <caption class="sr-only">{caption}</caption>
  <thead>
    <tr>
      <Th><span class="sr-only">{t("table.question")}</span></Th>
      {#each STAT_KEYS as key (key)}
        <Th right>{t(`na.stat.${key}`)}</Th>
      {/each}
    </tr>
  </thead>
  <tbody class="[&_tr:hover_td]:bg-row-hover [&_tr:last-child_td]:border-b-0">
    {#each tabs as tab (tab.questionCode)}
      {@const stats = tab.slices[0].stats!}
      <tr>
        <th scope="row" class="{TD_BASE} text-left font-normal">{tab.label}</th>
        {#each STAT_KEYS as key (key)}
          <Td right mono>{formatStat(key, stats[key])}</Td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
