import type { Layout } from "./layout";

export interface BinDef {
  code: string;
  label: string;
  min: number | null; // inclusive, null = -∞
  max: number | null; // exclusive, null = +∞
}

/** SA × SA × ... → 新SA（直積、N設問対応） */
export interface CombineSARecipe {
  type: "combineSA";
  code: string;
  label: string;
  sources: string[];
  separator?: string; // default "_"
}

/** NA → SA（ビニング） */
export interface BinNARecipe {
  type: "binNA";
  code: string;
  label: string;
  source: string;
  bins: BinDef[];
}

/** 新しい選択肢 = 元の SA 選択肢の束 */
export interface ItemGroup {
  code: string;
  label: string;
  sources: string[]; // original item codes
}

/** SA → SA（選択肢まとめ） */
export interface GroupSARecipe {
  type: "groupSA";
  code: string;
  label: string;
  source: string;
  groups: ItemGroup[];
}

export type DerivedRecipe = CombineSARecipe | BinNARecipe | GroupSARecipe;

/** Validate recipes structurally against the layout. Returns error messages. */
export function validateRecipes(recipes: DerivedRecipe[], layout: Layout): string[] {
  const errors: string[] = [];
  const layoutKeys = new Set(layout.map((q) => q.key));
  const recipeCodes = new Set<string>();

  for (const r of recipes) {
    // code non-empty
    if (!r.code) {
      errors.push("レシピの code が空です");
      continue;
    }
    // label non-empty
    if (!r.label) {
      errors.push(`"${r.code}": label が空です`);
    }

    // duplicate with layout
    if (layoutKeys.has(r.code)) {
      errors.push(`"${r.code}": レイアウトの既存キーと重複しています`);
    }

    // duplicate among recipes
    if (recipeCodes.has(r.code)) {
      errors.push(`"${r.code}": レシピ間で code が重複しています`);
    }
    recipeCodes.add(r.code);

    if (r.type === "combineSA") {
      validateCombineSA(r, layout, errors);
    } else if (r.type === "binNA") {
      validateBinNA(r, layout, errors);
    } else {
      validateGroupSA(r, layout, errors);
    }
  }

  return errors;
}

// ─── Internal ───────────────────────────────────────────────

function validateCombineSA(r: CombineSARecipe, layout: Layout, errors: string[]): void {
  if (r.sources.length < 2) {
    errors.push(`"${r.code}": sources は2つ以上必要です`);
    return;
  }

  const seen = new Set<string>();
  for (const src of r.sources) {
    if (seen.has(src)) {
      errors.push(`"${r.code}": sources 内に重複があります: ${src}`);
    }
    seen.add(src);

    const found = layout.find((e) => e.key === src);
    if (!found) {
      errors.push(`"${r.code}": ソース "${src}" がレイアウトに存在しません`);
    } else if (found.type !== "SA") {
      errors.push(`"${r.code}": ソース "${src}" はSA型ではありません（${found.type}）`);
    }
  }
}

function validateBinNA(r: BinNARecipe, layout: Layout, errors: string[]): void {
  const found = layout.find((e) => e.key === r.source);
  if (!found) {
    errors.push(`"${r.code}": ソース "${r.source}" がレイアウトに存在しません`);
  } else if (found.type !== "NA") {
    errors.push(`"${r.code}": ソース "${r.source}" はNA型ではありません（${found.type}）`);
  }

  if (r.bins.length === 0) {
    errors.push(`"${r.code}": bins は1つ以上必要です`);
    return;
  }

  const binCodes = new Set<string>();
  for (const bin of r.bins) {
    if (binCodes.has(bin.code)) {
      errors.push(`"${r.code}": bins 内に重複した code があります: ${bin.code}`);
    }
    binCodes.add(bin.code);

    if (bin.min !== null && bin.max !== null && bin.min >= bin.max) {
      errors.push(
        `"${r.code}": bin "${bin.code}" の min (${bin.min}) が max (${bin.max}) 以上です`,
      );
    }
  }
}

function validateGroupSA(r: GroupSARecipe, layout: Layout, errors: string[]): void {
  const found = layout.find((e) => e.key === r.source);
  if (!found) {
    errors.push(`"${r.code}": ソース "${r.source}" がレイアウトに存在しません`);
    return;
  }
  if (found.type !== "SA") {
    errors.push(`"${r.code}": ソース "${r.source}" はSA型ではありません（${found.type}）`);
    return;
  }

  if (r.groups.length === 0) {
    errors.push(`"${r.code}": groups は1つ以上必要です`);
    return;
  }

  const itemCodes = new Set(found.items.map((it) => it.code));
  const groupCodes = new Set<string>();
  const assigned = new Set<string>();

  for (const g of r.groups) {
    if (!g.code) {
      errors.push(`"${r.code}": group の code が空です`);
      continue;
    }
    if (!g.label) {
      errors.push(`"${r.code}": group "${g.code}" の label が空です`);
    }
    if (groupCodes.has(g.code)) {
      errors.push(`"${r.code}": groups 内に重複した code があります: ${g.code}`);
    }
    groupCodes.add(g.code);

    if (g.sources.length === 0) {
      errors.push(`"${r.code}": group "${g.code}" の sources が空です`);
      continue;
    }

    for (const src of g.sources) {
      if (!itemCodes.has(src)) {
        errors.push(`"${r.code}": group "${g.code}" のソース "${src}" が選択肢に存在しません`);
      }
      if (assigned.has(src)) {
        errors.push(`"${r.code}": 選択肢 "${src}" が複数の group に割り当てられています`);
      }
      assigned.add(src);
    }
  }

  const unassigned = [...itemCodes].filter((c) => !assigned.has(c));
  if (unassigned.length > 0) {
    errors.push(`"${r.code}": 未割当の選択肢があります: ${unassigned.join(", ")}`);
  }
}
