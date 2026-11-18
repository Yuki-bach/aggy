<script lang="ts">
  import type { DerivedRecipe, GroupSARecipe, ItemGroup } from "../../lib/derivedRecipe";
  import type { Layout, LayoutItem } from "../../lib/layout";
  import { t } from "../../lib/i18n.svelte";
  import Button from "../shared/Button.svelte";
  import Alert from "../shared/Alert.svelte";

  interface Props {
    existingRecipes: DerivedRecipe[];
    baseLayout: Layout;
    editing: GroupSARecipe | null;
    onCommit: (next: DerivedRecipe[]) => Promise<string | null>;
    onCancel: () => void;
  }

  let { existingRecipes, baseLayout, editing, onCommit, onCancel }: Props = $props();

  type GroupRow = { code: string; label: string; sources: string[] };

  function emptyRow(): GroupRow {
    return { code: "", label: "", sources: [] };
  }

  let code = $state(editing?.code ?? "");
  let label = $state(editing?.label ?? "");
  let source = $state(editing?.source ?? "");
  let rows = $state<GroupRow[]>(
    editing?.groups.map((g) => ({
      code: g.code,
      label: g.label,
      sources: [...g.sources],
    })) ?? [emptyRow()],
  );
  let saving = $state(false);
  let errorMsg = $state<string | null>(null);

  let saQuestions = $derived(baseLayout.filter((q) => q.type === "SA"));

  let sourceItems = $derived.by<LayoutItem[]>(() => {
    const q = baseLayout.find((e) => e.key === source);
    return q?.type === "SA" ? q.items : [];
  });

  let codePlaceholder = $derived(source ? `${source}_grp` : "");
  let labelPlaceholder = $derived.by(() => {
    if (!source) return "";
    const sourceLabel = baseLayout.find((q) => q.key === source)?.label ?? source;
    return `${sourceLabel}${t("derived.groupSA.label.suffix")}`;
  });

  let assignedCodes = $derived(new Set(rows.flatMap((r) => r.sources)));
  let unassignedItems = $derived(sourceItems.filter((it) => !assignedCodes.has(it.code)));
  let coverageFull = $derived(sourceItems.length > 0 && unassignedItems.length === 0);

  function onSourceChange(): void {
    // Reset group assignments when switching source — old item codes no longer apply
    rows = [emptyRow()];
  }

  function addRow(): void {
    rows = [...rows, emptyRow()];
  }

  function removeRow(i: number): void {
    rows = rows.filter((_, idx) => idx !== i);
    if (rows.length === 0) rows = [emptyRow()];
  }

  function toggleSource(rowIndex: number, itemCode: string): void {
    const row = rows[rowIndex];
    if (row.sources.includes(itemCode)) {
      row.sources = row.sources.filter((c) => c !== itemCode);
    } else {
      // Remove from any other row first (UI-level exclusivity)
      for (const r of rows) {
        if (r.sources.includes(itemCode)) {
          r.sources = r.sources.filter((c) => c !== itemCode);
        }
      }
      row.sources = [...row.sources, itemCode];
    }
    rows = [...rows];
  }

  function isTakenElsewhere(rowIndex: number, itemCode: string): boolean {
    return rows.some((r, i) => i !== rowIndex && r.sources.includes(itemCode));
  }

  function parseRows(): { ok: true; groups: ItemGroup[] } | { ok: false; error: string } {
    const groups: ItemGroup[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const c = r.code.trim();
      const l = r.label.trim();
      if (!c || !l) {
        return { ok: false, error: t("derived.error.required") };
      }
      if (r.sources.length === 0) {
        return { ok: false, error: t("derived.groupSA.error.emptySources") };
      }
      groups.push({ code: c, label: l, sources: [...r.sources] });
    }
    return { ok: true, groups };
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
    if (!coverageFull) {
      errorMsg = t("derived.groupSA.coverage.uncoveredOf", {
        count: unassignedItems.length,
        total: sourceItems.length,
      });
      return;
    }
    const parsed = parseRows();
    if (!parsed.ok) {
      errorMsg = parsed.error;
      return;
    }
    const myRecipe: GroupSARecipe = {
      type: "groupSA",
      code: effectiveCode,
      label: effectiveLabel,
      source,
      groups: parsed.groups,
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

<form
  class="mx-auto flex max-w-[820px] flex-col gap-5"
  onsubmit={(event) => {
    event.preventDefault();
    void handleSave();
  }}
>
  <div class="flex flex-col gap-1.5">
    <label for="groupSA-source" class="text-sm font-medium text-text">
      {t("derived.groupSA.source")}
    </label>
    <select
      id="groupSA-source"
      bind:value={source}
      onchange={onSourceChange}
      class="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
    >
      <option value="">—</option>
      {#each saQuestions as q (q.key)}
        <option value={q.key}>{q.key} — {q.label}</option>
      {/each}
    </select>
  </div>

  <div class="flex flex-col gap-1.5">
    <label for="groupSA-code" class="text-sm font-medium text-text">
      {t("derived.field.code")}
    </label>
    <input
      id="groupSA-code"
      type="text"
      bind:value={code}
      placeholder={codePlaceholder}
      class="rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-text focus:border-accent focus:outline-none"
      autocomplete="off"
      spellcheck="false"
    />
  </div>

  <div class="flex flex-col gap-1.5">
    <label for="groupSA-label" class="text-sm font-medium text-text">
      {t("derived.field.label")}
    </label>
    <input
      id="groupSA-label"
      type="text"
      bind:value={label}
      placeholder={labelPlaceholder}
      class="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
      autocomplete="off"
      spellcheck="false"
    />
  </div>

  <fieldset class="flex flex-col gap-2 border-0 p-0">
    <legend class="text-sm font-medium text-text">{t("derived.groupSA.groups")}</legend>
    <div class="overflow-x-auto rounded-md border border-border bg-surface">
      <table class="w-full text-sm">
        <caption class="sr-only">{t("derived.groupSA.groups")}</caption>
        <thead class="bg-surface2">
          <tr>
            <th scope="col" class="w-[18%] px-2 py-2 text-left text-xs font-bold text-muted">
              {t("derived.groupSA.group.code")}
            </th>
            <th scope="col" class="w-[22%] px-2 py-2 text-left text-xs font-bold text-muted">
              {t("derived.groupSA.group.label")}
            </th>
            <th scope="col" class="px-2 py-2 text-left text-xs font-bold text-muted">
              {t("derived.groupSA.group.sources")}
            </th>
            <th scope="col" class="w-[10%] px-2 py-2">
              <span class="sr-only">{t("derived.delete")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {#each rows as row, i (i)}
            <tr class="border-t border-border align-top">
              <td class="px-2 py-1.5">
                <input
                  type="text"
                  aria-label={`${t("derived.groupSA.group.code")} ${i + 1}`}
                  bind:value={row.code}
                  class="w-full rounded-sm border border-border bg-surface px-2 py-1 font-mono text-xs text-text focus:border-accent focus:outline-none"
                  autocomplete="off"
                  spellcheck="false"
                />
              </td>
              <td class="px-2 py-1.5">
                <input
                  type="text"
                  aria-label={`${t("derived.groupSA.group.label")} ${i + 1}`}
                  bind:value={row.label}
                  class="w-full rounded-sm border border-border bg-surface px-2 py-1 text-xs text-text focus:border-accent focus:outline-none"
                  autocomplete="off"
                  spellcheck="false"
                />
              </td>
              <td class="px-2 py-1.5">
                {#if sourceItems.length === 0}
                  <p class="text-xs text-muted">{t("derived.groupSA.sources.empty")}</p>
                {:else}
                  <div class="flex flex-col gap-0.5">
                    {#each sourceItems as item (item.code)}
                      {@const checked = row.sources.includes(item.code)}
                      {@const taken = isTakenElsewhere(i, item.code)}
                      <label
                        class="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-0.5 text-xs hover:bg-surface2 {taken
                          ? 'opacity-40'
                          : ''}"
                      >
                        <input
                          type="checkbox"
                          {checked}
                          disabled={taken}
                          onchange={() => toggleSource(i, item.code)}
                          class="size-3.5 cursor-pointer accent-accent disabled:cursor-not-allowed"
                        />
                        <span class="shrink-0 font-mono text-muted">{item.code}</span>
                        <span class="truncate text-text-secondary">{item.label}</span>
                      </label>
                    {/each}
                  </div>
                {/if}
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
    >+ {t("derived.groupSA.group.add")}</button>
  </fieldset>

  {#if sourceItems.length > 0}
    {#if coverageFull}
      <Alert variant="info">
        {t("derived.groupSA.coverage.full", { total: sourceItems.length })}
      </Alert>
    {:else}
      <Alert variant="warning">
        {t("derived.groupSA.coverage.uncoveredOf", {
          count: unassignedItems.length,
          total: sourceItems.length,
        })}
        {#if unassignedItems.length > 0}
          <span class="mt-1 block font-mono text-xs">
            {unassignedItems.map((it) => it.code).join(", ")}
          </span>
        {/if}
      </Alert>
    {/if}
  {/if}

  {#if errorMsg}
    <Alert variant="error">{errorMsg}</Alert>
  {/if}

  <div class="flex justify-end gap-2 pt-2">
    <Button variant="secondary" size="md" type="button" onclick={onCancel} disabled={saving}>
      {t("derived.cancel")}
    </Button>
    <Button variant="primary" size="md" type="submit" disabled={saving || (sourceItems.length > 0 && !coverageFull)}>
      {saving ? t("derived.saving") : t("derived.save")}
    </Button>
  </div>
</form>
