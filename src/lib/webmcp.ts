import { tick } from "svelte";
import type { AnalysisSession } from "./analysisSession.svelte";
import type { BinDef, BinNARecipe, CombineSARecipe, DerivedRecipe } from "./derivedRecipe";
import type { QuestionType, Slice, Tab } from "./types";

type Input = Record<string, unknown>;

const emptySchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

function fail(code: string, message: string): never {
  throw new Error(`${code}: ${message}`);
}

function stringValue(input: Input, key: string): string {
  const value = input[key];
  if (typeof value !== "string" || value.trim() === "") {
    fail("INVALID_INPUT", `${key} must be a non-empty string`);
  }
  return value;
}

function optionalString(input: Input, key: string): string | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") {
    fail("INVALID_INPUT", `${key} must be a non-empty string`);
  }
  return value;
}

function booleanValue(input: Input, key: string): boolean {
  const value = input[key];
  if (typeof value !== "boolean") fail("INVALID_INPUT", `${key} must be a boolean`);
  return value;
}

function integerValue(
  input: Input,
  key: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const value = input[key] ?? fallback;
  if (!Number.isInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    fail("INVALID_INPUT", `${key} must be an integer from ${minimum} to ${maximum}`);
  }
  return value as number;
}

function stringArray(input: Input, key: string): string[] {
  const value = input[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item === "")) {
    fail("INVALID_INPUT", `${key} must be an array of non-empty strings`);
  }
  return value;
}

function binsValue(input: Input): BinDef[] {
  const value = input.bins;
  if (!Array.isArray(value)) fail("INVALID_INPUT", "bins must be an array");
  return value.map((candidate, index) => {
    if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
      fail("INVALID_INPUT", `bins[${index}] must be an object`);
    }
    const bin = candidate as Input;
    const min = bin.min;
    const max = bin.max;
    if (min !== null && typeof min !== "number") {
      fail("INVALID_INPUT", `bins[${index}].min must be a number or null`);
    }
    if (max !== null && typeof max !== "number") {
      fail("INVALID_INPUT", `bins[${index}].max must be a number or null`);
    }
    return {
      code: stringValue(bin, "code"),
      label: stringValue(bin, "label"),
      min,
      max,
    };
  });
}

function annotations(readOnlyHint: boolean): WebMCP.ToolAnnotations {
  return { readOnlyHint, untrustedContentHint: true };
}

function questionTypeCounts(session: AnalysisSession): Record<QuestionType, number> {
  const counts: Record<QuestionType, number> = { SA: 0, MA: 0, NA: 0 };
  for (const question of session.questions) counts[question.type]++;
  return counts;
}

function recipeSummary(recipe: DerivedRecipe): Pick<DerivedRecipe, "type" | "code" | "label"> {
  return { type: recipe.type, code: recipe.code, label: recipe.label };
}

function analysisState(session: AnalysisSession) {
  return {
    ready: session.ready,
    crossAxes: session.questions
      .filter((question) => session.aggRunner.crossSelected[question.code])
      .map(({ code, label }) => ({ code, label })),
    weighting: {
      available: session.recipeStore.weightColumnName !== "",
      enabled: session.aggRunner.weightEnabled && session.recipeStore.weightColumnName !== "",
      column: session.recipeStore.weightColumnName || null,
    },
    recipes: session.recipes.map(recipeSummary),
    stateRevision: session.stateRevision,
    resultRevision: session.resultRevision,
    aggregation: session.aggRunner.error
      ? "error"
      : session.resultRevision === session.stateRevision
        ? "ready"
        : "running",
    error: session.aggRunner.error || session.recipeStore.error || null,
  };
}

async function runMutation(
  operation: () => Promise<string | null>,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  const error = await operation();
  if (error) fail("OPERATION_FAILED", error);
  await tick();
  signal.throwIfAborted();
}

function sliceResult(tab: Tab, slice: Slice, offset: number, limit: number) {
  const end = Math.min(offset + limit, tab.codes.length);
  const values = tab.codes.slice(offset, end).map((code, index) => {
    const cell = slice.cells[offset + index];
    return { code, label: tab.labels[code] ?? code, count: cell.count, pct: cell.pct };
  });
  return {
    question: { code: tab.questionCode, label: tab.label, type: tab.type },
    crossAxis: tab.by ? { code: tab.by.code, label: tab.by.label } : null,
    slice: {
      code: slice.code,
      label: slice.code === null ? "Grand Total" : (tab.by?.labels[slice.code] ?? slice.code),
      n: slice.n,
    },
    values,
    stats: slice.stats ?? null,
    categories: {
      offset,
      returned: values.length,
      total: tab.codes.length,
      nextOffset: end < tab.codes.length ? end : null,
    },
  };
}

function readTools(session: AnalysisSession): WebMCP.ModelContextTool[] {
  return [
    {
      name: "get_dataset_summary",
      title: "Get dataset summary",
      description:
        "Read the loaded survey file names, dimensions, question counts, and capabilities.",
      inputSchema: emptySchema,
      annotations: annotations(true),
      execute: () => ({
        rawData: {
          fileName: session.rawData.fileName,
          rows: session.rawData.rowCount,
          columns: session.rawData.headers.length,
        },
        layoutFileName: session.layoutData.fileName,
        questions: { total: session.questions.length, byType: questionTypeCounts(session) },
        derivedRecipes: session.recipes.length,
        weightingAvailable: session.recipeStore.weightColumnName !== "",
        stateRevision: session.stateRevision,
      }),
    },
    {
      name: "list_questions",
      title: "List survey questions",
      description: "List concise survey question metadata with optional type and text filters.",
      inputSchema: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["SA", "MA", "NA"] },
          query: { type: "string", description: "Text matched against question code and label." },
          offset: { type: "integer", minimum: 0, default: 0 },
          limit: { type: "integer", minimum: 1, maximum: 20, default: 20 },
        },
        additionalProperties: false,
      },
      annotations: annotations(true),
      execute: (input) => {
        const type = optionalString(input, "type");
        if (type !== undefined && type !== "SA" && type !== "MA" && type !== "NA") {
          fail("INVALID_INPUT", "type must be SA, MA, or NA");
        }
        const query = optionalString(input, "query")?.toLocaleLowerCase();
        const offset = integerValue(input, "offset", 0, 0, Number.MAX_SAFE_INTEGER);
        const limit = integerValue(input, "limit", 20, 1, 20);
        const derived = new Set(session.recipes.map((recipe) => recipe.code));
        const matches = session.questions.filter(
          (question) =>
            (type === undefined || question.type === type) &&
            (query === undefined ||
              question.code.toLocaleLowerCase().includes(query) ||
              question.label.toLocaleLowerCase().includes(query)),
        );
        const items = matches.slice(offset, offset + limit).map((question) => ({
          code: question.code,
          label: question.label,
          type: question.type,
          derived: derived.has(question.code),
          matrixKey: question.matrixKey,
        }));
        const nextOffset = offset + items.length;
        return {
          items,
          total: matches.length,
          nextOffset: nextOffset < matches.length ? nextOffset : null,
        };
      },
    },
    {
      name: "get_question",
      title: "Get survey question",
      description: "Read one survey question including its answer codes and labels.",
      inputSchema: {
        type: "object",
        properties: {
          code: { type: "string", description: "Question code." },
          answerOffset: { type: "integer", minimum: 0, default: 0 },
          answerLimit: { type: "integer", minimum: 1, maximum: 20, default: 20 },
        },
        required: ["code"],
        additionalProperties: false,
      },
      annotations: annotations(true),
      execute: (input) => {
        const code = stringValue(input, "code");
        const question = session.questions.find((candidate) => candidate.code === code);
        if (!question) fail("QUESTION_NOT_FOUND", `Question "${code}" was not found`);
        const offset = integerValue(input, "answerOffset", 0, 0, Number.MAX_SAFE_INTEGER);
        const limit = integerValue(input, "answerLimit", 20, 1, 20);
        const end = Math.min(offset + limit, question.codes.length);
        return {
          code: question.code,
          label: question.label,
          type: question.type,
          matrixKey: question.matrixKey,
          columns: question.columns,
          answers: question.codes
            .slice(offset, end)
            .map((answerCode) => ({ code: answerCode, label: question.labels[answerCode] })),
          answerPage: {
            offset,
            returned: Math.max(0, end - offset),
            total: question.codes.length,
            nextOffset: end < question.codes.length ? end : null,
          },
        };
      },
    },
    {
      name: "get_analysis_state",
      title: "Get analysis state",
      description: "Read current cross axes, weighting, recipe summaries, and result revision.",
      inputSchema: emptySchema,
      annotations: annotations(true),
      execute: () => analysisState(session),
    },
    {
      name: "get_recipe",
      title: "Get derived recipe",
      description: "Read the complete definition of one derived-question recipe.",
      inputSchema: {
        type: "object",
        properties: { code: { type: "string", description: "Derived question code." } },
        required: ["code"],
        additionalProperties: false,
      },
      annotations: annotations(true),
      execute: (input) => {
        const code = stringValue(input, "code");
        const recipe = session.recipes.find((candidate) => candidate.code === code);
        if (!recipe) fail("RECIPE_NOT_FOUND", `Recipe "${code}" was not found`);
        return recipe;
      },
    },
    {
      name: "get_aggregation_result",
      title: "Get aggregation result",
      description:
        "Read one current grand-total slice, or one slice of a selected cross axis. Supports category pagination.",
      inputSchema: {
        type: "object",
        properties: {
          questionCode: { type: "string", description: "Question to read." },
          crossAxisCode: { type: "string", description: "Currently selected cross-axis question." },
          sliceCode: {
            type: "string",
            description: "One answer code from the cross-axis question.",
          },
          categoryOffset: { type: "integer", minimum: 0, default: 0 },
          categoryLimit: { type: "integer", minimum: 1, maximum: 20, default: 10 },
        },
        required: ["questionCode"],
        additionalProperties: false,
      },
      annotations: annotations(true),
      execute: (input) => {
        if (!session.ready || session.resultRevision !== session.stateRevision || !session.tabs) {
          fail("RESULT_NOT_READY", "The current aggregation result is not ready");
        }
        const questionCode = stringValue(input, "questionCode");
        const crossAxisCode = optionalString(input, "crossAxisCode");
        const requestedSliceCode = optionalString(input, "sliceCode");
        if ((crossAxisCode === undefined) !== (requestedSliceCode === undefined)) {
          fail("INVALID_INPUT", "crossAxisCode and sliceCode must be provided together");
        }
        if (crossAxisCode && !session.aggRunner.crossSelected[crossAxisCode]) {
          fail("CROSS_AXIS_NOT_SELECTED", `Enable cross axis "${crossAxisCode}" first`);
        }
        const tab = session.tabs.find(
          (candidate) =>
            candidate.questionCode === questionCode &&
            (crossAxisCode === undefined
              ? candidate.by === null
              : candidate.by?.code === crossAxisCode),
        );
        if (!tab)
          fail("RESULT_NOT_FOUND", "No matching result exists in the current analysis state");
        const slice = tab.slices.find((candidate) =>
          requestedSliceCode === undefined
            ? candidate.code === null
            : candidate.code === requestedSliceCode,
        );
        if (!slice) fail("SLICE_NOT_FOUND", `Slice "${requestedSliceCode}" was not found`);
        const offset = integerValue(input, "categoryOffset", 0, 0, Number.MAX_SAFE_INTEGER);
        const limit = integerValue(input, "categoryLimit", 10, 1, 20);
        return {
          ...sliceResult(tab, slice, offset, limit),
          weighting: {
            enabled: session.aggRunner.result?.weightCol !== "",
            column: session.aggRunner.result?.weightCol || null,
          },
          resultRevision: session.resultRevision,
        };
      },
    },
  ];
}

function writeTools(session: AnalysisSession): WebMCP.ModelContextTool[] {
  return [
    {
      name: "set_cross_axis",
      title: "Set cross axis",
      description:
        "Enable or disable one survey question as a cross-tabulation axis and refresh results.",
      inputSchema: {
        type: "object",
        properties: {
          code: { type: "string", description: "Question code." },
          enabled: { type: "boolean", description: "Whether the cross axis is selected." },
        },
        required: ["code", "enabled"],
        additionalProperties: false,
      },
      annotations: annotations(false),
      execute: async (input, { signal }) => {
        const code = stringValue(input, "code");
        const enabled = booleanValue(input, "enabled");
        await runMutation(() => session.setCrossAxis(code, enabled), signal);
        return {
          code,
          enabled,
          stateRevision: session.stateRevision,
          resultRevision: session.resultRevision,
        };
      },
    },
    {
      name: "set_weighting",
      title: "Set weighting",
      description: "Enable or disable the dataset's configured weight column and refresh results.",
      inputSchema: {
        type: "object",
        properties: { enabled: { type: "boolean", description: "Whether weighting is enabled." } },
        required: ["enabled"],
        additionalProperties: false,
      },
      annotations: annotations(false),
      execute: async (input, { signal }) => {
        const enabled = booleanValue(input, "enabled");
        await runMutation(() => session.setWeighting(enabled), signal);
        return {
          enabled,
          stateRevision: session.stateRevision,
          resultRevision: session.resultRevision,
        };
      },
    },
    {
      name: "set_combine_sa_recipe",
      title: "Set combined SA recipe",
      description: "Create or replace a same-code recipe that combines two or more SA questions.",
      inputSchema: {
        type: "object",
        properties: {
          code: { type: "string", description: "Stable code for the derived SA question." },
          label: { type: "string", description: "Display label for the derived question." },
          sources: { type: "array", items: { type: "string" }, minItems: 2 },
          separator: { type: "string", description: "Optional separator between source codes." },
        },
        required: ["code", "label", "sources"],
        additionalProperties: false,
      },
      annotations: annotations(false),
      execute: async (input, { signal }) => {
        const separator = optionalString(input, "separator");
        const recipe: CombineSARecipe = {
          type: "combineSA",
          code: stringValue(input, "code"),
          label: stringValue(input, "label"),
          sources: stringArray(input, "sources"),
          ...(separator === undefined ? {} : { separator }),
        };
        await runMutation(() => session.upsertRecipe(recipe), signal);
        return {
          recipe: recipeSummary(recipe),
          stateRevision: session.stateRevision,
          resultRevision: session.resultRevision,
        };
      },
    },
    {
      name: "set_bin_na_recipe",
      title: "Set numeric bins recipe",
      description:
        "Create or replace a same-code recipe that bins one NA question into SA categories.",
      inputSchema: {
        type: "object",
        properties: {
          code: { type: "string", description: "Stable code for the derived SA question." },
          label: { type: "string", description: "Display label for the derived question." },
          source: { type: "string", description: "Source NA question code." },
          bins: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              properties: {
                code: { type: "string" },
                label: { type: "string" },
                min: { type: ["number", "null"], description: "Inclusive lower bound." },
                max: { type: ["number", "null"], description: "Exclusive upper bound." },
              },
              required: ["code", "label", "min", "max"],
              additionalProperties: false,
            },
          },
        },
        required: ["code", "label", "source", "bins"],
        additionalProperties: false,
      },
      annotations: annotations(false),
      execute: async (input, { signal }) => {
        const recipe: BinNARecipe = {
          type: "binNA",
          code: stringValue(input, "code"),
          label: stringValue(input, "label"),
          source: stringValue(input, "source"),
          bins: binsValue(input),
        };
        await runMutation(() => session.upsertRecipe(recipe), signal);
        return {
          recipe: recipeSummary(recipe),
          stateRevision: session.stateRevision,
          resultRevision: session.resultRevision,
        };
      },
    },
    {
      name: "delete_recipe",
      title: "Delete derived recipe",
      description: "Delete one derived-question recipe by code and refresh the analysis results.",
      inputSchema: {
        type: "object",
        properties: { code: { type: "string", description: "Derived question code." } },
        required: ["code"],
        additionalProperties: false,
      },
      annotations: annotations(false),
      execute: async (input, { signal }) => {
        const code = stringValue(input, "code");
        await runMutation(() => session.deleteRecipe(code), signal);
        return {
          deleted: code,
          stateRevision: session.stateRevision,
          resultRevision: session.resultRevision,
        };
      },
    },
  ];
}

export function createAggyWebMcpTools(session: AnalysisSession): WebMCP.ModelContextTool[] {
  return [...readTools(session), ...writeTools(session)];
}

export async function registerAggyWebMcpTools(session: AnalysisSession): Promise<() => void> {
  if (typeof document.modelContext?.registerTool !== "function") return () => {};

  const controller = new AbortController();
  try {
    for (const tool of createAggyWebMcpTools(session)) {
      await document.modelContext.registerTool(tool, { signal: controller.signal });
    }
  } catch (error) {
    controller.abort();
    throw error;
  }
  return () => controller.abort();
}
