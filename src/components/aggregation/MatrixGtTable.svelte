<script lang="ts">
  import type { Tab } from "../../lib/types";
  import { formatN } from "../../lib/format";
  import { t } from "../../lib/i18n.svelte";
  import Th from "./Th.svelte";
  import Td from "./Td.svelte";
  import { TD_BASE } from "./tableCellStyles";

  interface Props {
    tabs: Tab[];
    caption: string;
  }

  let { tabs, caption }: Props = $props();

  // All children share the same codes/labels (common-option matrix precondition)
  let codes = $derived(tabs[0].codes);
  let labels = $derived(tabs[0].labels);
</script>

<table class="w-full border-collapse text-sm tabular-nums">
  <caption class="sr-only">{caption}</caption>
  <thead>
    <tr>
      <Th><span class="sr-only">{t("table.question")}</span></Th>
      <Th right>n</Th>
      {#each codes as code (code)}
        <Th right>{labels[code]}</Th>
      {/each}
    </tr>
  </thead>
  <tbody class="[&_tr:hover_td]:bg-row-hover [&_tr:last-child_td]:border-b-0">
    {#each tabs as tab (tab.questionCode)}
      {@const slice = tab.slices[0]}
      <tr>
        <th scope="row" class="{TD_BASE} text-left font-normal">{tab.label}</th>
        <Td right mono>{formatN(slice.n)}</Td>
        {#each codes as code, i (code)}
          {@const cell = slice.cells[i]}
          <Td right mono class="text-muted">
            {cell && cell.pct !== null ? cell.pct.toFixed(1) + "%" : "-"}
          </Td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
