<script lang="ts">
  import type { Tab } from "../../lib/types";
  import { formatN } from "../../lib/format";
  import { t } from "../../lib/i18n.svelte";
  import Th from "./Th.svelte";
  import Td from "./Td.svelte";

  interface Props {
    tab: Tab;
  }

  let { tab }: Props = $props();

  let slice = $derived(tab.slices[0]);
</script>

<table class="w-full border-collapse text-sm tabular-nums">
  <caption class="sr-only">{t("table.caption.tab", { question: tab.label })}</caption>
  <thead>
    <tr>
      <Th class="w-64 min-w-64">{t("table.option")}</Th>
      <Th right>n</Th>
      <Th right>%</Th>
      <th
        class="border-b-2 border-l border-border-strong bg-surface py-3 pr-4 pl-4 align-bottom text-[10px] font-normal text-muted"
        aria-hidden="true"
      >
        <div class="relative h-3">
          <span class="absolute top-0 left-0">0</span>
          <span class="absolute top-0 -translate-x-1/2" style:left="20%">20</span>
          <span class="absolute top-0 -translate-x-1/2" style:left="40%">40</span>
          <span class="absolute top-0 -translate-x-1/2" style:left="60%">60</span>
          <span class="absolute top-0 -translate-x-1/2" style:left="80%">80</span>
          <span class="absolute top-0 right-0">100</span>
        </div>
      </th>
    </tr>
  </thead>
  <tbody class="[&_tr:hover_td]:bg-row-hover [&_tr:last-child_td]:border-b-0">
    {#each tab.codes as code, i (code)}
      {@const cell = slice.cells[i]}
      {@const label = tab.labels[code]}
      {@const countStr = formatN(cell.count)}
      {@const pct = cell.pct ?? 0}
      {@const barWidthPct = pct.toFixed(1)}
      <tr>
        <Td>{label}</Td>
        <Td right mono>{countStr}</Td>
        <Td right mono class="text-muted">
          {cell.pct !== null ? cell.pct.toFixed(1) + "%" : "-"}
        </Td>
        <td
          class="border-b border-l border-row-border w-full px-4 py-3"
          aria-hidden="true"
          style:background-image="repeating-linear-gradient(to right, transparent 0 calc(20% - 1px), var(--border-strong) calc(20% - 1px) 20%)"
          style:background-origin="content-box"
          style:background-clip="content-box"
        >
          <div
            class="h-1.5 bg-accent rounded transition-[width] duration-[400ms] opacity-80"
            style:width="{barWidthPct}%"
          ></div>
        </td>
      </tr>
    {/each}
  </tbody>
</table>
