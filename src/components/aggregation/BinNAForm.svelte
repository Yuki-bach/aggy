<script lang="ts">
  import type { DerivedRecipe, BinNARecipe, BinDef } from "../../lib/derivedRecipe";
  import type { Layout } from "../../lib/layout";
  import { t } from "../../lib/i18n.svelte";
  import Button from "../shared/Button.svelte";
  import Alert from "../shared/Alert.svelte";
  import { getNaStats, getBinCoverage, type NaStats } from "../../lib/duckdb.svelte";
  import {
    fillByStep as computeStepBins,
    fillByQuartile as computeQuartileBins,
  } from "../../lib/binPresets";

  interface Props {
    existingRecipes: DerivedRecipe[];
    baseLayout: Layout;
    editing: BinNARecipe | null;
    onCommit: (next: DerivedRecipe[]) => Promise<string | null>;
    onCancel: () => void;
  }

  let { existingRecipes, baseLayout, editing, onCommit, onCancel }: Props = $props();

  type Row = { code: string; label: string; min: string; max: string };

  function emptyRow(): Row {
    return { code: "", label: "", min: "", max: "" };
  }

  let code = $state(editing?.code ?? "");
  let label = $state(editing?.label ?? "");
  let source = $state(editing?.source ?? "");
  let rows = $state<Row[]>(
    editing?.bins.map((b) => ({
      code: b.code,
      label: b.label,
      min: b.min === null ? "" : String(b.min),
      max: b.max === null ? "" : String(b.max),
    })) ?? [emptyRow()],
  );
  let saving = $state(false);
  let errorMsg = $state<string | null>(null);
  let naStats = $state<NaStats | null>(null);
  let coverage = $state<{ uncoveredCount: number } | null>(null);

  let naQuestions = $derived(baseLayout.filter((q) => q.type === "NA"));

  let codePlaceholder = $derived(source ? `${source}_bin` : "");
  let labelPlaceholder = $derived.by(() => {
    if (!source) return "";
    const sourceLabel = baseLayout.find((q) => q.key === source)?.label ?? source;
    return `${sourceLabel}${t("derived.binNA.label.suffix")}`;
  });

  // Load source stats whenever the source changes
  let statsRunId = 0;
  $effect(() => {
    const src = source;
    coverage = null;
    if (!src) {
      naStats = null;
      return;
    }
    const runId = ++statsRunId;
    void (async () => {
      try {
        const stats = await getNaStats(src);
        if (runId !== statsRunId) return;
        naStats = stats;
      } catch {
        if (runId !== statsRunId) return;
        naStats = null;
      }
    })();
  });

  // Coverage probe (debounced) whenever bins or source change
  let coverageRunId = 0;
  $effect(() => {
    const src = source;
    const bins = parseValidBins(rows);
    if (!src || bins.length === 0) {
      coverage = null;
      return;
    }
    const runId = ++coverageRunId;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const c = await getBinCoverage(src, bins);
          if (runId !== coverageRunId) return;
          coverage = { uncoveredCount: c.uncoveredCount };
        } catch {
          if (runId !== coverageRunId) return;
          coverage = null;
        }
      })();
    }, 400);
    return () => clearTimeout(timer);
  });

  function parseValidBins(rs: Row[]): BinDef[] {
    const bins: BinDef[] = [];
    for (const r of rs) {
      const c = r.code.trim();
      if (!c) continue;
      const min = r.min.trim() === "" ? null : Number(r.min);
      const max = r.max.trim() === "" ? null : Number(r.max);
      if (min !== null && Number.isNaN(min)) continue;
      if (max !== null && Number.isNaN(max)) continue;
      bins.push({ code: c, label: r.label.trim() || c, min, max });
    }
    return bins;
  }

  function isInitialEmpty(rs: Row[]): boolean {
    return (
      rs.length === 1 && rs[0].code === "" && rs[0].label === "" && rs[0].min === "" && rs[0].max === ""
    );
  }

  function confirmOverwrite(): boolean {
    if (isInitialEmpty(rows)) return true;
    if (rows.length === 0) return true;
    return confirm(t("derived.binNA.preset.confirm"));
  }

  function fmtNumber(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  }

  function binsToRows(bins: { code: string; label: string; min: number | null; max: number | null }[]): Row[] {
    return bins.map((b) => ({
      code: b.code,
      label: b.label,
      min: b.min === null ? "" : fmtNumber(b.min),
      max: b.max === null ? "" : fmtNumber(b.max),
    }));
  }

  function fillByStep(step: number): void {
    if (!naStats) return;
    if (!confirmOverwrite()) return;
    rows = binsToRows(computeStepBins(naStats, step));
  }

  function fillByQuartile(): void {
    if (!naStats) return;
    if (!confirmOverwrite()) return;
    const bins = computeQuartileBins(naStats);
    rows = binsToRows([
      { ...bins[0], label: `Q1 (<${fmtNumber(bins[0].max!)})` },
      { ...bins[1], label: `Q2 (<${fmtNumber(bins[1].max!)})` },
      { ...bins[2], label: `Q3 (<${fmtNumber(bins[2].max!)})` },
      { ...bins[3], label: `Q4 (≥${fmtNumber(bins[3].min!)})` },
    ]);
  }

  function addRow(): void {
    rows = [...rows, { code: "", label: "", min: "", max: "" }];
  }

  function removeRow(i: number): void {
    rows = rows.filter((_, idx) => idx !== i);
  }

  function parseRows(): { ok: true; bins: BinDef[] } | { ok: false; error: string } {
    const bins: BinDef[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const c = r.code.trim();
      const l = r.label.trim();
      if (!c || !l) {
        return { ok: false, error: `Row ${i + 1}: code/label is required` };
      }
      const min = r.min.trim() === "" ? null : Number(r.min);
      const max = r.max.trim() === "" ? null : Number(r.max);
      if (min !== null && Number.isNaN(min)) {
        return { ok: false, error: `Row ${i + 1}: min is not a number` };
      }
      if (max !== null && Number.isNaN(max)) {
        return { ok: false, error: `Row ${i + 1}: max is not a number` };
      }
      bins.push({ code: c, label: l, min, max });
    }
    return { ok: true, bins };
  }

  async function handleSave(): Promise<void> {
    if (saving) return;
    errorMsg = null;
    const effectiveCode = code.trim() || codePlaceholder;
    const effectiveLabel = label.trim() || labelPlaceholder;
    if (!effectiveCode || !effectiveLabel || !source) {
      errorMsg = t("derived.error.required");
      return;
    }
    const parsed = parseRows();
    if (!parsed.ok) {
      errorMsg = parsed.error;
      return;
    }
    const myRecipe: BinNARecipe = {
      type: "binNA",
      code: effectiveCode,
      label: effectiveLabel,
      source,
      bins: parsed.bins,
    };
    const editingCode = editing?.code;
    const next = editingCode
      ? existingRecipes.map((r) => (r.code === editingCode ? myRecipe : r))
      : [...existingRecipes, myRecipe];
    saving = true;
    const result = await onCommit(next);
    saving = false;
    if (result) errorMsg = result;
  }
</script>

<div class="mx-auto flex max-w-[820px] flex-col gap-5">
  <div class="flex flex-col gap-1.5">
    <label for="binNA-source" class="text-sm font-medium text-text">
      {t("derived.binNA.source")}
    </label>
    <select
      id="binNA-source"
      bind:value={source}
      class="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
    >
      <option value="">—</option>
      {#each naQuestions as q (q.key)}
        <option value={q.key}>{q.key} — {q.label}</option>
      {/each}
    </select>
  </div>

  <div class="flex flex-col gap-1.5">
    <label for="binNA-code" class="text-sm font-medium text-text">
      {t("derived.field.code")}
    </label>
    <input
      id="binNA-code"
      type="text"
      bind:value={code}
      placeholder={codePlaceholder}
      class="rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-text focus:border-accent focus:outline-none"
      autocomplete="off"
      spellcheck="false"
    />
  </div>

  <div class="flex flex-col gap-1.5">
    <label for="binNA-label" class="text-sm font-medium text-text">
      {t("derived.field.label")}
    </label>
    <input
      id="binNA-label"
      type="text"
      bind:value={label}
      placeholder={labelPlaceholder}
      class="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
      autocomplete="off"
      spellcheck="false"
    />
  </div>

  {#if naStats}
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-border bg-surface p-3 text-xs text-text-secondary">
      <span>
        {t("derived.binNA.coverage.range", {
          min: Number.isInteger(naStats.min) ? naStats.min : naStats.min.toFixed(2),
          max: Number.isInteger(naStats.max) ? naStats.max : naStats.max.toFixed(2),
        })}
      </span>
      <span class="text-muted">|</span>
      <span class="font-medium text-muted">{t("derived.binNA.preset.label")}:</span>
      <button
        type="button"
        class="cursor-pointer rounded-md border border-border bg-surface px-2 py-1 text-xs hover:bg-surface2"
        onclick={() => fillByStep(10)}
      >{t("derived.binNA.preset.fill10")}</button>
      <button
        type="button"
        class="cursor-pointer rounded-md border border-border bg-surface px-2 py-1 text-xs hover:bg-surface2"
        onclick={() => fillByStep(5)}
      >{t("derived.binNA.preset.fill5")}</button>
      <button
        type="button"
        class="cursor-pointer rounded-md border border-border bg-surface px-2 py-1 text-xs hover:bg-surface2"
        onclick={fillByQuartile}
      >{t("derived.binNA.preset.quartile")}</button>
    </div>
  {/if}

  <div class="flex flex-col gap-2">
    <span class="text-sm font-medium text-text">{t("derived.binNA.bins")}</span>
    <div class="overflow-x-auto rounded-md border border-border bg-surface">
      <table class="w-full text-sm">
        <thead class="bg-surface2">
          <tr>
            <th class="w-[20%] px-2 py-2 text-left text-xs font-bold text-muted">
              {t("derived.binNA.bin.code")}
            </th>
            <th class="w-[28%] px-2 py-2 text-left text-xs font-bold text-muted">
              {t("derived.binNA.bin.label")}
            </th>
            <th class="w-[20%] px-2 py-2 text-left text-xs font-bold text-muted">
              {t("derived.binNA.bin.min")}
              <span class="font-normal text-muted">({t("derived.binNA.bin.minHint")})</span>
            </th>
            <th class="w-[20%] px-2 py-2 text-left text-xs font-bold text-muted">
              {t("derived.binNA.bin.max")}
              <span class="font-normal text-muted">({t("derived.binNA.bin.maxHint")})</span>
            </th>
            <th class="w-[12%] px-2 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {#each rows as row, i (i)}
            <tr class="border-t border-border">
              <td class="px-2 py-1.5">
                <input
                  type="text"
                  bind:value={row.code}
                  class="w-full rounded-sm border border-border bg-surface px-2 py-1 font-mono text-xs text-text focus:border-accent focus:outline-none"
                  autocomplete="off"
                  spellcheck="false"
                />
              </td>
              <td class="px-2 py-1.5">
                <input
                  type="text"
                  bind:value={row.label}
                  class="w-full rounded-sm border border-border bg-surface px-2 py-1 text-xs text-text focus:border-accent focus:outline-none"
                  autocomplete="off"
                  spellcheck="false"
                />
              </td>
              <td class="px-2 py-1.5">
                <input
                  type="text"
                  inputmode="decimal"
                  bind:value={row.min}
                  class="w-full rounded-sm border border-border bg-surface px-2 py-1 font-mono text-xs text-text focus:border-accent focus:outline-none"
                  autocomplete="off"
                  spellcheck="false"
                />
              </td>
              <td class="px-2 py-1.5">
                <input
                  type="text"
                  inputmode="decimal"
                  bind:value={row.max}
                  class="w-full rounded-sm border border-border bg-surface px-2 py-1 font-mono text-xs text-text focus:border-accent focus:outline-none"
                  autocomplete="off"
                  spellcheck="false"
                />
              </td>
              <td class="px-2 py-1.5 text-right">
                <button
                  type="button"
                  class="cursor-pointer rounded-sm px-2 py-1 text-xs text-muted hover:bg-surface2 hover:text-text"
                  onclick={() => removeRow(i)}
                  aria-label={t("derived.delete")}
                >×</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <button
      type="button"
      class="self-start cursor-pointer rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary hover:bg-surface2 hover:text-text"
      onclick={addRow}
    >+ {t("derived.binNA.bin.add")}</button>
  </div>

  {#if coverage && naStats}
    {#if coverage.uncoveredCount === 0}
      <Alert variant="info">
        {t("derived.binNA.coverage.full", { total: naStats.total })}
      </Alert>
    {:else}
      <Alert variant="warning">
        {t("derived.binNA.coverage.uncoveredOf", {
          count: coverage.uncoveredCount,
          total: naStats.total,
        })}
      </Alert>
    {/if}
  {/if}

  {#if errorMsg}
    <Alert variant="error">{errorMsg}</Alert>
  {/if}

  <div class="flex justify-end gap-2 pt-2">
    <Button variant="secondary" size="md" onclick={onCancel} disabled={saving}>
      {t("derived.cancel")}
    </Button>
    <Button variant="primary" size="md" onclick={handleSave} disabled={saving}>
      {saving ? t("derived.saving") : t("derived.save")}
    </Button>
  </div>
</div>
