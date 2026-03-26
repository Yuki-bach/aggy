<script lang="ts">
  import type { Tab } from "@aggy/lib";
  import { formatStat } from "@aggy/lib";
  import { t } from "../../lib/i18n.svelte";
  import Th from "./Th.svelte";
  import Td from "./Td.svelte";

  interface Props {
    tab: Tab;
  }

  let { tab }: Props = $props();

  const STAT_KEYS = ["n", "mean", "median", "sd", "min", "max"] as const;

  let stats = $derived(tab.slices[0].stats!);
</script>

<table class="w-full border-collapse text-sm tabular-nums">
  <caption class="sr-only">{t("table.caption.tab", { question: tab.label })}</caption>
  <thead>
    <tr>
      <Th>{t("table.option")}</Th>
      <Th right></Th>
    </tr>
  </thead>
  <tbody class="[&_tr:hover_td]:bg-row-hover [&_tr:last-child_td]:border-b-0">
    {#each STAT_KEYS as key (key)}
      <tr>
        <Td>{t(`na.stat.${key}`)}</Td>
        <Td right mono>{formatStat(key, stats[key])}</Td>
      </tr>
    {/each}
  </tbody>
</table>
