<script lang="ts">
  import type { Question } from "../../lib/types";
  import type { MatrixGroup } from "../../lib/layout";
  import { scrollToCard } from "../../lib/scrollToCard";

  interface Props {
    questions: Question[];
    matrixGroups: MatrixGroup[];
    excludeCodes?: Set<string>;
  }

  let { questions, matrixGroups, excludeCodes }: Props = $props();

  type TocItem =
    | { kind: "single"; targetId: string; code: string; label: string }
    | { kind: "matrix"; targetId: string; code: string; label: string };

  let items = $derived.by<TocItem[]>(() => {
    const matrixLabelByKey = new Map(
      matrixGroups.map((g) => [g.matrixKey, g.matrixLabel] as const),
    );
    const emitted = new Set<string>();
    const result: TocItem[] = [];
    for (const q of questions) {
      if (excludeCodes?.has(q.code)) continue;
      if (q.matrixKey) {
        if (emitted.has(q.matrixKey)) continue;
        emitted.add(q.matrixKey);
        result.push({
          kind: "matrix",
          targetId: `card-matrix-${q.matrixKey}`,
          code: q.matrixKey,
          label: matrixLabelByKey.get(q.matrixKey) ?? q.matrixKey,
        });
      } else {
        result.push({
          kind: "single",
          targetId: `card-${q.code}`,
          code: q.code,
          label: q.label,
        });
      }
    }
    return result;
  });
</script>

<ul class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
  {#each items as item (item.targetId)}
    <li>
      <button
        type="button"
        class="flex w-full items-baseline gap-2 rounded-sm px-3 py-2 text-left transition-colors hover:bg-surface2"
        onclick={() => scrollToCard(item.targetId)}
      >
        <span class="shrink-0 font-mono text-xs tracking-wide text-muted">{item.code}</span>
        <span class="truncate text-sm text-text">{item.label}</span>
      </button>
    </li>
  {/each}
</ul>
