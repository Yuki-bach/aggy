import type { Question, Tab } from "./types";
import { runAggregation } from "./duckdb.svelte";
import { t } from "./i18n.svelte";

export class AggRunner {
  crossSelected = $state<Record<string, boolean>>({});
  weightEnabled = $state(true);
  result = $state<{ tabs: Tab[]; weightCol: string } | null>(null);
  error = $state("");

  // Increments per scheduled run; only the latest run is allowed to commit results.
  private latestRunId = 0;

  toggleCross(code: string, on: boolean): void {
    this.crossSelected = { ...this.crossSelected, [code]: on };
  }

  toggleWeight(on: boolean): void {
    this.weightEnabled = on;
  }

  /** Drop a code from crossSelected — call after RecipeStore.remove(code). */
  pruneCode(code: string): void {
    if (!(code in this.crossSelected)) return;
    const next = { ...this.crossSelected };
    delete next[code];
    this.crossSelected = next;
  }

  async run(
    questions: Question[],
    weightColumnName: string,
    matrixLabels: Record<string, string>,
  ): Promise<void> {
    const runId = ++this.latestRunId;
    const activeWeightCol = this.weightEnabled ? weightColumnName : "";
    const crossQuestions = questions.filter((q) => this.crossSelected[q.code]);

    try {
      const tabs = await runAggregation(questions, crossQuestions, activeWeightCol, matrixLabels);
      if (runId !== this.latestRunId) return;
      this.result = { tabs, weightCol: activeWeightCol };
      this.error = "";
    } catch (e) {
      if (runId !== this.latestRunId) return;
      this.error = t("error.aggregation", { msg: (e as Error).message });
    }
  }
}
