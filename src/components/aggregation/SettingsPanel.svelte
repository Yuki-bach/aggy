<script lang="ts">
  import type { Question, RawData, LayoutData } from "../../lib/types";
  import { t } from "../../lib/i18n.svelte";
  import Button from "../shared/Button.svelte";
  import ToggleButton from "../shared/ToggleButton.svelte";
  import ToggleGroup from "../shared/ToggleGroup.svelte";
  import SectionTitle from "../shared/SectionTitle.svelte";
  import Alert from "../shared/Alert.svelte";
  import type { Layout } from "../../lib/layout";
  import { countLayoutColumns } from "../../lib/layout";

  interface Props {
    rawData: RawData;
    layout: LayoutData;
    preparedLayout: Layout;
    questions: Question[];
    crossSelected: Record<string, boolean>;
    onCrossToggle: (key: string, checked: boolean) => void;
    weightCol: string;
    weightEnabled: boolean;
    onWeightToggle: (on: boolean) => void;
    dateWarnings: string[];
    errorMsg: string;
    onRun: () => void;
  }

  let {
    rawData,
    layout,
    preparedLayout,
    questions,
    crossSelected,
    onCrossToggle,
    weightCol,
    weightEnabled,
    onWeightToggle,
    dateWarnings,
    errorMsg,
    onRun,
  }: Props = $props();

  let samaQuestions = $derived(questions.filter((q) => q.type !== "NA"));
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

  <!-- Cross Config -->
  <section class="flex min-h-0 flex-1 flex-col overflow-hidden border-b border-border p-4">
    <SectionTitle>{t("section.cross")}</SectionTitle>
    <div
      class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
      role="group"
      aria-label={t("section.cross.label")}
    >
      {#each samaQuestions as q (q.code)}
        {@const typeTag = q.type === "MA" ? " [MA]" : ""}
        {@const hasLabel = q.label !== q.code}
        {@const displayText = hasLabel ? `${q.code}: ${q.label}${typeTag}` : `${q.code}${typeTag}`}
        <label
          class="flex min-h-9 cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-surface2"
        >
          <input
            type="checkbox"
            class="size-4.5 cursor-pointer accent-accent"
            checked={crossSelected[q.code] ?? false}
            onchange={(e) => {
              onCrossToggle(q.code, (e.target as HTMLInputElement).checked);
            }}
          />
          {displayText}
        </label>
      {/each}
    </div>
  </section>

  <!-- Weight Info -->
  {#if weightCol}
    <div
      class="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 text-sm text-text"
    >
      <span>{t("weight.label", { col: weightCol })}</span>
      <div class="ml-auto flex">
        <ToggleGroup>
          <ToggleButton active={weightEnabled} onclick={() => onWeightToggle(true)}>
            {t("weight.on")}
          </ToggleButton>
          <ToggleButton active={!weightEnabled} onclick={() => onWeightToggle(false)}>
            {t("weight.off")}
          </ToggleButton>
        </ToggleGroup>
      </div>
    </div>
  {/if}

  <!-- Date Warnings -->
  {#if dateWarnings.length > 0}
    <Alert variant="warning" role="status" class="mx-4 shrink-0">
      {#each dateWarnings as w (w)}
        {@const parts = w.split(":")}
        <p>{t("warn.date.cast", { col: parts[0], count: parts[1] })}</p>
      {/each}
    </Alert>
  {/if}

  <!-- Error Message -->
  {#if errorMsg}
    <Alert variant="error" class="mx-4 shrink-0">
      {errorMsg}
    </Alert>
  {/if}

  <!-- Run Button -->
  <div class="mx-4 my-4 shrink-0">
    <Button variant="primary" size="lg" fullWidth onclick={onRun}>
      {t("run.button")}
    </Button>
  </div>
</div>
