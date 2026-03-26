<script lang="ts">
  import { t } from "../../lib/i18n.svelte";
  import { runValidation } from "../../lib/duckdb";
  import type { Diagnostic } from "../../lib/validateRawData";
  import type { RawData, LayoutData } from "../../lib/types";
  import Button from "../shared/Button.svelte";
  import SectionTitle from "../shared/SectionTitle.svelte";
  import Alert from "../shared/Alert.svelte";

  interface Props {
    rawData: RawData;
    layout: LayoutData;
    onProceed: () => void;
    onBack: () => void;
  }

  let { rawData, layout, onProceed, onBack }: Props = $props();

  let diagnostics = $state<Diagnostic[] | null>(null);
  let error = $state<string | null>(null);

  $effect(() => {
    const _rawData = rawData;
    const _layout = layout;
    let cancelled = false;
    diagnostics = null;
    error = null;

    runValidation(_layout.rawJson, _rawData.headers)
      .then((r) => {
        if (!cancelled) diagnostics = r;
      })
      .catch((e) => {
        if (!cancelled) error = (e as Error).message;
      });

    return () => {
      cancelled = true;
    };
  });

  let statusByType = $derived.by(() => {
    const map = new Map<string, "error" | "warn">();
    if (diagnostics) {
      for (const d of diagnostics) map.set(d.type, d.severity);
    }
    return map;
  });

  let errors = $derived(diagnostics?.filter((d) => d.severity === "error") ?? []);
  let warnings = $derived(diagnostics?.filter((d) => d.severity === "warn") ?? []);
</script>

{#snippet CheckItem(label: string, status: "ok" | "warn" | "error")}
  {@const icon = status === "ok" ? "\u2713" : status === "warn" ? "!" : "\u2717"}
  {@const color =
    status === "ok"
      ? "text-green-600 dark:text-green-400"
      : status === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400"}
  <li class="flex items-center gap-2">
    <span
      class="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold {color}"
    >
      {icon}
    </span>
    <span class="text-text">{label}</span>
    <span class="text-xs font-medium {color}">{t(`validation.${status}`)}</span>
  </li>
{/snippet}

{#if error}
  <div class="space-y-4">
    <p class="text-sm text-red-600">{error}</p>
    <Button variant="secondary" size="md" onclick={onBack}>
      {t("validation.back")}
    </Button>
  </div>
{:else if !diagnostics}
  <p class="py-4 text-center text-sm text-muted">{t("validation.running")}</p>
{:else}
  <div class="space-y-4">
    <SectionTitle class="">{t("validation.title")}</SectionTitle>

    <ul class="space-y-2 text-sm">
      {@render CheckItem(
        t("validation.check.layoutStructure"),
        statusByType.get("invalidLayout") ?? "ok",
      )}
      {@render CheckItem(
        t("validation.check.columns"),
        statusByType.get("dropped") ?? "ok",
      )}
      {@render CheckItem(
        t("validation.check.saCode"),
        statusByType.get("unknownCode") ?? "ok",
      )}
      {@render CheckItem(
        t("validation.check.maValues"),
        statusByType.get("invalidMAValue") ?? "ok",
      )}
      {@render CheckItem(
        t("validation.check.numeric"),
        statusByType.get("nonNumeric") ?? "ok",
      )}
    </ul>

    {#if errors.length > 0}
      <Alert variant="error">
        <ul class="list-inside list-disc space-y-1">
          {#each errors as d (`${d.type}-${d.key}`)}
            <li>
              {t(`validation.detail.${d.type}`, { key: d.key, label: d.label, ...d.params })}
            </li>
          {/each}
        </ul>
        <p class="mt-2 font-medium">{t("validation.fixPrompt")}</p>
      </Alert>
    {/if}

    {#if warnings.length > 0}
      <Alert variant="warning">
        <ul class="list-inside list-disc space-y-1">
          {#each warnings as d (`${d.type}-${d.key}`)}
            <li>
              {t(`validation.detail.${d.type}`, { key: d.key, label: d.label, ...d.params })}
            </li>
          {/each}
        </ul>
      </Alert>
    {/if}

    <div class="flex gap-3 pt-2">
      <Button variant="secondary" size="md" onclick={onBack}>
        {t("validation.back")}
      </Button>
      {#if errors.length === 0}
        <Button variant="primary" size="md" onclick={onProceed}>
          {t("import.proceed")}
        </Button>
      {/if}
    </div>
  </div>
{/if}
