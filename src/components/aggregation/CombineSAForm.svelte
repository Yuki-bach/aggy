<script lang="ts">
  import type { DerivedRecipe, CombineSARecipe } from "../../lib/derivedRecipe";
  import type { Layout, LayoutItem } from "../../lib/layout";
  import { t } from "../../lib/i18n.svelte";
  import Button from "../shared/Button.svelte";
  import Alert from "../shared/Alert.svelte";

  interface Props {
    existingRecipes: DerivedRecipe[];
    baseLayout: Layout;
    editing: CombineSARecipe | null;
    onCommit: (next: DerivedRecipe[]) => Promise<string | null>;
    onCancel: () => void;
  }

  let { existingRecipes, baseLayout, editing, onCommit, onCancel }: Props = $props();

  let code = $state(editing?.code ?? "");
  let label = $state(editing?.label ?? "");
  let sources = $state<string[]>(editing?.sources ?? []);
  let separator = $state(editing?.separator ?? "_");
  let saving = $state(false);
  let errorMsg = $state<string | null>(null);

  let saQuestions = $derived(baseLayout.filter((q) => q.type === "SA"));

  let codePlaceholder = $derived(
    sources.length >= 2 ? sources.join(separator || "_") : "",
  );

  let labelPlaceholder = $derived.by(() => {
    if (sources.length < 2) return "";
    return sources
      .map((src) => baseLayout.find((q) => q.key === src)?.label ?? src)
      .join("×");
  });

  let sourceItemsList = $derived(
    sources.map((src) => {
      const q = baseLayout.find((e) => e.key === src);
      return q?.type === "SA" ? q.items : [];
    }),
  );

  let previewItems = $derived.by<LayoutItem[]>(() => {
    if (sourceItemsList.length === 0) return [];
    if (sourceItemsList.some((items) => items.length === 0)) return [];
    return cartesianProduct(sourceItemsList, separator);
  });

  function cartesianProduct(arrays: LayoutItem[][], sep: string): LayoutItem[] {
    if (arrays.length === 1) return arrays[0].map((it) => ({ ...it }));
    let acc = arrays[0].map((it) => ({ ...it }));
    for (let i = 1; i < arrays.length; i++) {
      const next: LayoutItem[] = [];
      for (const a of acc) {
        for (const b of arrays[i]) {
          next.push({ code: `${a.code}${sep}${b.code}`, label: `${a.label}×${b.label}` });
        }
      }
      acc = next;
    }
    return acc;
  }

  function toggleSource(key: string): void {
    sources = sources.includes(key) ? sources.filter((s) => s !== key) : [...sources, key];
  }

  function moveSource(key: string, direction: -1 | 1): void {
    const i = sources.indexOf(key);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= sources.length) return;
    const next = [...sources];
    [next[i], next[j]] = [next[j], next[i]];
    sources = next;
  }

  async function handleSave(): Promise<void> {
    if (saving) return;
    errorMsg = null;
    const effectiveCode = code.trim() || codePlaceholder;
    const effectiveLabel = label.trim() || labelPlaceholder;
    if (!effectiveCode || !effectiveLabel || sources.length < 2) {
      errorMsg = t("derived.error.required");
      return;
    }
    const myRecipe: CombineSARecipe = {
      type: "combineSA",
      code: effectiveCode,
      label: effectiveLabel,
      sources,
      separator: separator || "_",
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

<div class="mx-auto flex max-w-[720px] flex-col gap-5">
  <div class="flex flex-col gap-1.5">
    <span class="text-sm font-medium text-text">{t("derived.combineSA.sources")}</span>
    <div class="flex max-h-64 flex-col gap-0.5 overflow-y-auto rounded-md border border-border bg-surface p-2">
      {#each saQuestions as q (q.key)}
        {@const checked = sources.includes(q.key)}
        {@const order = sources.indexOf(q.key)}
        <label
          class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-surface2"
        >
          <input
            type="checkbox"
            {checked}
            onchange={() => toggleSource(q.key)}
            class="size-4 cursor-pointer accent-accent"
          />
          <span class="shrink-0 font-mono text-xs text-muted">{q.key}</span>
          <span class="flex-1 truncate text-text">{q.label}</span>
          {#if checked}
            <span class="shrink-0 rounded bg-accent-bg px-1.5 text-xs font-bold text-accent">
              {order + 1}
            </span>
            <button
              type="button"
              class="cursor-pointer rounded px-1 text-muted hover:text-text disabled:opacity-30"
              onclick={(e) => {
                e.preventDefault();
                moveSource(q.key, -1);
              }}
              disabled={order === 0}
              aria-label="Move up"
            >↑</button>
            <button
              type="button"
              class="cursor-pointer rounded px-1 text-muted hover:text-text disabled:opacity-30"
              onclick={(e) => {
                e.preventDefault();
                moveSource(q.key, 1);
              }}
              disabled={order === sources.length - 1}
              aria-label="Move down"
            >↓</button>
          {/if}
        </label>
      {/each}
      {#if saQuestions.length === 0}
        <p class="px-2 py-2 text-xs text-muted">No SA questions</p>
      {/if}
    </div>
  </div>

  <div class="flex flex-col gap-1.5">
    <label for="combineSA-sep" class="text-sm font-medium text-text">
      {t("derived.combineSA.separator")}
    </label>
    <input
      id="combineSA-sep"
      type="text"
      bind:value={separator}
      maxlength="3"
      class="w-24 rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-text focus:border-accent focus:outline-none"
      autocomplete="off"
      spellcheck="false"
    />
  </div>

  <div class="flex flex-col gap-1.5">
    <label for="combineSA-code" class="text-sm font-medium text-text">
      {t("derived.field.code")}
    </label>
    <input
      id="combineSA-code"
      type="text"
      bind:value={code}
      placeholder={codePlaceholder}
      class="rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-text focus:border-accent focus:outline-none"
      autocomplete="off"
      spellcheck="false"
    />
  </div>

  <div class="flex flex-col gap-1.5">
    <label for="combineSA-label" class="text-sm font-medium text-text">
      {t("derived.field.label")}
    </label>
    <input
      id="combineSA-label"
      type="text"
      bind:value={label}
      placeholder={labelPlaceholder}
      class="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
      autocomplete="off"
      spellcheck="false"
    />
  </div>

  {#if previewItems.length > 0}
    <div class="rounded-md border border-border bg-surface p-3">
      <p class="mb-2 text-xs font-bold text-muted">
        {t("derived.combineSA.preview.count", { count: previewItems.length })}
      </p>
      <p class="mb-1 text-xs text-muted">{t("derived.combineSA.preview.sample")}</p>
      <ul class="flex flex-col gap-0.5">
        {#each previewItems.slice(0, 5) as item, i (i)}
          <li class="flex items-baseline gap-2 text-xs">
            <span class="shrink-0 font-mono text-muted">{item.code}</span>
            <span class="truncate text-text-secondary">{item.label}</span>
          </li>
        {/each}
        {#if previewItems.length > 5}
          <li class="text-xs text-muted">…</li>
        {/if}
      </ul>
    </div>
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
