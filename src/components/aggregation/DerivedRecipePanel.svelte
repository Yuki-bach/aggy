<script lang="ts">
  import type { DerivedRecipe, CombineSARecipe, BinNARecipe } from "../../lib/derivedRecipe";
  import type { Layout } from "../../lib/layout";
  import { t } from "../../lib/i18n.svelte";
  import Button from "../shared/Button.svelte";
  import CombineSAForm from "./CombineSAForm.svelte";
  import BinNAForm from "./BinNAForm.svelte";

  interface Props {
    recipes: DerivedRecipe[];
    baseLayout: Layout;
    derivedLayout: Layout;
    initialMode: "type-select" | "edit";
    initialEditCode: string | null;
    onCommit: (next: DerivedRecipe[]) => Promise<string | null>;
    onCancel: () => void;
  }

  let {
    recipes,
    baseLayout,
    derivedLayout,
    initialMode,
    initialEditCode,
    onCommit,
    onCancel,
  }: Props = $props();

  type View =
    | { kind: "type-select" }
    | { kind: "form-combineSA"; editCode: string | null }
    | { kind: "form-binNA"; editCode: string | null };

  let view = $state<View>(
    initialMode === "edit" && initialEditCode
      ? (() => {
          const r = recipes.find((x) => x.code === initialEditCode);
          if (!r) return { kind: "type-select" } as View;
          return r.type === "combineSA"
            ? ({ kind: "form-combineSA", editCode: r.code } as View)
            : ({ kind: "form-binNA", editCode: r.code } as View);
        })()
      : { kind: "type-select" },
  );

  let editingCombineSA = $derived(
    view.kind === "form-combineSA" && view.editCode
      ? (recipes.find((r) => r.code === view.editCode && r.type === "combineSA") as
          | CombineSARecipe
          | undefined)
      : undefined,
  );

  let editingBinNA = $derived(
    view.kind === "form-binNA" && view.editCode
      ? (recipes.find((r) => r.code === view.editCode && r.type === "binNA") as
          | BinNARecipe
          | undefined)
      : undefined,
  );
</script>

<div class="flex min-h-0 flex-col bg-bg" role="region" aria-label={t("section.derived")}>
  <div class="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
    <h2 class="text-base font-bold text-text">{t("derived.dialog.title")}</h2>
    <Button variant="ghost" size="md" onclick={onCancel}>{t("derived.cancel")}</Button>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto px-6 py-6">
    {#if view.kind === "type-select"}
      <div class="mx-auto grid max-w-[640px] grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          class="flex h-full flex-col gap-2 rounded-xl border border-border bg-surface p-5 text-left transition-colors hover:border-accent hover:bg-accent-bg"
          onclick={() => (view = { kind: "form-combineSA", editCode: null })}
        >
          <span class="text-base font-bold text-text">{t("derived.kind.combineSA")}</span>
          <span class="text-sm text-text-secondary">
            {t("derived.dialog.combineSA.desc")}
          </span>
        </button>
        <button
          type="button"
          class="flex h-full flex-col gap-2 rounded-xl border border-border bg-surface p-5 text-left transition-colors hover:border-accent hover:bg-accent-bg"
          onclick={() => (view = { kind: "form-binNA", editCode: null })}
        >
          <span class="text-base font-bold text-text">{t("derived.kind.binNA")}</span>
          <span class="text-sm text-text-secondary">
            {t("derived.dialog.binNA.desc")}
          </span>
        </button>
      </div>
    {:else if view.kind === "form-combineSA"}
      <CombineSAForm
        existingRecipes={recipes}
        {baseLayout}
        editing={editingCombineSA ?? null}
        {onCommit}
        {onCancel}
      />
    {:else}
      <BinNAForm
        existingRecipes={recipes}
        {baseLayout}
        editing={editingBinNA ?? null}
        {onCommit}
        {onCancel}
      />
    {/if}
  </div>
</div>
