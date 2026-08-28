import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { DerivedRecipe } from "../src/lib/derivedRecipe";
import type { Layout } from "../src/lib/layout";
import type { Question, Tab } from "../src/lib/types";
import { AnalysisSession } from "../src/lib/analysisSession.svelte";
import { dropDerivedColumn, prepareDerivedLayout, runAggregation } from "../src/lib/duckdb.svelte";

vi.mock(import("../src/lib/duckdb.svelte"), () => ({
  dropDerivedColumn: vi.fn<(code: string) => Promise<void>>(async () => {}),
  prepareDerivedLayout:
    vi.fn<
      (base: Layout, recipes: DerivedRecipe[]) => Promise<{ layout: Layout; warnings: string[] }>
    >(),
  runAggregation:
    vi.fn<
      (
        questions: Question[],
        crossQuestions: Question[],
        weightCol: string,
        matrixLabels?: Record<string, string>,
      ) => Promise<Tab[]>
    >(),
}));

const layout: Layout = [
  {
    type: "SA",
    key: "q1",
    label: "Gender",
    items: [
      { code: "1", label: "Male" },
      { code: "2", label: "Female" },
    ],
  },
  {
    type: "SA",
    key: "q2",
    label: "Satisfaction",
    items: [
      { code: "1", label: "Good" },
      { code: "2", label: "Bad" },
    ],
  },
  { type: "NA", key: "age", label: "Age" },
  { type: "WEIGHT", key: "weight", label: "Weight" },
];

function createSession() {
  return new AnalysisSession(
    { fileName: "survey.csv", headers: ["q1", "q2", "age", "weight"], rowCount: 2 },
    { fileName: "layout.json", rawJson: layout },
    layout,
    [],
  );
}

describe("AnalysisSession behavior", () => {
  beforeEach(() => {
    vi.mocked(runAggregation).mockReset().mockResolvedValue([]);
    vi.mocked(prepareDerivedLayout)
      .mockReset()
      .mockImplementation(async (base) => ({
        layout: base,
        warnings: [],
      }));
    vi.mocked(dropDerivedColumn).mockClear();
  });

  it("keeps state and result revisions aligned after a completed mutation", async () => {
    const session = createSession();
    expect(await session.initialize()).toBeNull();

    expect(await session.setCrossAxis("q1", true)).toBeNull();

    expect(session.aggRunner.crossSelected.q1).toBe(true);
    expect(session.stateRevision).toBe(1);
    expect(session.resultRevision).toBe(1);
    expect(runAggregation).toHaveBeenCalledTimes(2);
  });

  it("serializes concurrent analysis mutations", async () => {
    let active = 0;
    let maxActive = 0;
    vi.mocked(runAggregation).mockImplementation(async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await Promise.resolve();
      active--;
      return [];
    });
    const session = createSession();
    await session.initialize();

    await Promise.all([session.setCrossAxis("q1", true), session.setCrossAxis("q2", true)]);

    expect(maxActive).toBe(1);
    expect(session.stateRevision).toBe(2);
    expect(session.resultRevision).toBe(2);
  });

  it("upserts a same-type recipe and rejects a type change for the same code", async () => {
    const session = createSession();
    await session.initialize();

    expect(
      await session.upsertRecipe({
        type: "combineSA",
        code: "combined",
        label: "Combined",
        sources: ["q1", "q2"],
      }),
    ).toBeNull();
    expect(session.recipes).toHaveLength(1);
    const revision = session.stateRevision;
    expect(
      await session.upsertRecipe({
        type: "combineSA",
        code: "combined",
        label: "Combined",
        sources: ["q1", "q2"],
      }),
    ).toBeNull();
    expect(session.stateRevision).toBe(revision);

    const error = await session.upsertRecipe({
      type: "binNA",
      code: "combined",
      label: "Age group",
      source: "age",
      bins: [{ code: "young", label: "Young", min: null, max: 30 }],
    });
    expect(error).toContain("RECIPE_TYPE_MISMATCH");
    expect(session.recipes[0].type).toBe("combineSA");
  });

  it("deletes a recipe and removes it from the selected cross axes", async () => {
    const session = new AnalysisSession(
      { fileName: "survey.csv", headers: ["q1", "q2", "age", "weight"], rowCount: 2 },
      { fileName: "layout.json", rawJson: layout },
      layout,
      [{ type: "combineSA", code: "combined", label: "Combined", sources: ["q1", "q2"] }],
    );
    await session.initialize();
    session.aggRunner.toggleCross("combined", true);

    expect(await session.deleteRecipe("combined")).toBeNull();

    expect(session.recipes).toEqual([]);
    expect(session.aggRunner.crossSelected.combined).toBeUndefined();
    expect(dropDerivedColumn).toHaveBeenCalledWith("combined");
  });
});
