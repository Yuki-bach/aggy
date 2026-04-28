<script lang="ts">
  import type { Tab, Slice } from "../../lib/types";
  import { t } from "../../lib/i18n.svelte";
  import type { Basis } from "./viewTypes";
  import { formatN } from "../../lib/format";
  import Th from "./Th.svelte";
  import Td from "./Td.svelte";
  import { TH_BASE, TD_BASE, MONO } from "./tableCellStyles";

  interface Props {
    tab: Tab;
    crossTabs: Tab[];
    basis: Basis;
  }

  let { tab, crossTabs, basis }: Props = $props();

  let tabSlice = $derived(tab.slices[0]);
  let hasMultipleAxes = $derived(crossTabs.length > 1);
</script>

{#if basis === "row"}
  <!-- Transposed (row-based) layout -->
  <table class="w-full border-collapse text-sm tabular-nums min-w-[400px]">
    <caption class="sr-only">{t("table.caption.cross", { question: tab.label })}</caption>
    <thead>
      <tr>
        <th class="py-3 px-4"></th>
        {#each tab.codes as code (code)}
          <th
            class="{TH_BASE} text-right text-xs whitespace-nowrap border-l border-row-border bg-surface2"
          >
            {tab.labels[code]}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      <!-- Tab total row -->
      <tr class="[&_td]:border-b-2 [&_td]:border-border-strong">
        <td
          class="{TD_BASE} text-left text-xs font-bold whitespace-nowrap border-r-2 border-r-border-strong bg-tab-bg text-accent"
        >
          {t("table.total")}
        </td>
        {#each tab.codes as code, i (code)}
          {@const cell = tabSlice.cells[i]}
          <td class="{TD_BASE} {MONO} text-accent bg-tab-bg">
            {cell?.pct !== null ? cell.pct.toFixed(1) + "%" : "-"}
          </td>
        {/each}
      </tr>

      <!-- Cross sub rows -->
      {#each crossTabs as ct (ct.by!.code)}
        <tr>
          <td
            colspan={tab.codes.length + 1}
            class="py-3 px-4 bg-cross-bg text-accent2 font-bold text-xs tracking-wide border-b-2 border-border-strong border-t-2 border-t-border-strong"
          >
            {ct.by!.label}
          </td>
        </tr>
        {#each ct.slices as slice (`${ct.by!.code}-${slice.code}`)}
          <tr>
            <td
              class="{TD_BASE} text-left text-xs font-bold whitespace-nowrap border-r-2 border-r-border-strong text-accent2"
            >
              {ct.by!.labels[slice.code!]}
              <br />
              <span class="text-muted text-xs font-normal">n={formatN(slice.n)}</span>
            </td>
            {#each tab.codes as _code, i (_code)}
              {@const cell = slice.cells[i]}
              <td class="{TD_BASE} {MONO} text-accent2 border-l border-l-row-border">
                {cell?.pct !== null ? cell.pct.toFixed(1) + "%" : "-"}
              </td>
            {/each}
          </tr>
        {/each}
      {/each}
    </tbody>
  </table>
{:else}
  <!-- Vertical (column-based) layout -->
  <table class="w-full border-collapse text-sm tabular-nums min-w-[400px]">
    <caption class="sr-only">{t("table.caption.cross", { question: tab.label })}</caption>
    <thead>
      <tr>
        <th rowspan="2" class="py-3 px-4"></th>
        <th colspan="2" class="{TH_BASE} text-center bg-tab-bg text-accent">
          {t("table.total")}
        </th>
        {#each crossTabs as ct (ct.by!.code)}
          <th
            colspan={ct.slices.length}
            class="{TH_BASE} text-center bg-cross-bg border-l border-border text-accent2 {hasMultipleAxes
              ? 'border-l-2 border-l-border-strong'
              : ''}"
          >
            {ct.by!.label}
          </th>
        {/each}
      </tr>
      <tr>
        <Th right>n</Th>
        <Th right>%</Th>
        {#each crossTabs as ct, gi (ct.by!.code)}
          {#each ct.slices as slice, si (`${ct.by!.code}-${slice.code}`)}
            <th
              class="{TH_BASE} text-right text-xs whitespace-nowrap border-l border-row-border bg-surface2 {hasMultipleAxes &&
              si === 0 &&
              gi > 0
                ? 'border-l-2 border-l-border-strong'
                : ''}"
            >
              {ct.by!.labels[slice.code!]}
              <br />
              <span class="text-muted text-xs font-normal">n={formatN(slice.n)}</span>
            </th>
          {/each}
        {/each}
      </tr>
    </thead>
    <tbody class="[&_tr:hover_td]:bg-row-hover [&_tr:last-child_td]:border-b-0">
      {#each tab.codes as code, i (code)}
        {@const tabCell = tabSlice.cells[i]}
        <tr>
          <Td>{tab.labels[code]}</Td>
          <Td right mono>{formatN(tabCell.count)}</Td>
          <Td right mono class="text-muted">
            {tabCell.pct !== null ? tabCell.pct.toFixed(1) + "%" : "-"}
          </Td>
          {#each crossTabs as ct, gi (ct.by!.code)}
            {#each ct.slices as slice, si (`${ct.by!.code}-${slice.code}`)}
              {@const cell = slice.cells[i]}
              <td
                class="{TD_BASE} {MONO} text-accent2 border-l border-l-row-border {hasMultipleAxes &&
                si === 0 &&
                gi > 0
                  ? 'border-l-2 border-l-border-strong'
                  : ''}"
              >
                {cell?.pct !== null ? cell.pct.toFixed(1) + "%" : "-"}
              </td>
            {/each}
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
