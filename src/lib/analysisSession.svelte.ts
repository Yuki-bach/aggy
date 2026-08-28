import type { Layout } from "./layout";
import type { DerivedRecipe } from "./derivedRecipe";
import type { LayoutData, Question, RawData, Tab } from "./types";
import { AggRunner } from "./aggRunner.svelte";
import { RecipeStore } from "./recipeStore.svelte";

export class AnalysisSession {
  readonly recipeStore: RecipeStore;
  readonly aggRunner = new AggRunner();

  ready = $state(false);
  stateRevision = $state(0);
  resultRevision = $state(-1);

  private pending: Promise<void> = Promise.resolve();

  constructor(
    readonly rawData: RawData,
    readonly layoutData: LayoutData,
    baseLayout: Layout,
    initialRecipes: DerivedRecipe[],
  ) {
    this.recipeStore = new RecipeStore(baseLayout, initialRecipes);
  }

  get questions(): Question[] {
    return this.recipeStore.questions;
  }

  get recipes(): DerivedRecipe[] {
    return this.recipeStore.recipes;
  }

  get tabs(): Tab[] | null {
    return this.aggRunner.result?.tabs ?? null;
  }

  async initialize(): Promise<string | null> {
    return this.enqueue(async () => {
      await this.recipeStore.restoreInitial();
      if (this.recipeStore.error) return this.recipeStore.error;
      const error = await this.refresh();
      this.ready = error === null;
      return error;
    });
  }

  async setCrossAxis(code: string, enabled: boolean): Promise<string | null> {
    return this.enqueue(async () => {
      if (!this.questions.some((question) => question.code === code)) {
        return `設問 "${code}" が見つかりません`;
      }
      if ((this.aggRunner.crossSelected[code] ?? false) === enabled) return null;

      this.aggRunner.toggleCross(code, enabled);
      this.stateRevision++;
      return this.refresh();
    });
  }

  async setWeighting(enabled: boolean): Promise<string | null> {
    return this.enqueue(async () => {
      if (enabled && !this.recipeStore.weightColumnName) {
        return "このデータセットにはウェイト列がありません";
      }
      if (this.aggRunner.weightEnabled === enabled) return null;

      this.aggRunner.toggleWeight(enabled);
      this.stateRevision++;
      return this.refresh();
    });
  }

  async upsertRecipe(recipe: DerivedRecipe): Promise<string | null> {
    return this.enqueue(async () => {
      const existing = this.recipes.find((candidate) => candidate.code === recipe.code);
      if (existing && existing.type !== recipe.type) {
        return `RECIPE_TYPE_MISMATCH: "${recipe.code}" は ${existing.type} として登録済みです`;
      }
      if (existing && JSON.stringify(existing) === JSON.stringify(recipe)) return null;

      const next = existing
        ? this.recipes.map((candidate) => (candidate.code === recipe.code ? recipe : candidate))
        : [...this.recipes, recipe];
      return this.applyRecipes(next);
    });
  }

  async commitRecipes(recipes: DerivedRecipe[]): Promise<string | null> {
    return this.enqueue(() => this.applyRecipes(recipes));
  }

  async deleteRecipe(code: string): Promise<string | null> {
    return this.enqueue(async () => {
      if (!this.recipes.some((recipe) => recipe.code === code)) {
        return `レシピ "${code}" が見つかりません`;
      }

      await this.recipeStore.remove(code);
      this.aggRunner.pruneCode(code);
      this.stateRevision++;
      return this.refresh();
    });
  }

  private async refresh(): Promise<string | null> {
    await this.aggRunner.run(
      this.questions,
      this.recipeStore.weightColumnName,
      this.recipeStore.matrixLabels,
    );
    if (this.aggRunner.error) return this.aggRunner.error;
    this.resultRevision = this.stateRevision;
    return null;
  }

  private async applyRecipes(recipes: DerivedRecipe[]): Promise<string | null> {
    const error = await this.recipeStore.commit(recipes);
    if (error) return error;

    this.stateRevision++;
    return this.refresh();
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.pending.then(operation, operation);
    this.pending = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
