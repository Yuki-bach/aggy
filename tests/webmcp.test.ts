/// <reference types="webmcp-types" />

import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { AnalysisSession } from "../src/lib/analysisSession.svelte";
import type { Question, Tab } from "../src/lib/types";
import { createAggyWebMcpTools, registerAggyWebMcpTools } from "../src/lib/webmcp";

const questions: Question[] = [
  {
    type: "SA",
    code: "q1",
    columns: ["q1"],
    codes: ["1", "2"],
    label: "Gender",
    labels: { "1": "Male", "2": "Female" },
    matrixKey: null,
  },
  {
    type: "SA",
    code: "q2",
    columns: ["q2"],
    codes: ["1", "2"],
    label: "Satisfaction",
    labels: { "1": "Good", "2": "Bad" },
    matrixKey: null,
  },
];

const tabs: Tab[] = [
  {
    type: "SA",
    questionCode: "q2",
    label: "Satisfaction",
    by: null,
    codes: ["1", "2"],
    labels: { "1": "Good", "2": "Bad" },
    slices: [
      {
        code: null,
        n: 10,
        cells: [
          { count: 7, pct: 70 },
          { count: 3, pct: 30 },
        ],
      },
    ],
    matrix: null,
  },
  {
    type: "SA",
    questionCode: "q2",
    label: "Satisfaction",
    by: { code: "q1", label: "Gender", labels: { "1": "Male", "2": "Female" } },
    codes: ["1", "2"],
    labels: { "1": "Good", "2": "Bad" },
    slices: [
      {
        code: "1",
        n: 4,
        cells: [
          { count: 3, pct: 75 },
          { count: 1, pct: 25 },
        ],
      },
      {
        code: "2",
        n: 6,
        cells: [
          { count: 4, pct: 66.7 },
          { count: 2, pct: 33.3 },
        ],
      },
    ],
    matrix: null,
  },
];

function createSession() {
  const setCrossAxis = vi.fn<(code: string, enabled: boolean) => Promise<string | null>>(
    async () => null,
  );
  const setWeighting = vi.fn<(enabled: boolean) => Promise<string | null>>(async () => null);
  const upsertRecipe = vi.fn<AnalysisSession["upsertRecipe"]>(async () => null);
  const deleteRecipe = vi.fn<(code: string) => Promise<string | null>>(async () => null);
  const session = {
    rawData: { fileName: "survey.csv", headers: ["q1", "q2"], rowCount: 10 },
    layoutData: { fileName: "layout.json", rawJson: [] },
    questions,
    recipes: [],
    recipeStore: { weightColumnName: "weight", error: "" },
    aggRunner: {
      crossSelected: { q1: true },
      weightEnabled: true,
      result: { tabs, weightCol: "weight" },
      error: "",
    },
    tabs,
    ready: true,
    stateRevision: 2,
    resultRevision: 2,
    setCrossAxis,
    setWeighting,
    upsertRecipe,
    deleteRecipe,
  } as unknown as AnalysisSession;
  return { session, setCrossAxis, setWeighting, upsertRecipe, deleteRecipe };
}

function findTool(session: AnalysisSession, name: string): WebMCP.ModelContextTool {
  const tool = createAggyWebMcpTools(session).find((candidate) => candidate.name === name);
  if (!tool) throw new Error(`Missing tool: ${name}`);
  return tool;
}

const executionOptions = () => ({ signal: new AbortController().signal });

describe("Aggy WebMCP tool contracts", () => {
  it("registers small non-overlapping tools with security annotations", () => {
    const tools = createAggyWebMcpTools(createSession().session);

    expect(tools.map((tool) => tool.name)).toEqual([
      "get_dataset_summary",
      "list_questions",
      "get_question",
      "get_analysis_state",
      "get_recipe",
      "get_aggregation_result",
      "set_cross_axis",
      "set_weighting",
      "set_combine_sa_recipe",
      "set_bin_na_recipe",
      "delete_recipe",
    ]);
    expect(new Set(tools.map((tool) => tool.name)).size).toBe(tools.length);
    expect(tools.every((tool) => tool.name.length <= 30)).toBe(true);
    expect(tools.every((tool) => tool.description.length <= 500)).toBe(true);
    expect(tools.slice(0, 6).every((tool) => tool.annotations?.readOnlyHint)).toBe(true);
    expect(tools.slice(6).every((tool) => tool.annotations?.readOnlyHint === false)).toBe(true);
    expect(tools.every((tool) => tool.annotations?.untrustedContentHint)).toBe(true);
  });

  it("returns a paginated current aggregation slice without raw rows", async () => {
    const result = await findTool(createSession().session, "get_aggregation_result").execute(
      { questionCode: "q2", categoryLimit: 1 },
      executionOptions(),
    );

    expect(result).toMatchObject({
      question: { code: "q2" },
      crossAxis: null,
      slice: { code: null, n: 10 },
      values: [{ code: "1", count: 7, pct: 70 }],
      categories: { returned: 1, total: 2, nextOffset: 1 },
      resultRevision: 2,
    });
    expect(JSON.stringify(result)).not.toContain("headers");
  });

  it("paginates question answers to keep tool output small", async () => {
    const result = await findTool(createSession().session, "get_question").execute(
      { code: "q1", answerLimit: 1 },
      executionOptions(),
    );

    expect(result).toMatchObject({
      code: "q1",
      answers: [{ code: "1", label: "Male" }],
      answerPage: { returned: 1, total: 2, nextOffset: 1 },
    });
  });

  it("requires selecting a cross axis before reading its result", async () => {
    const { session } = createSession();
    session.aggRunner.crossSelected.q1 = false;

    expect(() =>
      findTool(session, "get_aggregation_result").execute(
        { questionCode: "q2", crossAxisCode: "q1", sliceCode: "1" },
        executionOptions(),
      ),
    ).toThrow("CROSS_AXIS_NOT_SELECTED");
  });

  it("delegates a cross-axis mutation to the shared session", async () => {
    const { session, setCrossAxis } = createSession();
    await findTool(session, "set_cross_axis").execute(
      { code: "q2", enabled: true },
      executionOptions(),
    );

    expect(setCrossAxis).toHaveBeenCalledWith("q2", true);
  });

  it("builds a typed bin recipe and delegates its upsert", async () => {
    const { session, upsertRecipe } = createSession();
    await findTool(session, "set_bin_na_recipe").execute(
      {
        code: "age_group",
        label: "Age group",
        source: "age",
        bins: [{ code: "young", label: "Young", min: null, max: 30 }],
      },
      executionOptions(),
    );

    expect(upsertRecipe).toHaveBeenCalledWith({
      type: "binNA",
      code: "age_group",
      label: "Age group",
      source: "age",
      bins: [{ code: "young", label: "Young", min: null, max: 30 }],
    });
  });
});

describe("Aggy WebMCP registration lifecycle", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("feature-detects unsupported browsers", async () => {
    vi.stubGlobal("document", {});
    const cleanup = await registerAggyWebMcpTools(createSession().session);
    expect(cleanup).toBeTypeOf("function");
    cleanup();
  });

  it("registers on the current page and unregisters with one abort signal", async () => {
    const signals: AbortSignal[] = [];
    const registerTool = vi.fn<
      (
        tool: WebMCP.ModelContextTool,
        options?: WebMCP.ModelContextRegisterToolOptions,
      ) => Promise<void>
    >(async (_tool, options) => {
      if (options?.signal) signals.push(options.signal);
    });
    vi.stubGlobal("document", { modelContext: { registerTool } });

    const cleanup = await registerAggyWebMcpTools(createSession().session);

    expect(registerTool).toHaveBeenCalledTimes(11);
    expect(signals.every((signal) => !signal.aborted)).toBe(true);
    expect(registerTool.mock.calls.every((call) => call[1]?.exposedTo === undefined)).toBe(true);
    cleanup();
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });
});
