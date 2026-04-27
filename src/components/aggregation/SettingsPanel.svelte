<script lang="ts">
  import type { Question, RawData, LayoutData } from "../../lib/types";
  import type { MatrixGroup } from "../../lib/layout";
  import type { DerivedRecipe } from "../../lib/derivedRecipe";
  import { t } from "../../lib/i18n.svelte";
  import { scrollToCard } from "../../lib/scrollToCard";
  import SectionTitle from "../shared/SectionTitle.svelte";
  import Alert from "../shared/Alert.svelte";
  import IconButton from "../shared/IconButton.svelte";
  import Toc from "./Toc.svelte";

  interface Props {
    rawData: RawData;
    layout: LayoutData;
    questions: Question[];
    matrixGroups: MatrixGroup[];
    dateWarnings: string[];
    recipes: DerivedRecipe[];
    onAddRecipe: () => void;
    onEditRecipe: (code: string) => void;
    onDeleteRecipe: (code: string) => Promise<void>;
  }

  let {
    rawData,
    layout,
    questions,
    matrixGroups,
    dateWarnings,
    recipes,
    onAddRecipe,
    onEditRecipe,
    onDeleteRecipe,
  }: Props = $props();

  let derivedCodes = $derived(new Set(recipes.map((r) => r.code)));

  function recipeKindLabel(r: DerivedRecipe): string {
    return r.type === "combineSA" ? t("derived.kind.combineSA") : t("derived.kind.binNA");
  }
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

  <!-- Derived Questions -->
  <section class="shrink-0 border-b border-border p-4">
    <div class="mb-3 flex items-center justify-between">
      <SectionTitle class="m-0">{t("section.derived")}</SectionTitle>
      <button
        type="button"
        class="cursor-pointer rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-surface2 hover:text-text"
        onclick={onAddRecipe}
      >
        + {t("derived.add")}
      </button>
    </div>
    {#if recipes.length === 0}
      <p class="pl-1 text-xs text-muted">{t("derived.empty")}</p>
    {:else}
      <ul class="flex flex-col gap-0.5">
        {#each recipes as r (r.code)}
          <li class="group flex items-center gap-1 rounded-sm pr-1 hover:bg-surface2">
            <button
              type="button"
              class="flex flex-1 cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left"
              onclick={() => scrollToCard(`card-${r.code}`)}
            >
              <span class="shrink-0 font-mono text-[10px] tracking-wide text-muted">
                {recipeKindLabel(r)}
              </span>
              <span class="flex-1 truncate text-sm text-text">{r.code}</span>
            </button>
            <div class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <IconButton
                size="sm"
                label={t("derived.edit")}
                onclick={() => onEditRecipe(r.code)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="size-4"
                  aria-hidden="true"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
              </IconButton>
              <IconButton
                size="sm"
                label={t("derived.delete")}
                onclick={() => onDeleteRecipe(r.code)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="size-4"
                  aria-hidden="true"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
              </IconButton>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <!-- Table of Contents -->
  <section class="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
    <SectionTitle>{t("section.toc")}</SectionTitle>
    <Toc {questions} {matrixGroups} excludeCodes={derivedCodes} />
  </section>
</div>
