<script lang="ts">
  import type { Question } from "../../lib/types";
  import type { MatrixGroup } from "../../lib/layout";

  interface Props {
    questions: Question[];
    matrixGroups: MatrixGroup[];
  }

  let { questions, matrixGroups }: Props = $props();

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

  function findScrollContainer(el: HTMLElement): HTMLElement | null {
    let p: HTMLElement | null = el.parentElement;
    while (p) {
      const oy = getComputedStyle(p).overflowY;
      if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight) {
        return p;
      }
      p = p.parentElement;
    }
    return null;
  }

  function jumpTo(targetId: string): void {
    // Question codes are user-supplied (from the layout file) and may contain
    // digits, dots or other characters that have special meaning in CSS
    // selectors. CSS.escape sanitizes the id for use inside `#...`.
    const el = document.querySelector<HTMLElement>(`#${CSS.escape(targetId)}`);
    if (!el) return;
    const sc = findScrollContainer(el);
    if (!sc) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const stickyEl = sc.querySelector<HTMLElement>("[data-sticky-toolbar]");
    const stickyH = stickyEl?.offsetHeight ?? 0;
    const offset =
      el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - stickyH;
    sc.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
  }
</script>

<ul class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
  {#each items as item (item.targetId)}
    <li>
      <button
        type="button"
        class="flex w-full items-baseline gap-2 rounded-sm px-3 py-2 text-left transition-colors hover:bg-surface2"
        onclick={() => jumpTo(item.targetId)}
      >
        <span class="shrink-0 font-mono text-xs tracking-wide text-muted">{item.code}</span>
        <span class="truncate text-sm text-text">{item.label}</span>
      </button>
    </li>
  {/each}
</ul>
