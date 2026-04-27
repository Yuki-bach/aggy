<script lang="ts">
  import type { Question, RawData, LayoutData } from "../../lib/types";
  import type { MatrixGroup } from "../../lib/layout";
  import { t } from "../../lib/i18n.svelte";
  import SectionTitle from "../shared/SectionTitle.svelte";
  import Alert from "../shared/Alert.svelte";
  import Toc from "./Toc.svelte";

  interface Props {
    rawData: RawData;
    layout: LayoutData;
    questions: Question[];
    matrixGroups: MatrixGroup[];
    dateWarnings: string[];
  }

  let { rawData, layout, questions, matrixGroups, dateWarnings }: Props = $props();
</script>

<div
  class="flex flex-col overflow-hidden border-r border-border bg-surface max-md:max-h-[50vh] max-md:border-b max-md:border-r-0"
  role="region"
  aria-label={t("section.settings")}
>
  <!-- Data Summary -->
  <section class="shrink-0 border-b border-border p-4">
    <SectionTitle>{t("section.summary")}</SectionTitle>
    <div class="text-sm leading-relaxed text-text-secondary">
      <div class="mb-1 flex items-baseline gap-2 pl-4">
        <span class="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-text">
          {rawData.fileName}
        </span>
      </div>
      <div class="mb-1 flex items-baseline gap-2 pl-4">
        <span class="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-text">
          {layout.fileName}
        </span>
      </div>
      <div class="mb-1 flex items-baseline gap-2 pl-4">
        <span class="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-text">
          {t("summary.rows", {
            rows: rawData.rowCount,
            cols: rawData.headers.length,
          })}
        </span>
      </div>
    </div>
  </section>

  <!-- Date Warnings -->
  {#if dateWarnings.length > 0}
    <Alert variant="warning" role="status" class="mx-4 mt-4 shrink-0">
      {#each dateWarnings as w (w)}
        {@const parts = w.split(":")}
        <p>{t("warn.date.cast", { col: parts[0], count: parts[1] })}</p>
      {/each}
    </Alert>
  {/if}

  <!-- Table of Contents -->
  <section class="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
    <SectionTitle>{t("section.toc")}</SectionTitle>
    <Toc {questions} {matrixGroups} />
  </section>
</div>
