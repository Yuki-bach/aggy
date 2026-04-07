<script lang="ts">
  import type { Tab } from "../../lib/types";
  import { formatN } from "../../lib/format";
  import { t } from "../../lib/i18n.svelte";
  import Th from "./Th.svelte";
  import Td from "./Td.svelte";

  interface Props {
    tab: Tab;
    maxPct: number;
  }

  let { tab, maxPct }: Props = $props();

  let slice = $derived(tab.slices[0]);
</script>

<table class="w-full border-collapse text-sm tabular-nums">
  <caption class="sr-only">{t("table.caption.tab", { question: tab.label })}</caption>
  <thead>
    <tr>
      <Th>{t("table.option")}</Th>
      <Th right>n</Th>
      <Th right>%</Th>
      <Th aria-hidden="true">
        <span class="sr-only">{t("table.graph")}</span>
      </Th>
    </tr>
  </thead>
  <tbody class="[&_tr:hover_td]:bg-row-hover [&_tr:last-child_td]:border-b-0">
    {#each tab.codes as code, i (code)}
      {@const cell = slice.cells[i]}
      {@const label = tab.labels[code]}
      {@const countStr = formatN(cell.count)}
      {@const pct = cell.pct ?? 0}
      {@const barWidth = ((pct / Math.max(maxPct, 1)) * 72).toFixed(1)}
      <tr>
        <Td>{label}</Td>
        <Td right mono>{countStr}</Td>
        <Td right mono class="text-muted">
          {cell.pct !== null ? cell.pct.toFixed(1) + "%" : "-"}
        </Td>
        <td class="py-3 pr-4 pl-0 border-b border-row-border w-20" aria-hidden="true">
          <div
            class="h-1.5 bg-accent rounded transition-[width] duration-[400ms] opacity-80"
            style:width="{barWidth}px"
          ></div>
        </td>
      </tr>
    {/each}
  </tbody>
</table>
