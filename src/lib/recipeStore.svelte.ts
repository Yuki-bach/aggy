import type { Layout } from "./layout";
import { buildQuestions, buildMatrixGroups, findWeightColumn } from "./layout";
import type { DerivedRecipe } from "./derivedRecipe";
import { validateRecipes } from "./derivedRecipe";
import { prepareDerivedLayout, dropDerivedColumn } from "./duckdb.svelte";
import { t } from "./i18n.svelte";

export class RecipeStore {
  recipes = $state<DerivedRecipe[]>([]);
  derivedLayout = $state<Layout>([]);
  derivedWarnings = $state<string[]>([]);
  error = $state("");

  questions = $derived(buildQuestions(this.derivedLayout));
  weightColumnName = $derived(findWeightColumn(this.derivedLayout));
  matrixGroups = $derived(buildMatrixGroups(this.derivedLayout));
  matrixLabels = $derived(
    Object.fromEntries(this.matrixGroups.map((g) => [g.matrixKey, g.matrixLabel])),
  );

  constructor(
    private readonly baseLayout: Layout,
    initial: DerivedRecipe[],
  ) {
    this.recipes = initial;
    this.derivedLayout = baseLayout;
  }

  /**
   * Run prepareDerivedLayout once for OPFS-restored recipes.
   * Subsequent recipe mutations go through commit() / remove(), which keep
   * derivedLayout in sync explicitly — avoiding the double prepare an
   * effect-on-recipes would cause right after a commit.
   */
  async restoreInitial(): Promise<void> {
    if (this.recipes.length === 0) return;
    try {
      const result = await prepareDerivedLayout(this.baseLayout, this.recipes);
      this.derivedLayout = result.layout;
      this.derivedWarnings = result.warnings;
    } catch (e) {
      this.error = t("error.aggregation", { msg: (e as Error).message });
    }
  }

  /** Returns null on success, an error message string on validation/prepare failure. */
  async commit(next: DerivedRecipe[]): Promise<string | null> {
    const errs = validateRecipes(next, this.baseLayout);
    if (errs.length > 0) return errs[0];
    try {
      const result = await prepareDerivedLayout(this.baseLayout, next);
      this.derivedLayout = result.layout;
      this.derivedWarnings = result.warnings;
      this.recipes = next;
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }

  /**
   * Remove a recipe and drop its derived column. Caller is responsible for
   * pruning any UI state keyed by `code` (e.g. cross-tab selections).
   * The DROP COLUMN must happen before the recipes array shrinks because
   * prepareDerivedLayout only DROPs columns for currently-listed recipes —
   * a removed recipe's column would otherwise linger on the survey table.
   */
  async remove(code: string): Promise<void> {
    try {
      await dropDerivedColumn(code);
    } catch {
      // Best-effort: column may not exist if a previous prepare failed
    }
    this.derivedLayout = this.derivedLayout.filter((q) => q.key !== code);
    this.recipes = this.recipes.filter((r) => r.code !== code);
  }
}
