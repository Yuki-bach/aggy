<script lang="ts">
  import type { Question } from "../../lib/types";
  import { t } from "../../lib/i18n.svelte";
  import { getSamaQuestions } from "../../lib/layout";
  import ToggleButton from "../shared/ToggleButton.svelte";
  import ToggleGroup from "../shared/ToggleGroup.svelte";
  import { clickOutside } from "../../lib/dismiss";

  interface Props {
    questions: Question[];
    crossSelected: Record<string, boolean>;
    onCrossToggle: (key: string, checked: boolean) => void;
    weightColumnName: string;
    weightEnabled: boolean;
    onWeightToggle: (on: boolean) => void;
    onAddDerived?: () => void;
  }

  let {
    questions,
    crossSelected,
    onCrossToggle,
    weightColumnName,
    weightEnabled,
    onWeightToggle,
    onAddDerived,
  }: Props = $props();

  let open = $state(false);

  let samaQuestions = $derived(getSamaQuestions(questions));
  let selectedCount = $derived(samaQuestions.filter((q) => crossSelected[q.code]).length);
</script>

<div class="relative" {@attach clickOutside({ onClose: () => (open = false) })}>
  <button
    type="button"
    class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors {open
      ? 'border-accent text-accent'
      : 'border-border text-text-secondary hover:border-accent hover:text-accent'}"
    onclick={() => (open = !open)}
    aria-label={t("agg.settings.label")}
    aria-expanded={open}
    aria-haspopup="dialog"
  >
    <span>{t("agg.settings")}</span>
    {#if selectedCount > 0}
      <span
        class="flex size-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-contrast"
      >
        {selectedCount}
      </span>
    {/if}
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="transition-transform {open ? 'rotate-180' : ''}"
      aria-hidden="true"
    >
      <path d="M3 4.5l3 3 3-3" />
    </svg>
  </button>

  {#if open}
    <div
      class="absolute right-0 top-full z-20 mt-1 w-80 rounded-lg border border-border bg-surface shadow-lg"
      role="dialog"
      aria-label={t("agg.settings")}
    >
      <!-- Cross axes -->
      <div class="border-b border-border p-3">
        <div class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          {t("section.cross")}
        </div>
        {#if samaQuestions.length === 0}
          <p class="px-1 py-2 text-sm text-muted">{t("cross.popover.empty")}</p>
        {:else}
          <ul
            class="flex max-h-64 flex-col gap-1 overflow-y-auto"
            role="group"
            aria-label={t("section.cross.label")}
          >
            {#each samaQuestions as q (q.code)}
              {@const typeTag = q.type === "MA" ? " [MA]" : ""}
              {@const hasLabel = q.label !== q.code}
              {@const displayText = hasLabel
                ? `${q.code}: ${q.label}${typeTag}`
                : `${q.code}${typeTag}`}
              <li>
                <label
                  class="flex min-h-9 cursor-pointer items-center gap-3 rounded-sm px-2 py-2 text-sm transition-colors hover:bg-surface2"
                >
                  <input
                    type="checkbox"
                    class="size-4.5 cursor-pointer accent-accent"
                    checked={crossSelected[q.code] ?? false}
                    onchange={(e) => {
                      onCrossToggle(q.code, (e.target as HTMLInputElement).checked);
                    }}
                  />
                  <span class="truncate">{displayText}</span>
                </label>
              </li>
            {/each}
          </ul>
        {/if}
        {#if onAddDerived}
          <button
            type="button"
            class="mt-2 flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-border px-2 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent hover:bg-accent-bg hover:text-accent"
            onclick={() => {
              open = false;
              onAddDerived?.();
            }}
          >
            {t("derived.popover.add")}
          </button>
        {/if}
      </div>

      <!-- Weight -->
      {#if weightColumnName}
        <div class="flex items-center justify-between gap-3 p-3 text-sm">
          <span class="truncate text-text" title={weightColumnName}>
            {t("weight.label", { col: weightColumnName })}
          </span>
          <ToggleGroup>
            <ToggleButton active={weightEnabled} onclick={() => onWeightToggle(true)}>
              {t("weight.on")}
            </ToggleButton>
            <ToggleButton active={!weightEnabled} onclick={() => onWeightToggle(false)}>
              {t("weight.off")}
            </ToggleButton>
          </ToggleGroup>
        </div>
      {/if}
    </div>
  {/if}
</div>
